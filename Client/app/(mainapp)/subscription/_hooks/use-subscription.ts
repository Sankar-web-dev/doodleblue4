"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  subscriptionsApi,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_PLANS_KEY,
  type SubscriptionPlan,
} from "@/api/subscriptions.api";
import { ApiRequestError } from "@/lib/api";

/** The current user's stored subscription (null until first checkout). */
export function useSubscription() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () =>
      subscriptionsApi.getMine().then((res) => res.subscription),
  });
}

/** Plan keys that have a Stripe Price configured on the server. */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: SUBSCRIPTION_PLANS_KEY,
    queryFn: () => subscriptionsApi.listPlans().then((res) => res.plans),
    retry: 1,
  });
}

/** Start Stripe Checkout — creates the session then redirects the browser. */
export function useCheckout() {
  return useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      subscriptionsApi.createCheckout(plan),
    onSuccess: ({ url }) => {
      if (url) window.location.assign(url);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Unable to start checkout. Please try again."
      );
    },
  });
}
