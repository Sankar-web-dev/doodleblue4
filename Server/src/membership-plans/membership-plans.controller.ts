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
import { MembershipPlansService } from './membership-plans.service.js';
import {
  CreateMembershipPlanDto,
  ListMembershipPlansQueryDto,
  UpdateMembershipPlanDto,
} from './dto.js';

@Controller('membership-plans')
export class MembershipPlansController {
  constructor(private readonly plans: MembershipPlansService) {}

  // ── public (pricing page — active plans only) ───────────────────────────

  @Get()
  listPublic() {
    return this.plans.listPublicPlans().then((data) => ({ data }));
  }

  // ── admin management ────────────────────────────────────────────────────

  @Get('manage')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  listAll(@Query() query: ListMembershipPlansQueryDto) {
    return this.plans.listAllPlans(query).then((r) => ({
      data: r.data,
      meta: r.meta,
    }));
  }

  @Get('manage/:id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  getForAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.plans.getPlanById(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  create(@Body() dto: CreateMembershipPlanDto) {
    return this.plans.createPlan(dto).then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.plans.updatePlan(id, dto).then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.plans.deletePlan(id);
    return { data: { message: 'Plan deleted' } };
  }

  /** Public single-plan lookup — must stay after fixed routes. */
  @Get(':id')
  getPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.plans.getPublicPlan(id).then((data) => ({ data }));
  }
}
