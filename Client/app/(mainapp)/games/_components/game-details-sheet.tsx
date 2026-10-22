"use client";

import { Gamepad2, Tag, Calendar, IndianRupee, Users, Clock } from "lucide-react";

import type { Game } from "@/api/games.api";
import { formatINR, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface GameDetailsSheetProps {
  game: Game | null;
  onClose: () => void;
}

export function GameDetailsSheet({ game, onClose }: GameDetailsSheetProps) {
  return (
    <Sheet open={!!game} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {game && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                {game.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-primary/20 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <SheetTitle>{game.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5 mt-0.5">
                    <Tag className="h-3.5 w-3.5" />
                    {game.category}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge
                className={
                  game.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                    : game.status === "MAINTENANCE"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
                      : "bg-muted text-muted-foreground border-border/40 text-xs"
                }
              >
                {game.status}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <IndianRupee className="h-3 w-3" />
                {formatINR(game.pricePerHour)} / hr
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                Capacity {game.capacity}
              </Badge>
            </div>

            {game.description && (
              <>
                <Separator className="my-5" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {game.description}
                </p>
              </>
            )}

            <Separator className="my-5" />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Game Details</h4>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Game ID</dt>
                  <dd className="font-mono text-xs">{game.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd className="font-mono text-xs">{game.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Booking window</dt>
                  <dd className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {game.minBookingMins}–{game.maxBookingMins} min
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sort order</dt>
                  <dd className="font-mono text-xs">{game.sortOrder}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateTime(game.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateTime(game.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
