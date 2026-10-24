"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { AdminMembershipPlan } from "@/api/membership-plans.api";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePlan, useUpdatePlan } from "../_hooks/use-plans";

const STRIPE_PRICE_RE = /^price_[A-Za-z0-9]+$/;

interface PlanFormDialogProps {
  /** The plan being edited; null when creating a new one. */
  plan: AdminMembershipPlan | null;
  open: boolean;
  onClose: () => void;
}

export function PlanFormDialog({ plan, open, onClose }: PlanFormDialogProps) {
  const isEdit = !!plan;

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    plan ? String(money(plan.discountPercent)) : ""
  );
  const [monthlyPrice, setMonthlyPrice] = useState(
    plan?.monthlyPrice != null ? String(money(plan.monthlyPrice)) : ""
  );
  const [yearlyPrice, setYearlyPrice] = useState(
    plan?.yearlyPrice != null ? String(money(plan.yearlyPrice)) : ""
  );
  const [stripeMonthlyPriceId, setStripeMonthlyPriceId] = useState(
    plan?.stripeMonthlyPriceId ?? ""
  );
  const [stripeYearlyPriceId, setStripeYearlyPriceId] = useState(
    plan?.stripeYearlyPriceId ?? ""
  );
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(
    plan ? String(plan.sortOrder) : "0"
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreatePlan(() => {
    toast.success("Plan created", {
      description: "A Stripe product and prices were provisioned for it.",
    });
    onClose();
  });
  const updateMutation = useUpdatePlan(() => {
    toast.success("Plan updated", {
      description: "Price changes were synced to Stripe.",
    });
    onClose();
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function parsePrice(raw: string, label: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`${label} must be a non-negative number.`);
    }
    return n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Plan name must be at least 2 characters.");
      return;
    }

    const discount = Number(discountPercent);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setError("Discount must be a number between 0 and 100.");
      return;
    }

    let monthly: number | null = null;
    let yearly: number | null = null;
    try {
      if (monthlyPrice.trim()) monthly = parsePrice(monthlyPrice, "Monthly price");
      if (yearlyPrice.trim()) yearly = parsePrice(yearlyPrice, "Yearly price");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid price.");
      return;
    }
    if (monthly == null && yearly == null) {
      setError("Set a monthly price, a yearly price, or both.");
      return;
    }

    for (const [id, label] of [
      [stripeMonthlyPriceId.trim(), "Monthly Stripe Price ID"],
      [stripeYearlyPriceId.trim(), "Yearly Stripe Price ID"],
    ] as const) {
      if (id && !STRIPE_PRICE_RE.test(id)) {
        setError(`${label} must look like price_...`);
        return;
      }
    }

    const sort = Number(sortOrder);
    if (!Number.isInteger(sort) || sort < 0) {
      setError("Sort order must be a non-negative integer.");
      return;
    }

    const stripeMonthly =
      stripeMonthlyPriceId.trim() && stripeMonthlyPriceId.trim() !== plan?.stripeMonthlyPriceId
        ? stripeMonthlyPriceId.trim()
        : undefined;
    const stripeYearly =
      stripeYearlyPriceId.trim() && stripeYearlyPriceId.trim() !== plan?.stripeYearlyPriceId
        ? stripeYearlyPriceId.trim()
        : undefined;

    if (isEdit) {
      updateMutation.mutate(
        {
          id: plan.id,
          input: {
            name: name.trim(),
            description: description.trim(),
            discountPercent: discount,
            // Blank price field = stop offering that billing interval.
            monthlyPrice: monthlyPrice.trim() ? monthly : null,
            yearlyPrice: yearlyPrice.trim() ? yearly : null,
            stripeMonthlyPriceId: stripeMonthly,
            stripeYearlyPriceId: stripeYearly,
            isActive,
            sortOrder: sort,
          },
        },
        { onError: (err) => setError(err.message) }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          discountPercent: discount,
          ...(monthly != null ? { monthlyPrice: monthly } : {}),
          ...(yearly != null ? { yearlyPrice: yearly } : {}),
          ...(stripeMonthly ? { stripeMonthlyPriceId: stripeMonthly } : {}),
          ...(stripeYearly ? { stripeYearlyPriceId: stripeYearly } : {}),
          isActive,
          sortOrder: sort,
        },
        { onError: (err) => setError(err.message) }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "New membership plan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changes sync to Stripe — a new price is created when an amount changes; existing subscribers keep their current price."
              : "A Stripe product and recurring prices are created automatically. Paste existing Price IDs only to reuse them."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              placeholder="e.g. Gold Membership"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-description">
              Description{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="plan-description"
              placeholder="e.g. 10% off all bookings"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-monthly">Monthly price (₹)</Label>
              <Input
                id="plan-monthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Not offered"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-yearly">Yearly price (₹)</Label>
              <Input
                id="plan-yearly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Not offered"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-discount">Booking discount (%)</Label>
              <Input
                id="plan-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 10"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-sort">Sort order</Label>
              <Input
                id="plan-sort"
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-status">Status</Label>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(v) => setIsActive(v === "active")}
              disabled={isPending}
            >
              <SelectTrigger id="plan-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active — shown on pricing page</SelectItem>
                <SelectItem value="inactive">Inactive — hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Stripe Price IDs{" "}
              <span className="font-normal">(optional — auto-created if blank)</span>
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Input
                id="plan-stripe-monthly"
                placeholder="Monthly price_... ID"
                className="font-mono text-xs"
                value={stripeMonthlyPriceId}
                onChange={(e) => setStripeMonthlyPriceId(e.target.value)}
                disabled={isPending}
              />
              <Input
                id="plan-stripe-yearly"
                placeholder="Yearly price_... ID"
                className="font-mono text-xs"
                value={stripeYearlyPriceId}
                onChange={(e) => setStripeYearlyPriceId(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
