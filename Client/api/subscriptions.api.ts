import { api } from "@/lib/api";

export const SUBSCRIPTION_KEY = ["subscriptions", "me"] as const;
export const SUBSCRIPTION_PLANS_KEY = ["subscriptions", "plans"] as const;

export type BillingInterval = "MONTHLY" | "YEARLY";

export type MembershipStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "INCOMPLETE"
  | "CANCELLED"
  | "EXPIRED"
  | "UNPAID";

/** A membership plan as exposed to customers (Stripe IDs stay server-side). */
export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  /** Percentage off bookings for members — Decimal serializes as string. */
  discountPercent: string | number;
  monthlyPrice: string | number | null;
  yearlyPrice: string | number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  membershipPlanId: string | null;
  membershipPlan: MembershipPlan | null;
  /** Plan display name (kept for compatibility). */
  plan: string | null;
  /** Raw Stripe subscription status: active | trialing | past_due | ... */
  status: string;
  membershipStatus: MembershipStatus;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export const subscriptionsApi = {
  /** Active membership plans for the pricing page. */
  listPlans: () =>
    api.get<MembershipPlan[]>("/api/v1/subscriptions/plans"),

  /** The current user's stored subscription (null until first checkout). */
  getMine: () =>
    api.get<SubscriptionRecord | null>("/api/v1/subscriptions/me"),

  /** Create a Stripe Checkout Session — returns the hosted checkout URL. */
  createCheckout: (membershipPlanId: string, billingInterval: BillingInterval) =>
    api.post<{ url: string }>("/api/v1/subscriptions/checkout", {
      membershipPlanId,
      billingInterval,
    }),

  /** Explicitly verify checkout session with Stripe. */
  verifyCheckout: (sessionId: string) =>
    api.post<{ verified: boolean; subscription: SubscriptionRecord | null }>(
      `/api/v1/subscriptions/verify?session_id=${encodeURIComponent(sessionId)}`
    ),
};

/**
 * Start a Stripe Checkout for the given membership plan — creates the
 * session via the API (JWT is attached automatically) then redirects the
 * browser to the Stripe-hosted checkout page.
 */
export async function subscribe(
  membershipPlanId: string,
  billingInterval: BillingInterval
): Promise<void> {
  const { url } = await subscriptionsApi.createCheckout(
    membershipPlanId,
    billingInterval
  );
  if (!url) throw new Error("Checkout URL was not returned");
  window.location.assign(url);
}
