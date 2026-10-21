import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { StripeService } from './stripe.service.js';
import { CheckoutDto } from './dto.js';

/**
 * Subscription endpoints — the client only sends a plan key and receives a
 * Stripe-hosted Checkout URL. Auth identity comes from the JWT (AuthGuard),
 * never from the request body.
 */
@Controller('subscriptions')
@UseGuards(AuthGuard, RequirePasswordChangedGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /** Plan keys that have a Stripe Price configured. */
  @Get('plans')
  plans() {
    return { data: { plans: this.stripeService.listPlans() } };
  }

  /** The current user's stored subscription record. */
  @Get('me')
  async me(@CurrentUser() user: UserModel) {
    return {
      data: {
        subscription: await this.stripeService.getSubscription(user.id),
      },
    };
  }

  /** Start a Stripe Checkout Session for the given plan. */
  @Post('checkout')
  async checkout(@CurrentUser() user: UserModel, @Body() dto: CheckoutDto) {
    return {
      data: await this.stripeService.createCheckoutSession(
        { id: user.id, email: user.email },
        dto.plan,
      ),
    };
  }
}
