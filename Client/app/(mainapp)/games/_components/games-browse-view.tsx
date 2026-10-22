"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Gamepad2,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import type { Game } from "@/api/games.api";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGameCategories, usePublicGames } from "../_hooks/use-games";
import { BookGameDialog } from "./book-game-dialog";

const PAGE_SIZE = 9;

function GameCard({
  game,
  onBook,
}: {
  game: Game;
  onBook: (game: Game) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border border-primary/50 bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-all duration-200 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20">
      {/* Image header */}
      <div className="relative h-44 w-full bg-muted">
        {game.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.imageUrl}
            alt={game.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary/40">
            <Gamepad2 className="h-12 w-12" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-background/80 text-xs shadow backdrop-blur">
          {game.category}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{game.name}</p>
            {game.description && (
              <p className="truncate text-xs text-muted-foreground">
                {game.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-start gap-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <IndianRupee className="h-3 w-3" />
              Price / hr
            </span>
            <span className="text-sm font-semibold">
              {formatINR(game.pricePerHour)}
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              Capacity
            </span>
            <span className="text-sm font-semibold">{game.capacity}</span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Booking window
            </span>
            <span className="text-sm font-semibold">
              {game.minBookingMins} – {game.maxBookingMins} min
            </span>
          </div>
        </div>

        <Button
          className="mt-4 w-full bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90"
          onClick={() => onBook(game)}
        >
          Book now
        </Button>
      </CardContent>
    </Card>
  );
}

/** Customer-facing games browse — read-only catalog of ACTIVE games. */
export function GamesBrowseView() {
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [bookingGame, setBookingGame] = useState<Game | null>(null);

  const { data, isPending, error, refetch } = usePublicGames();
  const { data: categories } = useGameCategories();

  const filtered = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (g) =>
        (category === "ALL" || g.category === category) &&
        (!q ||
          g.name.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q))
    );
  }, [data, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const games = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Games</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every station live at the arena right now — pick your game and book a
          slot.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search games…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading games…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load games."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isPending && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-16 text-center">
          <Gamepad2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No games found</p>
          <p className="text-xs text-muted-foreground">
            {search || category !== "ALL"
              ? "Try a different search or category."
              : "The arena hasn't published any games yet."}
          </p>
        </div>
      )}

      {/* Cards grid */}
      {!isPending && !error && games.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} onBook={setBookingGame} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isPending && !error && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Booking flow — details form → Stripe checkout or pay-at-centre */}
      <BookGameDialog game={bookingGame} onClose={() => setBookingGame(null)} />
    </div>
  );
}

export default GamesBrowseView;
