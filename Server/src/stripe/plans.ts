/**
 * Server-controlled plan → Stripe Price mapping.
 *
 * Clients submit only the plan key ("basic", "pro", "premium") — never a
 * Stripe Price ID. Add a new plan by adding it here and setting
 * STRIPE_PRICE_<KEY> in the environment.
 */
export const SUBSCRIPTION_PLANS = ['basic', 'pro', 'premium'] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

const PLAN_ENV_VARS: Record<SubscriptionPlan, string> = {
  basic: 'STRIPE_PRICE_BASIC',
  pro: 'STRIPE_PRICE_PRO',
  premium: 'STRIPE_PRICE_PREMIUM',
};

/**
 * Resolve a plan key to its Stripe Price ID.
 * Read lazily — process.env is only populated after ConfigModule loads.
 */
export function priceIdForPlan(plan: string): string | undefined {
  const envVar = PLAN_ENV_VARS[plan as SubscriptionPlan];
  return envVar ? process.env[envVar] : undefined;
}
