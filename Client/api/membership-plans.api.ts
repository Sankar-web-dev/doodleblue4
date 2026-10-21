import { api, PaginationMeta } from "@/lib/api";
import type { MembershipPlan } from "./subscriptions.api";

export const PLANS_LIST_KEY = ["membership-plans", "manage"] as const;

/** Admin view — includes the Stripe Price IDs hidden from public list. */
export interface AdminMembershipPlan extends MembershipPlan {
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
}

export interface PlanInput {
  name?: string;
  description?: string;
  discountPercent?: number;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  stripeMonthlyPriceId?: string | null;
  stripeYearlyPriceId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type CreatePlanInput = Required<
  Pick<PlanInput, "name" | "discountPercent">
> &
  PlanInput;

export interface ListPlansParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

function qs(params: ListPlansParams) {
  const p = new URLSearchParams();
  if (params.search) p.set("search", params.search);
  if (params.isActive !== undefined) p.set("isActive", String(params.isActive));
  if (params.page) p.set("page", String(params.page));
  if (params.limit) p.set("limit", String(params.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const membershipPlansApi = {
  listAdmin: (params: ListPlansParams = {}) =>
    api.getWithMeta<AdminMembershipPlan[], PaginationMeta>(
      `/api/v1/membership-plans/manage${qs(params)}`
    ),

  getAdmin: (id: string) =>
    api.get<AdminMembershipPlan>(`/api/v1/membership-plans/manage/${id}`),

  create: (input: CreatePlanInput) =>
    api.post<AdminMembershipPlan>("/api/v1/membership-plans", input),

  update: (id: string, input: PlanInput) =>
    api.patch<AdminMembershipPlan>(
      `/api/v1/membership-plans/${id}`,
      input
    ),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/membership-plans/${id}`),
};
