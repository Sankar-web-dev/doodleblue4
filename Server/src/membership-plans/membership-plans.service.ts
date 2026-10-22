import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { ApiException } from '../common/api-error.js';
import {
  archivePrice,
  archiveProductByPriceId,
  createRecurringPrice,
  ensurePlanProduct,
} from '../stripe/stripe-client.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  CreateMembershipPlanDto,
  ListMembershipPlansQueryDto,
  UpdateMembershipPlanDto,
} from './dto.js';

/**
 * Fields safe for public display — Stripe Price IDs stay server-side.
 */
const PUBLIC_SELECT = {
  id: true,
  name: true,
  description: true,
  discountPercent: true,
  monthlyPrice: true,
  yearlyPrice: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MembershipPlanSelect;

@Injectable()
export class MembershipPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Drop cached public plan listings after an admin write. */
  private async invalidateCache() {
    await this.redis.delPattern('cache:plans:*');
  }

  // ── public ──────────────────────────────────────────────────────────────

  /** Active plans for the pricing page, ordered. Cached 2 min. */
  async listPublicPlans() {
    return this.redis.remember('cache:plans:public', 120, () =>
      this.prisma.membershipPlan.findMany({
        where: { isActive: true },
        select: PUBLIC_SELECT,
        orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }],
      }),
    );
  }

  async getPublicPlan(id: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id, isActive: true },
      select: PUBLIC_SELECT,
    });
    if (!plan) {
      throw new ApiException(404, 'PLAN_NOT_FOUND', 'Plan not found');
    }
    return plan;
  }

  // ── admin management ────────────────────────────────────────────────────

  async listAllPlans(query: ListMembershipPlansQueryDto) {
    const where: Prisma.MembershipPlanWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = pageParams(query);
    const [total, data] = await Promise.all([
      this.prisma.membershipPlan.count({ where }),
      this.prisma.membershipPlan.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ]);

    return { data, meta: listMeta(total, query.page, query.limit) };
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new ApiException(404, 'PLAN_NOT_FOUND', 'Plan not found');
    }
    return plan;
  }

  /**
   * Auto-provision Stripe: reuse the plan's existing Product when it has
   * one (found via a stored Price ID), otherwise create a Product, then
   * create recurring Prices for whichever amounts were requested.
   */
  private async provisionStripe(input: {
    name: string;
    description?: string | null;
    reusePriceIds: (string | null | undefined)[];
    monthly?: number | null;
    yearly?: number | null;
  }) {
    if (input.monthly == null && input.yearly == null) return {};
    const productId = await ensurePlanProduct({
      name: input.name,
      description: input.description,
      existingPriceId: input.reusePriceIds.find(Boolean) ?? null,
    });
    const ids: {
      stripeMonthlyPriceId?: string;
      stripeYearlyPriceId?: string;
    } = {};
    if (input.monthly != null)
      ids.stripeMonthlyPriceId = await createRecurringPrice(
        productId,
        input.monthly,
        'month',
      );
    if (input.yearly != null)
      ids.stripeYearlyPriceId = await createRecurringPrice(
        productId,
        input.yearly,
        'year',
      );
    return ids;
  }

  async createPlan(input: CreateMembershipPlanDto) {
    const clash = await this.prisma.membershipPlan.findUnique({
      where: { name: input.name },
    });
    if (clash) {
      throw new ApiException(
        409,
        'NAME_IN_USE',
        'A plan with this name already exists',
      );
    }
    if (!input.monthlyPrice && !input.yearlyPrice) {
      throw new ApiException(
        400,
        'NO_PRICE',
        'Set at least one of monthlyPrice or yearlyPrice',
      );
    }

    const data: CreateMembershipPlanDto = Object.assign({}, input);
    // Create Stripe Product + Prices for amounts the admin didn't paste
    // existing Price IDs for.
    const ids = await this.provisionStripe({
      name: input.name,
      description: input.description,
      reusePriceIds: [
        input.stripeMonthlyPriceId,
        input.stripeYearlyPriceId,
      ],
      monthly:
        input.monthlyPrice && !input.stripeMonthlyPriceId
          ? Number(input.monthlyPrice)
          : null,
      yearly:
        input.yearlyPrice && !input.stripeYearlyPriceId
          ? Number(input.yearlyPrice)
          : null,
    });
    Object.assign(data, ids);

    const plan = await this.prisma.membershipPlan.create({ data });
    await this.invalidateCache();
    return plan;
  }

  async updatePlan(id: string, input: UpdateMembershipPlanDto) {
    const existing = await this.getPlanById(id);

    if (input.name && input.name !== existing.name) {
      const clash = await this.prisma.membershipPlan.findUnique({
        where: { name: input.name },
      });
      if (clash) {
        throw new ApiException(
          409,
          'NAME_IN_USE',
          'A plan with this name already exists',
        );
      }
    }

    const monthly =
      input.monthlyPrice === undefined
        ? existing.monthlyPrice
        : input.monthlyPrice;
    const yearly =
      input.yearlyPrice === undefined
        ? existing.yearlyPrice
        : input.yearlyPrice;
    if (!monthly && !yearly) {
      throw new ApiException(
        400,
        'NO_PRICE',
        'Set at least one of monthlyPrice or yearlyPrice',
      );
    }

    const data: UpdateMembershipPlanDto = Object.assign({}, input);

    // Provision new Stripe Prices when an amount changes and the admin
    // didn't paste a replacement Price ID. Existing subscribers stay
    // grandfathered on their original Stripe price.
    const monthlyChanged =
      input.monthlyPrice != null &&
      Number(input.monthlyPrice) !== Number(existing.monthlyPrice);
    const yearlyChanged =
      input.yearlyPrice != null &&
      Number(input.yearlyPrice) !== Number(existing.yearlyPrice);
    const ids = await this.provisionStripe({
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      reusePriceIds: [
        existing.stripeMonthlyPriceId,
        existing.stripeYearlyPriceId,
        input.stripeMonthlyPriceId,
        input.stripeYearlyPriceId,
      ],
      monthly: monthlyChanged && !input.stripeMonthlyPriceId ? Number(input.monthlyPrice) : null,
      yearly: yearlyChanged && !input.stripeYearlyPriceId ? Number(input.yearlyPrice) : null,
    });
    if (ids.stripeMonthlyPriceId) {
      await archivePrice(existing.stripeMonthlyPriceId ?? '');
      data.stripeMonthlyPriceId = ids.stripeMonthlyPriceId;
    }
    if (ids.stripeYearlyPriceId) {
      await archivePrice(existing.stripeYearlyPriceId ?? '');
      data.stripeYearlyPriceId = ids.stripeYearlyPriceId;
    }

    // Interval removed, or price ID manually swapped → archive the old price.
    if (input.monthlyPrice === null && existing.stripeMonthlyPriceId) {
      await archivePrice(existing.stripeMonthlyPriceId);
      data.stripeMonthlyPriceId = null;
    }
    if (input.yearlyPrice === null && existing.stripeYearlyPriceId) {
      await archivePrice(existing.stripeYearlyPriceId);
      data.stripeYearlyPriceId = null;
    }
    if (
      input.stripeMonthlyPriceId &&
      existing.stripeMonthlyPriceId &&
      input.stripeMonthlyPriceId !== existing.stripeMonthlyPriceId
    ) {
      await archivePrice(existing.stripeMonthlyPriceId);
    }
    if (
      input.stripeYearlyPriceId &&
      existing.stripeYearlyPriceId &&
      input.stripeYearlyPriceId !== existing.stripeYearlyPriceId
    ) {
      await archivePrice(existing.stripeYearlyPriceId);
    }

    const plan = await this.prisma.membershipPlan.update({
      where: { id },
      data,
    });
    await this.invalidateCache();
    return plan;
  }

  /**
   * Hard delete — safe: subscriptions keep a nullable membershipPlanId that
   * Prisma sets to NULL (onDelete: SetNull). The Stripe product is
   * archived so it stops appearing for new checkouts.
   */
  async deletePlan(id: string) {
    const plan = await this.getPlanById(id);
    await archiveProductByPriceId(
      plan.stripeMonthlyPriceId ?? plan.stripeYearlyPriceId,
    );
    await this.prisma.membershipPlan.delete({ where: { id } });
    await this.invalidateCache();
  }
}
