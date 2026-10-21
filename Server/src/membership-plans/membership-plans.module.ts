import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipPlansController } from './membership-plans.controller.js';
import { MembershipPlansService } from './membership-plans.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService],
  exports: [MembershipPlansService],
})
export class MembershipPlansModule {}
