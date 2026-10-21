"use client";

import { Suspense, useEffect } from "react";
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

import { PLAN_CARDS } from "./_lib/plans";
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
  const { data: configuredPlans } = useSubscriptionPlans();
  const checkout = useCheckout();

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
          Manage your subscription and choose a plan.
        </p>
      </div>

      {/* Current subscription */}
      <Card className="glass-card animate-fade-up max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Your subscription
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
              <div className="flex items-center gap-3">
                <p className="font-display text-2xl font-bold capitalize">
                  {subscription.plan ?? "Subscription"}
                </p>
                {statusBadge(subscription.status)}
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline">Cancels at period end</Badge>
                )}
              </div>
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
                  <TriangleAlert className="h-4 w-4" />
                  A payment failed — update your payment method to keep
                  access.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a subscription yet. Choose a plan below to
              get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid animate-fade-up gap-4 md:grid-cols-3">
        {PLAN_CARDS.map((plan) => {
          const isCurrent =
            isActive && subscription?.plan === plan.key;
          const isConfigured =
            !configuredPlans || configuredPlans.includes(plan.key);
          const isCheckingOut =
            checkout.isPending && checkout.variables === plan.key;

          return (
            <Card
              key={plan.key}
              className={cn(
                "glass-card flex h-full flex-col transition-all hover:-translate-y-0.5",
                plan.featured && "border-primary/40 ring-1 ring-primary/30"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.featured && (
                    <Badge className="bg-primary/10 text-primary">
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
                  <span className="font-display text-3xl font-bold">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto w-full"
                  variant={plan.featured ? "default" : "outline"}
                  disabled={
                    isCurrent || !isConfigured || checkout.isPending
                  }
                  onClick={() => checkout.mutate(plan.key)}
                >
                  {isCheckingOut && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCurrent
                    ? "Current plan"
                    : !isConfigured
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
