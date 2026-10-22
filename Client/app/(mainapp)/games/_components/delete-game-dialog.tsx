"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import type { Game } from "@/api/games.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteGame } from "../_hooks/use-games";

interface DeleteGameDialogProps {
  game: Game | null;
  onClose: () => void;
}

export function DeleteGameDialog({ game, onClose }: DeleteGameDialogProps) {
  const deleteMutation = useDeleteGame(onClose);

  return (
    <Dialog open={!!game} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{game?.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the game from the catalog. Existing
            bookings are not affected, but customers will no longer be able to
            book it. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {deleteMutation.error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {deleteMutation.error.message}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => game && deleteMutation.mutate(game.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
