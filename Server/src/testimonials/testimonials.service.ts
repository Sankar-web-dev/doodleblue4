import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { UserModel } from '../generated/prisma/models.js';
import type {
  CreateTestimonialDto,
  ListTestimonialsQueryDto,
  UpdateTestimonialStatusDto,
} from './dto.js';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
};

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Customer submits a testimonial (starts as PENDING). */
  async createTestimonial(dto: CreateTestimonialDto, user: UserModel) {
    return this.prisma.testimonial.create({
      data: {
        userId: user.id,
        rating: dto.rating,
        headline: dto.headline || null,
        content: dto.content,
        status: 'PENDING',
        isHero: false,
      },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Current logged in user's submissions. */
  async getMyTestimonials(user: UserModel) {
    return this.prisma.testimonial.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Public / customer-facing approved testimonials for the testimonials wall. */
  async getPublicTestimonials() {
    return this.prisma.testimonial.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ isHero: 'desc' }, { createdAt: 'desc' }],
      take: 60,
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Featured testimonials placed on the hero landing page by admin. */
  async getHeroTestimonials() {
    return this.prisma.testimonial.findMany({
      where: {
        status: 'APPROVED',
        isHero: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Admin list with filters, search, pagination, and overview statistics. */
  async listAdminTestimonials(query: ListTestimonialsQueryDto) {
    const where: Prisma.TestimonialWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isHero !== undefined) {
      where.isHero = query.isHero;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { content: { contains: s, mode: 'insensitive' } },
        { headline: { contains: s, mode: 'insensitive' } },
        { user: { name: { contains: s, mode: 'insensitive' } } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const { skip, take, page, limit } = pageParams(query);

    const [total, data, pendingCount, approvedCount, rejectedCount, heroCount] =
      await Promise.all([
        this.prisma.testimonial.count({ where }),
        this.prisma.testimonial.findMany({
          where,
          include: {
            user: { select: USER_SELECT },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take,
        }),
        this.prisma.testimonial.count({ where: { status: 'PENDING' } }),
        this.prisma.testimonial.count({ where: { status: 'APPROVED' } }),
        this.prisma.testimonial.count({ where: { status: 'REJECTED' } }),
        this.prisma.testimonial.count({ where: { isHero: true } }),
      ]);

    const allTotal = await this.prisma.testimonial.count();

    return {
      data,
      meta: {
        ...listMeta(total, page, limit),
        stats: {
          total: allTotal,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          hero: heroCount,
        },
      },
    };
  }

  /** Update status (APPROVED / REJECTED / PENDING). */
  async updateStatus(id: string, dto: UpdateTestimonialStatusDto) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiException(404, 'NOT_FOUND', 'Testimonial not found');
    }

    // If changing from approved to rejected or pending, remove from hero
    const isHero = dto.status === 'APPROVED' ? existing.isHero : false;

    return this.prisma.testimonial.update({
      where: { id },
      data: {
        status: dto.status,
        adminNote: dto.adminNote !== undefined ? dto.adminNote : existing.adminNote,
        isHero,
      },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Toggle whether the testimonial is placed on the hero page. */
  async setHero(id: string, isHero: boolean) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiException(404, 'NOT_FOUND', 'Testimonial not found');
    }

    // If placing on hero, ensure it is approved
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        isHero,
        ...(isHero && existing.status !== 'APPROVED' ? { status: 'APPROVED' } : {}),
      },
      include: {
        user: { select: USER_SELECT },
      },
    });
  }

  /** Delete testimonial. */
  async deleteTestimonial(id: string) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiException(404, 'NOT_FOUND', 'Testimonial not found');
    }

    await this.prisma.testimonial.delete({
      where: { id },
    });

    return { id, deleted: true };
  }
}
