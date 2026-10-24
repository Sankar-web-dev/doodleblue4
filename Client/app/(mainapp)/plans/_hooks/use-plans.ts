import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  membershipPlansApi,
  PLANS_LIST_KEY,
  type CreatePlanInput,
  type ListPlansParams,
  type PlanInput,
} from "@/api/membership-plans.api";
import { SUBSCRIPTION_PLANS_KEY } from "@/api/subscriptions.api";

/** Admin plan list — includes Stripe Price IDs and inactive plans. */
export function usePlans(params: ListPlansParams = { limit: 100 }) {
  return useQuery({
    queryKey: PLANS_LIST_KEY,
    queryFn: () => membershipPlansApi.listAdmin(params),
  });
}

function useInvalidatePlans() {
  const queryClient = useQueryClient();
  return () => {
    // Admin list + the customer-facing pricing page cache.
    queryClient.invalidateQueries({ queryKey: PLANS_LIST_KEY });
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_PLANS_KEY });
  };
}

export function useCreatePlan(onSuccess?: () => void) {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => membershipPlansApi.create(input),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useUpdatePlan(onSuccess?: () => void) {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlanInput }) =>
      membershipPlansApi.update(id, input),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useDeletePlan(onSuccess?: () => void) {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (id: string) => membershipPlansApi.delete(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
