import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type {
  BookingStatus,
  MembershipStatus,
} from '../generated/prisma/enums.js';

const ACTIVE_STATUSES: MembershipStatus[] = ['ACTIVE', 'TRIALING'];
const COUNTED_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
];

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Admin dashboard aggregates — one endpoint so the reports page loads with
 * a single request. Cached briefly; the numbers don't need to be realtime.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  summary() {
    return this.redis.remember('cache:reports:summary', 60, () =>
      this.buildSummary(),
    );
  }

  private async buildSummary() {
    const now = new Date();
    // First day of the month, 5 months back → 6 bars including this month.
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [payments, gameGroups, statusGroups, subscriptions] =
      await Promise.all([
        this.prisma.payment.findMany({
          where: { status: 'SUCCEEDED', createdAt: { gte: windowStart } },
          select: { amount: true, createdAt: true },
        }),
        this.prisma.booking.groupBy({
          by: ['gameId'],
          where: { status: { in: COUNTED_BOOKING_STATUSES } },
          _count: { _all: true },
          orderBy: { _count: { gameId: 'desc' } },
          take: 5,
        }),
        this.prisma.booking.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.subscription.findMany({
          where: { membershipStatus: { in: ACTIVE_STATUSES } },
          select: {
            plan: true,
            billingInterval: true,
            membershipPlan: {
              select: { name: true, monthlyPrice: true, yearlyPrice: true },
            },
          },
        }),
      ]);

    // ── Monthly revenue (succeeded payments, last 6 months) ──────────────
    const totals = new Map<string, number>();
    for (const p of payments) {
      const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      totals.set(key, (totals.get(key) ?? 0) + Number(p.amount));
    }
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        month: key,
        label: MONTH_LABELS[d.getMonth()],
        total: Math.round((totals.get(key) ?? 0) * 100) / 100,
      };
    });

    // ── Popular games (most booked, excludes cancelled/no-show) ──────────
    const gameIds = gameGroups.map((g) => g.gameId);
    const games = gameIds.length
      ? await this.prisma.game.findMany({
          where: { id: { in: gameIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameOf = new Map(games.map((g) => [g.id, g.name]));
    const popularGames = gameGroups.map((g) => ({
      gameId: g.gameId,
      name: nameOf.get(g.gameId) ?? 'Unknown',
      bookings: g._count._all,
    }));

    // ── Booking stats — every status present, zero-filled ────────────────
    const countByStatus = new Map(
      statusGroups.map((s) => [s.status, s._count._all]),
    );
    const bookingStats = (
      [
        'PENDING',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ] as BookingStatus[]
    ).map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));

    // ── Membership stats — members per plan + estimated MRR ─────────────
    const membersByPlan = new Map<string, number>();
    let mrr = 0;
    for (const sub of subscriptions) {
      const planName = sub.membershipPlan?.name ?? sub.plan ?? 'Unknown';
      membersByPlan.set(planName, (membersByPlan.get(planName) ?? 0) + 1);

      const monthly = sub.membershipPlan?.monthlyPrice;
      const yearly = sub.membershipPlan?.yearlyPrice;
      if (sub.billingInterval === 'MONTHLY' && monthly != null) {
        mrr += Number(monthly);
      } else if (sub.billingInterval === 'YEARLY' && yearly != null) {
        mrr += Number(yearly) / 12;
      }
    }
    const memberships = [...membersByPlan.entries()]
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count || a.plan.localeCompare(b.plan));

    return {
      monthlyRevenue,
      popularGames,
      bookingStats,
      memberships,
      estimatedMonthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      currency: 'INR',
    };
  }
}
