import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { ReportsService } from './reports.service.js';

/** Aggregated stats for the admin reports dashboard — SUPER_ADMIN only. */
@Controller('reports')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary() {
    return this.reports.summary().then((data) => ({ data }));
  }
}
