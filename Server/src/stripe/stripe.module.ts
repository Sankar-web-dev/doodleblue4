import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { StripeController } from './stripe.controller.js';
import { StripeWebhookController } from './stripe-webhook.controller.js';

/**
 * Self-contained Stripe billing module:
 *   POST /api/v1/subscriptions/checkout — create a Checkout Session (JWT)
 *   GET  /api/v1/subscriptions/me       — current subscription record (JWT)
 *   GET  /api/v1/subscriptions/plans    — configured plan keys (JWT)
 *   POST /api/v1/stripe/webhook         — Stripe event receiver (signature)
 */
@Module({
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
