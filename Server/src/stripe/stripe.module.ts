import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';
import { StripeWebhookController } from './stripe-webhook.controller.js';
import { MembershipPlansModule } from '../membership-plans/membership-plans.module.js';

/**
 * Self-contained Stripe billing module:
 *   POST /api/v1/subscriptions/checkout — membership Checkout Session (JWT)
 *   GET  /api/v1/subscriptions/me       — current subscription record (JWT)
 *   GET  /api/v1/subscriptions/plans    — active membership plans (JWT)
 *   POST /api/v1/stripe/webhook         — Stripe event receiver (signature)
 * Booking checkouts are created for the bookings module via StripeService.
 */
@Module({
  imports: [MembershipPlansModule],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
