"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { AdminMembershipPlan } from "@/api/membership-plans.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeletePlan } from "../_hooks/use-plans";

interface DeletePlanDialogProps {
  plan: AdminMembershipPlan | null;
  onClose: () => void;
}

export function DeletePlanDialog({ plan, onClose }: DeletePlanDialogProps) {
  const deleteMutation = useDeletePlan(() => {
    toast.success("Plan deleted", {
      description: "The matching Stripe product was archived.",
    });
    onClose();
  });

  return (
    <Dialog open={!!plan} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{plan?.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            The plan is removed and its Stripe product archived so it can no
            longer be purchased. Existing subscribers keep their membership
            until it is cancelled in Stripe.
          </DialogDescription>
        </DialogHeader>
        {deleteMutation.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {deleteMutation.error.message}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => plan && deleteMutation.mutate(plan.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
