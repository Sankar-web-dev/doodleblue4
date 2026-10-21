import type {
  BillingInterval,
  MembershipPlan,
} from "@/api/subscriptions.api";

export const INTERVAL_OPTIONS: {
  value: BillingInterval;
  label: string;
  periodSuffix: string;
}[] = [
  { value: "MONTHLY", label: "Monthly", periodSuffix: "/month" },
  { value: "YEARLY", label: "Yearly", periodSuffix: "/year" },
];

/** The price a plan charges for the given billing interval (null = N/A). */
export function priceFor(plan: MembershipPlan, interval: BillingInterval) {
  return interval === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;
}

/** Does the plan offer the given billing interval? */
export function offersInterval(
  plan: MembershipPlan,
  interval: BillingInterval
) {
  return priceFor(plan, interval) != null;
}

/** Display label — e.g. "Basic Monthly". */
export function planDisplayName(plan: MembershipPlan, interval: BillingInterval) {
  return `${plan.name} ${interval === "MONTHLY" ? "Monthly" : "Yearly"}`;
}

/** Prisma Decimal arrives as a string — normalize to a number. */
export function money(n: string | number | null | undefined): number {
  return n == null ? 0 : typeof n === "number" ? n : Number(n);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(n: string | number | null | undefined) {
  return inr.format(money(n));
}
