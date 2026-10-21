import { api } from "@/lib/api";

export const SUBSCRIPTION_KEY = ["subscriptions", "me"] as const;
export const SUBSCRIPTION_PLANS_KEY = ["subscriptions", "plans"] as const;

export type SubscriptionPlan = "basic" | "pro" | "premium";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  plan: string | null;
  /** Stripe subscription status: active | trialing | past_due | canceled | ... */
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export const subscriptionsApi = {
  /** Plan keys that have a Stripe Price configured on the server. */
  listPlans: () =>
    api.get<{ plans: SubscriptionPlan[] }>("/api/v1/subscriptions/plans"),

  /** The current user's stored subscription (null until first checkout). */
  getMine: () =>
    api.get<{ subscription: SubscriptionRecord | null }>(
      "/api/v1/subscriptions/me"
    ),

  /** Create a Stripe Checkout Session — returns the hosted checkout URL. */
  createCheckout: (plan: SubscriptionPlan) =>
    api.post<{ url: string }>("/api/v1/subscriptions/checkout", { plan }),
};

/**
 * Start a Stripe Checkout for the given plan — creates the session via the
 * API (JWT is attached automatically) then redirects the browser to the
 * Stripe-hosted checkout page.
 */
export async function subscribe(plan: SubscriptionPlan): Promise<void> {
  const { url } = await subscriptionsApi.createCheckout(plan);
  if (!url) throw new Error("Checkout URL was not returned");
  window.location.assign(url);
}
