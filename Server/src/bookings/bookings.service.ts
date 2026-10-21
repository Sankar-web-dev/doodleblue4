import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { SYSTEM_ROLE } from '../common/constants.js';
import { StripeService } from '../stripe/stripe.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { UserModel } from '../generated/prisma/models.js';
import type {
  AvailabilityQueryDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingStatusDto,
} from './dto.js';

/** Booking statuses that hold a slot for overlap checks. */
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

/** Relations returned with every booking payload. */
const BOOKING_INCLUDE = {
  game: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      imageUrl: true,
      capacity: true,
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.BookingInclude;

/** Round to 2 decimal places — Decimal(10,2) money fields. */
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  private isAdmin(user: UserModel) {
    return user.role === SYSTEM_ROLE;
  }

  // ── create ──────────────────────────────────────────────────────────────

  /**
   * Create a booking:
   *  - PAY_AT_CENTRE → CONFIRMED immediately (slot held, pay on arrival)
   *  - STRIPE        → PENDING until checkout.session.completed confirms it;
   *                    a Checkout URL is returned for the customer to pay.
   * Prices are always calculated server-side from the game's current price
   * and the customer's active membership discount — never from the request.
   */
  async createBooking(user: UserModel, input: CreateBookingDto) {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new ApiException(400, 'INVALID_TIME', 'Invalid start/end time');
    }
    if (endAt <= startAt) {
      throw new ApiException(
        400,
        'INVALID_TIME',
        'endAt must be after startAt',
      );
    }
    if (startAt.getTime() < Date.now()) {
      throw new ApiException(
        400,
        'PAST_BOOKING',
        'Bookings cannot start in the past',
      );
    }

    const durationMinutes = Math.round(
      (endAt.getTime() - startAt.getTime()) / 60_000,
    );

    const game = await this.prisma.game.findUnique({
      where: { id: input.gameId },
    });
    if (!game || game.status !== 'ACTIVE') {
      throw new ApiException(404, 'GAME_NOT_FOUND', 'Game not available');
    }
    if (
      durationMinutes < game.minBookingMins ||
      durationMinutes > game.maxBookingMins
    ) {
      throw new ApiException(
        400,
        'INVALID_DURATION',
        `Duration must be between ${game.minBookingMins} and ${game.maxBookingMins} minutes for this game`,
      );
    }

    // Active membership discount — snapshotted onto the booking.
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { membershipPlan: true },
    });
    const memberPlan =
      subscription &&
      ['active', 'trialing'].includes(subscription.status) &&
      subscription.membershipPlan
        ? subscription.membershipPlan
        : null;
    const discountPercent = memberPlan
      ? Number(memberPlan.discountPercent)
      : 0;

    // Server-side pricing — the client never sets amounts.
    const baseAmount = round2(
      (Number(game.pricePerHour) * durationMinutes) / 60,
    );
    const discountAmount = round2((baseAmount * discountPercent) / 100);
    const totalAmount = round2(baseAmount - discountAmount);

    // Overlap check + insert inside one transaction so two simultaneous
    // requests can't double-book past capacity.
    const booking = await this.prisma.$transaction(async (tx) => {
      const overlapping = await tx.booking.count({
        where: {
          gameId: game.id,
          status: { in: [...ACTIVE_STATUSES] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });
      if (overlapping >= game.capacity) {
        throw new ApiException(
          409,
          'SLOT_UNAVAILABLE',
          'This time slot is fully booked — pick another time',
        );
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          gameId: game.id,
          startAt,
          endAt,
          durationMinutes,
          baseAmount,
          discountPercent,
          discountAmount,
          totalAmount,
          membershipPlanName: memberPlan?.name ?? null,
          membershipId: subscription?.id ?? null,
          status:
            input.paymentMethod === 'PAY_AT_CENTRE'
              ? 'CONFIRMED'
              : 'PENDING',
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PENDING',
          customerNote: input.customerNote,
        },
        include: BOOKING_INCLUDE,
      });
    });

    // Online payment → create a Stripe Checkout Session + pending Payment.
    if (input.paymentMethod === 'STRIPE') {
      const checkout = await this.stripe.createBookingCheckout(
        { id: user.id, email: user.email },
        booking,
      );
      await this.prisma.payment.create({
        data: {
          userId: user.id,
          bookingId: booking.id,
          type: 'GAME_BOOKING',
          amount: totalAmount,
          currency: booking.currency,
          stripeCheckoutSessionId: checkout.sessionId,
        },
      });
      return { booking, checkoutUrl: checkout.url };
    }

    return { booking, checkoutUrl: null };
  }

  // ── list / view ─────────────────────────────────────────────────────────

  /** Customers see their own bookings; admins see everything (+ filters). */
  async listBookings(query: ListBookingsQueryDto, user: UserModel) {
    const admin = this.isAdmin(user);
    const where: Prisma.BookingWhereInput = {};

    if (admin) {
      if (query.userId) where.userId = query.userId;
    } else {
      where.userId = user.id;
    }

    if (query.status) {
      where.status = query.status;
    } else if (query.includeCancelled === false) {
      where.status = { not: 'CANCELLED' };
    }
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.gameId) where.gameId = query.gameId;
    if (query.from || query.to) {
      where.startAt = {};
      if (query.from) where.startAt.gte = new Date(query.from);
      if (query.to) where.startAt.lte = new Date(query.to);
    }

    const { skip, take } = pageParams(query);
    const [total, data] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
    ]);

    return { data, meta: listMeta(total, query.page, query.limit) };
  }

  async getBooking(id: string, user: UserModel) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { ...BOOKING_INCLUDE, payments: true },
    });
    if (!booking) {
      throw new ApiException(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }
    if (!this.isAdmin(user) && booking.userId !== user.id) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'You can only view your own bookings',
      );
    }
    return booking;
  }

  // ── availability ────────────────────────────────────────────────────────

  /**
   * Booked intervals for a game on a given day — the client greys out
   * full slots (taking game.capacity into account).
   */
  async getAvailability(query: AvailabilityQueryDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: query.gameId },
      select: { id: true, capacity: true, status: true },
    });
    if (!game || game.status !== 'ACTIVE') {
      throw new ApiException(404, 'GAME_NOT_FOUND', 'Game not available');
    }

    const dayStart = new Date(`${query.date}T00:00:00`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        gameId: game.id,
        status: { in: [...ACTIVE_STATUSES] },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true },
      orderBy: { startAt: 'asc' },
    });

    return {
      gameId: game.id,
      date: query.date,
      capacity: game.capacity,
      slots: bookings.map((b) => ({
        startAt: b.startAt,
        endAt: b.endAt,
      })),
    };
  }

  // ── cancel ──────────────────────────────────────────────────────────────

  /** Owner or admin cancels a PENDING/CONFIRMED booking. */
  async cancelBooking(id: string, user: UserModel, reason?: string) {
    const booking = await this.getBooking(id, user);

    if (!ACTIVE_STATUSES.includes(booking.status as 'PENDING' | 'CONFIRMED')) {
      throw new ApiException(
        409,
        'NOT_CANCELLABLE',
        `A ${booking.status.toLowerCase()} booking cannot be cancelled`,
      );
    }

    const paymentWasPaid = booking.paymentStatus === 'SUCCEEDED';

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason ?? null,
          // No money owed on an unpaid booking once cancelled. A paid one
          // keeps SUCCEEDED until an actual Stripe refund is processed.
          paymentStatus: paymentWasPaid
            ? 'SUCCEEDED'
            : 'CANCELLED',
        },
      });
      await tx.payment.updateMany({
        where: { bookingId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
    });

    return this.getBooking(id, user);
  }

  // ── admin status management ─────────────────────────────────────────────

  /**
   * Admin transitions: PENDING→CONFIRMED, CONFIRMED→COMPLETED/NO_SHOW,
   * anything-active→CANCELLED. Optionally mark the payment as collected
   * (pay-at-centre customers settling up at the counter).
   */
  async updateBookingStatus(id: string, input: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new ApiException(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }

    const { status, paymentStatus, adminNote, cancellationReason } = input;
    if (!status && !paymentStatus && adminNote === undefined) {
      throw new ApiException(400, 'NOTHING_TO_UPDATE', 'Nothing to update');
    }

    // ── validate status transition ──
    if (status) {
      const valid: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: [],
      };
      if (!valid[booking.status]?.includes(status)) {
        throw new ApiException(
          409,
          'INVALID_TRANSITION',
          `Cannot move a ${booking.status.toLowerCase()} booking to ${status.toLowerCase()}`,
        );
      }
    }

    const data: Prisma.BookingUpdateInput = {};
    if (status === 'CONFIRMED') {
      data.status = 'CONFIRMED';
      data.confirmedAt = new Date();
    } else if (status === 'COMPLETED') {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
    } else if (status === 'NO_SHOW') {
      data.status = 'NO_SHOW';
    } else if (status === 'CANCELLED') {
      data.status = 'CANCELLED';
      data.cancelledAt = new Date();
      data.cancellationReason = cancellationReason ?? null;
    }
    if (adminNote !== undefined) data.adminNote = adminNote;

    // ── payment side-effects ──
    let markPaid = false;
    if (paymentStatus) {
      if (
        paymentStatus === 'SUCCEEDED' &&
        booking.paymentStatus === 'SUCCEEDED'
      ) {
        // already paid — no-op
      } else if (
        paymentStatus === 'SUCCEEDED' &&
        booking.paymentStatus === 'PENDING'
      ) {
        data.paymentStatus = 'SUCCEEDED';
        markPaid = true;
      } else if (paymentStatus === 'SUCCEEDED' || paymentStatus === 'FAILED') {
        throw new ApiException(
          409,
          'INVALID_PAYMENT_STATE',
          `Cannot mark a ${booking.paymentStatus.toLowerCase()} payment as ${paymentStatus.toLowerCase()}`,
        );
      } else {
        // REFUNDED — only allowed from SUCCEEDED
        if (booking.paymentStatus !== 'SUCCEEDED') {
          throw new ApiException(
            409,
            'INVALID_PAYMENT_STATE',
            `Cannot mark a ${booking.paymentStatus.toLowerCase()} payment as refunded`,
          );
        }
        data.paymentStatus = 'REFUNDED';
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data });

      if (markPaid) {
        // Record the counter collection — update a pending row if one
        // exists, otherwise create the payment record outright.
        const pending = await tx.payment.findFirst({
          where: { bookingId: id, status: 'PENDING' },
        });
        if (pending) {
          await tx.payment.update({
            where: { id: pending.id },
            data: { status: 'SUCCEEDED', paidAt: new Date() },
          });
        } else {
          await tx.payment.create({
            data: {
              userId: booking.userId,
              bookingId: id,
              type: 'GAME_BOOKING',
              status: 'SUCCEEDED',
              amount: booking.totalAmount,
              currency: booking.currency,
              paidAt: new Date(),
            },
          });
        }
      } else if (paymentStatus === 'REFUNDED') {
        await tx.payment.updateMany({
          where: { bookingId: id, status: 'SUCCEEDED' },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });
      } else if (status === 'CANCELLED') {
        await tx.payment.updateMany({
          where: { bookingId: id, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });
      }
    });

    const updated = await this.prisma.booking.findUnique({
      where: { id },
      include: { ...BOOKING_INCLUDE, payments: true },
    });
    return updated;
  }
}
