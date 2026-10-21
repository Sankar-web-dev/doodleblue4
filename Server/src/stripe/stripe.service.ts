import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { priceIdForPlan, SUBSCRIPTION_PLANS } from './plans.js';

/** Current period end — on subscription items in recent Stripe API versions. */
function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const unix =
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return unix ? new Date(unix * 1000) : null;
}

/** The subscription an invoice belongs to (new API shape, legacy fallback). */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const ref =
    invoice.parent?.subscription_details?.subscription ??
    (invoice as unknown as { subscription?: string | { id: string } | null })
      .subscription;
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

/** Stripe objects carry either the id or the expanded object. */
function idOf(ref: string | { id: string } | null | undefined) {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  /** Instantiated lazily so STRIPE_SECRET_KEY is read after env loading. */
  private _stripe?: Stripe;
  private get stripe() {
    if (!this._stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new ApiException(
          500,
          'STRIPE_NOT_CONFIGURED',
          'Stripe is not configured on the server',
        );
      }
      this._stripe = new Stripe(key);
    }
    return this._stripe;
  }

  constructor(private readonly prisma: PrismaService) {}

  /** Available plan keys (for client-facing plan pickers). */
  listPlans() {
    return SUBSCRIPTION_PLANS.filter((p) => !!priceIdForPlan(p));
  }

  /** The user's stored subscription record (null when never subscribed). */
  getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  /**
   * Create a Stripe Checkout Session for a subscription plan and return the
   * hosted-checkout URL the client should redirect to.
   */
  async createCheckoutSession(
    user: { id: string; email: string },
    plan: string,
  ) {
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      throw new ApiException(
        400,
        'INVALID_PLAN',
        'Invalid subscription plan',
      );
    }

    const baseUrl =
      process.env.FRONTEND_URL ??
      process.env.CLIENT_URL ??
      'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?cancelled=true`,
    });

    return { url: session.url };
  }

  // -----------------------------------------------------------------------
  // Webhook event handlers (called from StripeWebhookController)
  // -----------------------------------------------------------------------

  /** checkout.session.completed — initial subscription creation. */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = idOf(session.subscription);
    if (!subscriptionId) {
      this.logger.warn(
        `checkout.session.completed ${session.id} had no subscription`,
      );
      return;
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.syncSubscription(subscription, {
      userId: session.client_reference_id ?? undefined,
      stripeCustomerId: idOf(session.customer) ?? undefined,
    });
  }

  /** invoice.paid — initial or recurring payment succeeded. */
  async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.syncSubscription(subscription);
  }

  /** invoice.payment_failed — mark the subscription past due. */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    await this.prisma.subscription
      .update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'past_due' },
      })
      .catch(() => {});
  }

  /** customer.subscription.updated — status/plan/period changes. */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.syncSubscription(subscription);
  }

  /** customer.subscription.deleted — cancellation takes effect. */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription
      .update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled', cancelAtPeriodEnd: false },
      })
      .catch(() => {});
  }

  // -----------------------------------------------------------------------

  /** Upsert our mirror row of a Stripe subscription. */
  private async syncSubscription(
    subscription: Stripe.Subscription,
    extras: { userId?: string; stripeCustomerId?: string } = {},
  ) {
    const userId =
      extras.userId ?? subscription.metadata?.userId ?? undefined;
    const stripeCustomerId =
      extras.stripeCustomerId ?? idOf(subscription.customer);

    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    const resolvedUserId = userId ?? existing?.userId;

    if (!resolvedUserId) {
      this.logger.warn(
        `Subscription ${subscription.id} has no resolvable userId — skipped`,
      );
      return;
    }

    const plan =
      subscription.metadata?.plan ??
      existing?.plan ??
      null;
    const data = {
      userId: resolvedUserId,
      stripeCustomerId:
        stripeCustomerId ?? existing?.stripeCustomerId ?? null,
      plan,
      status: subscription.status,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: { stripeSubscriptionId: subscription.id, ...data },
      update: data,
    });
  }
}
