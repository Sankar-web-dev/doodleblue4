"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_KEY } from "@/api/subscriptions.api";
import { useSubscription } from "../_hooks/use-subscription";

function SuccessView() {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  // The webhook updates the DB asynchronously after checkout — poll until
  // the subscription row appears (usually a second or two).
  const { data: subscription, isPending } = useSubscription();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
    const interval = setInterval(() => {
      setElapsed((s) => s + 1);
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
    }, 2000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const ready = !!subscription;
  const waiting = !isPending && !ready;

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <Card className="glass-card animate-fade-up w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="font-display text-2xl">
            Payment successful
          </CardTitle>
          <CardDescription>
            Thank you — your subscription is being set up.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {ready ? (
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold capitalize">
                {subscription.plan ?? "Subscription"}
              </p>
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                {subscription.status}
              </Badge>
            </div>
          ) : waiting || isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {elapsed > 10
                ? "Still waiting for Stripe to confirm — check back in a moment."
                : "Confirming your subscription…"}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/subscription">View billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense>
      <SuccessView />
    </Suspense>
  );
}
