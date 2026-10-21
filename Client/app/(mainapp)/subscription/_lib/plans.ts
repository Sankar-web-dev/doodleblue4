import type { SubscriptionPlan } from "@/api/subscriptions.api";

export interface PlanCard {
  key: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured?: boolean;
}

/**
 * Display copy for the plan cards. Prices must match the Stripe Prices
 * configured on the server (STRIPE_PRICE_* env vars).
 */
export const PLAN_CARDS: PlanCard[] = [
  {
    key: "basic",
    name: "Basic",
    price: "$199",
    period: "/month",
    description: "For individuals getting started.",
    features: [
      "Single user account",
      "Core features",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$499",
    period: "/month",
    description: "For growing teams that need more.",
    features: [
      "Everything in Basic",
      "Priority support",
      "Advanced features",
    ],
    featured: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "$3,999",
    period: "/year",
    description: "Best value — billed annually.",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Early access to new features",
    ],
  },
];
