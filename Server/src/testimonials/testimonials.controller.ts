import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { TestimonialsService } from './testimonials.service.js';
import {
  CreateTestimonialDto,
  ListTestimonialsQueryDto,
  SetHeroTestimonialDto,
  UpdateTestimonialStatusDto,
} from './dto.js';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  // ── Public / Storefront routes ─────────────────────────────────────────────

  /** Featured hero testimonials (placed on hero by admin) */
  @Get('hero')
  getHeroTestimonials() {
    return this.testimonials.getHeroTestimonials().then((data) => ({ data }));
  }

  /** Approved testimonials for public/community display */
  @Get('public')
  getPublicTestimonials() {
    return this.testimonials.getPublicTestimonials().then((data) => ({ data }));
  }

  // ── Authenticated User routes ──────────────────────────────────────────────

  /** Submit a new testimonial */
  @Post()
  @UseGuards(AuthGuard, RequirePasswordChangedGuard)
  create(
    @Body() dto: CreateTestimonialDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.testimonials
      .createTestimonial(dto, user)
      .then((data) => ({ data }));
  }

  /** Get testimonials submitted by the current user */
  @Get('my')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard)
  getMy(@CurrentUser() user: UserModel) {
    return this.testimonials.getMyTestimonials(user).then((data) => ({ data }));
  }

  // ── Admin management routes ────────────────────────────────────────────────

  /** List all testimonials with filters, search, and pagination */
  @Get('admin')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  listAdmin(@Query() query: ListTestimonialsQueryDto) {
    return this.testimonials.listAdminTestimonials(query).then((r) => ({
      data: r.data,
      meta: r.meta,
    }));
  }

  /** Update status (APPROVED / REJECTED / PENDING) and optional admin note */
  @Patch(':id/status')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTestimonialStatusDto,
  ) {
    return this.testimonials.updateStatus(id, dto).then((data) => ({ data }));
  }

  /** Toggle whether the testimonial is placed on the hero landing page */
  @Patch(':id/hero')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  setHero(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetHeroTestimonialDto,
  ) {
    return this.testimonials.setHero(id, dto.isHero).then((data) => ({ data }));
  }

  /** Delete a testimonial */
  @Delete(':id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonials.deleteTestimonial(id).then((data) => ({ data }));
  }
}
