"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { BillingInterval } from "@/api/subscriptions.api";
import {
  formatINR,
  INTERVAL_OPTIONS,
  money,
  offersInterval,
  priceFor,
} from "./_lib/plans";
import {
  useCheckout,
  useSubscription,
  useSubscriptionPlans,
} from "./_hooks/use-subscription";

function statusBadge(status: string) {
  switch (status) {
    case "active":
    case "trialing":
      return (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          {status === "trialing" ? "Trial" : "Active"}
        </Badge>
      );
    case "past_due":
      return (
        <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">
          Past due
        </Badge>
      );
    case "canceled":
      return <Badge variant="secondary">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function SubscriptionView() {
  const searchParams = useSearchParams();
  const { data: subscription, isPending } = useSubscription();
  const { data: plans, isPending: plansPending } = useSubscriptionPlans();
  const checkout = useCheckout();
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");

  // Stripe sends users back to /subscription?cancelled=true on abort.
  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast.info("Checkout cancelled — no charges were made.");
    }
  }, [searchParams]);

  const isActive = ["active", "trialing"].includes(
    subscription?.status ?? ""
  );
  const isPastDue = subscription?.status === "past_due";

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your membership and booking discounts.
        </p>
      </div>

      {/* Current subscription */}
      <Card className="glass-card animate-fade-up max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Your membership
          </CardTitle>
          <CardDescription>
            Current plan and billing status for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : subscription ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-2xl font-bold capitalize">
                  {subscription.membershipPlan?.name ??
                    subscription.plan ??
                    "Membership"}
                </p>
                {statusBadge(subscription.status)}
                {subscription.billingInterval && (
                  <Badge variant="outline">
                    {subscription.billingInterval === "MONTHLY"
                      ? "Monthly"
                      : "Yearly"}{" "}
                    billing
                  </Badge>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline">Cancels at period end</Badge>
                )}
              </div>
              {subscription.membershipPlan && (
                <p className="text-sm text-muted-foreground">
                  {money(subscription.membershipPlan.discountPercent)}% off
                  every booking
                </p>
              )}
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ||
                  subscription.status === "canceled"
                    ? "Access until"
                    : "Renews on"}{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
              {isPastDue && (
                <p className="flex items-center gap-1.5 text-sm text-amber-600">
                  <TriangleAlert className="h-4 w-4" />A payment failed — update
                  your payment method to keep access.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a membership yet. Choose a plan below to
              unlock booking discounts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Interval toggle */}
      <div className="flex animate-fade-up items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 w-fit">
        {INTERVAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setInterval(opt.value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              interval === opt.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      {plansPending ? (
        <div className="grid animate-fade-up gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : !plans?.length ? (
        <Card className="glass-card animate-fade-up">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No membership plans are available right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid animate-fade-up gap-4 md:grid-cols-3">
          {plans.map((plan, index) => {
            const price = priceFor(plan, interval);
            const unavailable = !offersInterval(plan, interval);
            const featured = plan.name.toLowerCase() === "pro";
            const isCurrent =
              isActive &&
              subscription?.membershipPlanId === plan.id &&
              subscription?.billingInterval === interval;
            const isCheckingOut =
              checkout.isPending &&
              checkout.variables?.membershipPlanId === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "glass-card flex h-full flex-col transition-all hover:-translate-y-0.5",
                  featured && "border-primary/40 ring-1 ring-primary/30"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {featured && !isCurrent && (
                      <Badge className="animate-pulse-glow bg-primary/15 text-primary border-primary/40">
                        Popular
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                        Current plan
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <p className="pt-2">
                    {unavailable ? (
                      <span className="font-display text-lg font-semibold text-muted-foreground">
                        Not available{" "}
                        {interval === "MONTHLY" ? "monthly" : "yearly"}
                      </span>
                    ) : (
                      <>
                        <span className="font-display text-3xl font-bold">
                          {formatINR(price)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {interval === "MONTHLY" ? "/month" : "/year"}
                        </span>
                      </>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {money(plan.discountPercent)}% off every booking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      Discount auto-applied at checkout
                    </li>
                    {index > 0 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        Everything in {plans[index - 1].name}
                      </li>
                    )}
                  </ul>
                  <Button
                    className="mt-auto w-full"
                    variant={featured ? "default" : "outline"}
                    disabled={
                      isCurrent || unavailable || checkout.isPending
                    }
                    onClick={() =>
                      checkout.mutate({
                        membershipPlanId: plan.id,
                        billingInterval: interval,
                      })
                    }
                  >
                    {isCheckingOut && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCurrent
                      ? "Current plan"
                      : unavailable
                        ? "Unavailable"
                        : isActive
                          ? `Switch to ${plan.name}`
                          : `Subscribe to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionView />
    </Suspense>
  );
}
