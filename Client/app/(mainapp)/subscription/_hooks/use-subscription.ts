"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  subscriptionsApi,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_PLANS_KEY,
  type BillingInterval,
} from "@/api/subscriptions.api";
import { ApiRequestError } from "@/lib/api";

/** The current user's stored subscription (null until first checkout). */
export function useSubscription() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => subscriptionsApi.getMine(),
  });
}

/** Active membership plans for the pricing page. */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: SUBSCRIPTION_PLANS_KEY,
    queryFn: () => subscriptionsApi.listPlans(),
    retry: 1,
  });
}

/** Start Stripe Checkout — creates the session then redirects the browser. */
export function useCheckout() {
  return useMutation({
    mutationFn: (input: {
      membershipPlanId: string;
      billingInterval: BillingInterval;
    }) =>
      subscriptionsApi.createCheckout(
        input.membershipPlanId,
        input.billingInterval
      ),
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

/** Verify a subscription checkout session directly on return. */
export function useVerifySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      subscriptionsApi.verifyCheckout(sessionId),
    onSuccess: (data) => {
      if (data?.subscription) {
        queryClient.setQueryData(SUBSCRIPTION_KEY, data.subscription);
      }
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
    },
  });
}
