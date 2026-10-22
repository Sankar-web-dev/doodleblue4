"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { AdminMembershipPlan } from "@/api/membership-plans.api";
import { formatINR, money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { usePlans } from "../_hooks/use-plans";
import { PlanFormDialog } from "./plan-form-dialog";
import { DeletePlanDialog } from "./delete-plan-dialog";

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; plan: AdminMembershipPlan };

export function PlansView() {
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [deletePlan, setDeletePlan] = useState<AdminMembershipPlan | null>(null);

  const { user: currentUser } = useAuthUser();
  const admin = isAdmin(currentUser);

  const { data, isPending, error, refetch } = usePlans();
  const plans = data?.data ?? [];

  const columns = useMemo<ColumnDef<AdminMembershipPlan, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div className="min-w-0 py-1">
            <p className="truncate text-sm font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "discountPercent",
        header: "Discount",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {money(row.original.discountPercent)}%
          </span>
        ),
      },
      {
        accessorKey: "monthlyPrice",
        header: "Monthly",
        cell: ({ row }) =>
          row.original.monthlyPrice != null ? (
            <span className="text-sm">{formatINR(row.original.monthlyPrice)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "yearlyPrice",
        header: "Yearly",
        cell: ({ row }) =>
          row.original.yearlyPrice != null ? (
            <span className="text-sm">{formatINR(row.original.yearlyPrice)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "stripe",
        header: "Stripe",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 font-mono text-[11px] text-muted-foreground">
            <span title={row.original.stripeMonthlyPriceId ?? undefined}>
              M: {row.original.stripeMonthlyPriceId ?? "—"}
            </span>
            <span title={row.original.stripeYearlyPriceId ?? undefined}>
              Y: {row.original.stripeYearlyPriceId ?? "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                : "bg-muted text-muted-foreground border-border/40 text-xs"
            }
          >
            {row.original.isActive ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setForm({ mode: "edit", plan: row.original })}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeletePlan(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (currentUser && !admin) {
    return (
      <ForbiddenState message="Administrator access is required to manage plans." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Membership Plans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage membership tiers — discounts, monthly/yearly pricing, and
            Stripe sync.
          </p>
        </div>
        <Button onClick={() => setForm({ mode: "create" })} className="self-start sm:self-auto">
          <Plus className="mr-1.5 h-4 w-4" />
          New plan
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading plans…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load plans."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={plans}
          sort
          filter
          filterColumn="name"
          filterPlaceHolder="Search plans"
          pagination
        />
      )}

      {/* Create / edit form — keyed so state resets between targets */}
      <PlanFormDialog
        key={form.mode === "edit" ? form.plan.id : "create"}
        plan={form.mode === "edit" ? form.plan : null}
        open={form.mode !== "closed"}
        onClose={() => setForm({ mode: "closed" })}
      />

      {/* Delete confirm dialog */}
      <DeletePlanDialog
        plan={deletePlan}
        onClose={() => setDeletePlan(null)}
      />
    </div>
  );
}

export default PlansView;
