import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { StripeService } from './stripe.service.js';
import { MembershipPlansService } from '../membership-plans/membership-plans.service.js';
import { CheckoutDto } from './dto.js';

/**
 * Authenticated membership endpoints. The webhook is unauthenticated and
 * lives on the separate StripeWebhookController.
 */
@Controller('subscriptions')
@UseGuards(AuthGuard, RequirePasswordChangedGuard)
export class StripeController {
  constructor(
    private readonly stripe: StripeService,
    private readonly plans: MembershipPlansService,
  ) {}

  /**
   * Start a membership checkout — the plan + billing interval are sent; the
   * actual Stripe Price ID is resolved server-side from the plan row.
   */
  @Post('checkout')
  async checkout(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: UserModel,
  ) {
    const data = await this.stripe.createMembershipCheckout(
      { id: user.id, email: user.email },
      dto.membershipPlanId,
      dto.billingInterval,
    );
    return { data };
  }

  /**
   * The caller's subscription record (with the joined plan details).
   * Automatically auto-syncs with Stripe if no active subscription is in the DB.
   */
  @Get('me')
  async mySubscription(@CurrentUser() user: UserModel) {
    let subscription = await this.stripe.getSubscription(user.id);
    if (!subscription || subscription.status !== 'active') {
      subscription = await this.stripe.syncUserSubscriptionFromStripe(user);
    }
    return { data: subscription ?? null };
  }

  /**
   * Explicitly verify a membership checkout session directly against Stripe.
   * Called when a customer returns from Stripe checkout.
   */
  @Post('verify')
  async verifySubscription(
    @Query('session_id') sessionId: string,
    @CurrentUser() user: UserModel,
  ) {
    const data = await this.stripe.verifyMembershipCheckoutSession(
      sessionId,
      user,
    );
    return { data };
  }

  /** Active membership plans for the pricing page. */
  @Get('plans')
  async listPlans() {
    const data = await this.plans.listPublicPlans();
    return { data };
  }
}
