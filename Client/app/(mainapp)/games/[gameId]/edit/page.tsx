"use client";

import { useParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { RequireAdmin } from "@/app/(mainapp)/_components/require-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useGame } from "../../_hooks/use-games";
import { GameForm } from "../../_components/game-form";

export default function EditGamePage() {
  const params = useParams<{ gameId: string }>();
  const { data: game, isPending, error, refetch } = useGame(params.gameId);

  return (
    <RequireAdmin message="Administrator access is required to manage games.">
      {isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading game…
        </div>
      ) : error || !game ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Game not found."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Edit game
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update pricing, capacity, and availability for &ldquo;{game.name}&rdquo;.
            </p>
          </div>
          <div className="max-w-3xl">
            <GameForm game={game} />
          </div>
        </div>
      )}
    </RequireAdmin>
  );
}
