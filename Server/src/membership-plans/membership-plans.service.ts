import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { ApiException } from '../common/api-error.js';
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
    const plan = await this.prisma.membershipPlan.create({ data: input });
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

    const plan = await this.prisma.membershipPlan.update({
      where: { id },
      data: input,
    });
    await this.invalidateCache();
    return plan;
  }

  /**
   * Hard delete — safe: subscriptions keep a nullable membershipPlanId that
   * Prisma sets to NULL (onDelete: SetNull).
   */
  async deletePlan(id: string) {
    await this.getPlanById(id);
    await this.prisma.membershipPlan.delete({ where: { id } });
    await this.invalidateCache();
  }
}
