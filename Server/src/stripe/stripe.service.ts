import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import type {
  BillingInterval,
  MembershipStatus,
} from '../generated/prisma/enums.js';
import type { BookingModel, UserModel } from '../generated/prisma/models.js';

/** Current period end — on subscription items in recent Stripe API versions. */
function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const unix =
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return unix ? new Date(unix * 1000) : null;
}

/** The subscription an invoice belongs to (new API shape, legacy fallback). */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const ref =
    invoice.parent?.subscription_details?.subscription ??
    (invoice as unknown as { subscription?: string | { id: string } | null })
      .subscription;
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

/** Stripe objects carry either the id or the expanded object. */
function idOf(ref: string | { id: string } | null | undefined) {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

/** Stripe subscription status → MembershipStatus enum. */
function toMembershipStatus(status: string): MembershipStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'TRIALING';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'incomplete_expired':
      return 'EXPIRED';
    case 'unpaid':
      return 'UNPAID';
    default:
      return 'INCOMPLETE';
  }
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  /** Instantiated lazily so STRIPE_SECRET_KEY is read after env loading. */
  private _stripe?: Stripe;
  private get stripe() {
    if (!this._stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new ApiException(
          500,
          'STRIPE_NOT_CONFIGURED',
          'Stripe is not configured on the server',
        );
      }
      this._stripe = new Stripe(key);
    }
    return this._stripe;
  }

  private get frontendUrl() {
    return (
      process.env.FRONTEND_URL ??
      process.env.CLIENT_URL ??
      'http://localhost:3000'
    );
  }

  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------------
  // Membership subscriptions
  // -----------------------------------------------------------------------

  /** The user's stored subscription record (null when never subscribed). */
  getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { membershipPlan: true },
    });
  }

  /**
   * Sync a user's subscription from Stripe if missing or inactive in the local DB.
   * Checks recent checkout sessions or customer subscriptions for this user.
   */
  async syncUserSubscriptionFromStripe(user: { id: string; email: string }) {
    const existing = await this.getSubscription(user.id);
    if (existing && existing.status === 'active') {
      return existing;
    }

    try {
      const sessions = await this.stripe.checkout.sessions.list({
        limit: 10,
      });
      const userSession = sessions.data.find(
        (s) =>
          s.mode === 'subscription' &&
          (s.status === 'complete' || s.payment_status === 'paid') &&
          (s.client_reference_id === user.id ||
            s.metadata?.userId === user.id ||
            s.customer_email?.toLowerCase() === user.email.toLowerCase()),
      );

      if (userSession && userSession.subscription) {
        const subId = idOf(userSession.subscription);
        if (subId) {
          const subscription =
            await this.stripe.subscriptions.retrieve(subId);
          await this.syncSubscription(subscription, {
            userId: user.id,
            stripeCustomerId: idOf(userSession.customer) ?? undefined,
            membershipPlanId:
              userSession.metadata?.membershipPlanId ?? undefined,
            billingInterval:
              (userSession.metadata?.billingInterval as BillingInterval) ??
              undefined,
            planName: userSession.metadata?.planName ?? undefined,
          });
          return this.getSubscription(user.id);
        }
      }
    } catch (err) {
      this.logger.warn(`Could not sync subscription from Stripe: ${err}`);
    }

    return existing;
  }

  /**
   * Directly verify a membership checkout session with Stripe.
   * If completed/paid, syncs the subscription immediately into the DB.
   */
  async verifyMembershipCheckoutSession(sessionId: string, user: UserModel) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    const sessionUserId =
      session.client_reference_id ?? session.metadata?.userId;
    if (
      sessionUserId &&
      sessionUserId !== user.id &&
      user.role !== 'SUPER_ADMIN'
    ) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'This checkout session belongs to another user',
      );
    }

    if (session.status === 'complete' || session.payment_status === 'paid') {
      const subscriptionId = idOf(session.subscription);
      if (subscriptionId) {
        const subscription =
          await this.stripe.subscriptions.retrieve(subscriptionId);
        await this.syncSubscription(subscription, {
          userId: session.client_reference_id ?? user.id,
          stripeCustomerId: idOf(session.customer) ?? undefined,
          membershipPlanId:
            session.metadata?.membershipPlanId ?? undefined,
          billingInterval:
            (session.metadata?.billingInterval as BillingInterval) ??
            undefined,
          planName: session.metadata?.planName ?? undefined,
        });
      }
      const current = await this.getSubscription(user.id);
      return { verified: true, subscription: current };
    }

    const current = await this.getSubscription(user.id);
    return { verified: false, subscription: current };
  }

  /**
   * Create a Stripe Checkout Session for a membership plan and return the
   * hosted-checkout URL. The Stripe Price ID is resolved server-side from
   * the MembershipPlan row — never taken from the request.
   */
  async createMembershipCheckout(
    user: { id: string; email: string },
    membershipPlanId: string,
    billingInterval: BillingInterval,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });
    if (!plan || !plan.isActive) {
      throw new ApiException(404, 'PLAN_NOT_FOUND', 'Plan not found');
    }

    const priceId =
      billingInterval === 'MONTHLY'
        ? plan.stripeMonthlyPriceId
        : plan.stripeYearlyPriceId;
    if (!priceId) {
      throw new ApiException(
        400,
        'PLAN_NO_PRICE',
        `${plan.name} is not available with ${billingInterval.toLowerCase()} billing`,
      );
    }

    const metadata = {
      type: 'membership',
      userId: user.id,
      membershipPlanId: plan.id,
      planName: plan.name,
      billingInterval,
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      success_url: `${this.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/subscription?cancelled=true`,
    });

    return { url: session.url };
  }

  // -----------------------------------------------------------------------
  // Booking payments
  // -----------------------------------------------------------------------

  /**
   * Checkout Session (mode=payment) for a booking's totalAmount. Returns
   * { sessionId, url }; the payment row is created by the bookings module.
   */
  async createBookingCheckout(
    user: { id: string; email: string },
    booking: BookingModel & { game?: { name?: string } },
  ) {
    const amount = Math.round(Number(booking.totalAmount) * 100);
    if (amount <= 0) {
      throw new ApiException(
        400,
        'NOTHING_TO_PAY',
        'This booking has no amount due',
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            unit_amount: amount,
            product_data: {
              name: `${booking.game?.name ?? 'Game'} session`,
              description: `Booking ${booking.bookingNumber} — ${booking.durationMinutes} min`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'booking_payment',
        bookingId: booking.id,
        userId: user.id,
      },
      success_url: `${this.frontendUrl}/bookings?paid=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/bookings?cancelled=${booking.id}`,
    });

    return { sessionId: session.id, url: session.url };
  }

  // -----------------------------------------------------------------------
  // Webhook event handlers (called from StripeWebhookController)
  // -----------------------------------------------------------------------

  /**
   * checkout.session.completed — dispatch on metadata.type:
   *  - 'booking_payment' → mark booking paid + confirmed
   *  - 'membership' (or legacy no-type) → sync subscription record
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.metadata?.type === 'booking_payment') {
      return this.handleBookingPaymentCompleted(session);
    }

    const subscriptionId = idOf(session.subscription);
    if (!subscriptionId) {
      this.logger.warn(
        `checkout.session.completed ${session.id} had no subscription`,
      );
      return;
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.syncSubscription(subscription, {
      userId: session.client_reference_id ?? undefined,
      stripeCustomerId: idOf(session.customer) ?? undefined,
      membershipPlanId: session.metadata?.membershipPlanId ?? undefined,
      billingInterval: (session.metadata
        ?.billingInterval as BillingInterval) ?? undefined,
      planName: session.metadata?.planName ?? undefined,
    });
  }

  /**
   * Directly verify a checkout session with Stripe.
   * If paid, marks the payment and booking as SUCCEEDED immediately.
   */
  async verifyBookingCheckoutSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await this.handleBookingPaymentCompleted(session);
      return { verified: true, session };
    }
    return { verified: false, session };
  }

  /**
   * A booking checkout finished — mark the payment succeeded and confirm
   * the booking. Idempotent (checkout.session.completed may be redelivered).
   */
  async handleBookingPaymentCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { booking: true },
    });
    if (!payment) {
      this.logger.warn(
        `checkout.session.completed ${session.id}: no pending payment row`,
      );
      return;
    }
    if (payment.status === 'SUCCEEDED') return;

    const newStatus =
      payment.booking?.status === 'COMPLETED'
        ? 'COMPLETED'
        : 'CONFIRMED';

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: payment.paidAt ?? new Date(),
          stripePaymentIntentId: idOf(session.payment_intent),
        },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId! },
        data: { status: newStatus, paymentStatus: 'SUCCEEDED' },
      }),
    ]);
  }

  /** invoice.paid — initial or recurring membership payment succeeded. */
  async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.syncSubscription(subscription);
  }

  /** invoice.payment_failed — mark the subscription past due. */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    await this.prisma.subscription
      .update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'past_due', membershipStatus: 'PAST_DUE' },
      })
      .catch(() => {});
  }

  /** customer.subscription.updated — status/plan/period changes. */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.syncSubscription(subscription);
  }

  /** customer.subscription.deleted — cancellation takes effect. */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription
      .update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'canceled',
          membershipStatus: 'CANCELLED',
          cancelAtPeriodEnd: false,
        },
      })
      .catch(() => {});
  }

  // -----------------------------------------------------------------------

  /** Upsert our mirror row of a Stripe subscription. */
  private async syncSubscription(
    subscription: Stripe.Subscription,
    extras: {
      userId?: string;
      stripeCustomerId?: string;
      membershipPlanId?: string;
      billingInterval?: BillingInterval;
      planName?: string;
    } = {},
  ) {
    const userId =
      extras.userId ?? subscription.metadata?.userId ?? undefined;
    const stripeCustomerId =
      extras.stripeCustomerId ?? idOf(subscription.customer);

    const existing =
      (await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      })) ??
      (userId
        ? await this.prisma.subscription.findUnique({
            where: { userId },
          })
        : null);
    const resolvedUserId = userId ?? existing?.userId;

    if (!resolvedUserId) {
      this.logger.warn(
        `Subscription ${subscription.id} has no resolvable userId — skipped`,
      );
      return;
    }

    const membershipPlanId =
      extras.membershipPlanId ??
      subscription.metadata?.membershipPlanId ??
      existing?.membershipPlanId ??
      null;
    const billingInterval =
      extras.billingInterval ??
      (subscription.metadata?.billingInterval as BillingInterval) ??
      existing?.billingInterval ??
      null;
    const planName =
      extras.planName ??
      subscription.metadata?.planName ??
      existing?.plan ??
      null;

    const data = {
      userId: resolvedUserId,
      stripeCustomerId:
        stripeCustomerId ?? existing?.stripeCustomerId ?? null,
      membershipPlanId,
      billingInterval,
      plan: planName,
      status: subscription.status,
      membershipStatus: toMembershipStatus(subscription.status),
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripeSubscriptionId: subscription.id,
          ...data,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          stripeSubscriptionId: subscription.id,
          ...data,
        },
      });
    }
  }
}
