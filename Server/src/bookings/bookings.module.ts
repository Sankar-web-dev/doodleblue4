import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StripeModule } from '../stripe/stripe.module.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [AuthModule, StripeModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
