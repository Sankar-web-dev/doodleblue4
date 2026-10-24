"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Gamepad2,
  Search,
  IndianRupee,
  Users,
  Clock,
  MoreVertical,
} from "lucide-react";

import type { Game, GameStatus } from "@/api/games.api";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useGames } from "../_hooks/use-games";
import { GameDetailsSheet } from "./game-details-sheet";
import { DeleteGameDialog } from "./delete-game-dialog";
import { GamesHeaderArt } from "./games-header-art";

const PAGE_SIZE = 9;

const STATUS_STYLES: Record<GameStatus, string> = {
  ACTIVE: "bg-emerald-500/90 text-white border-emerald-400/40",
  INACTIVE: "bg-muted/90 text-muted-foreground border-border/40",
  MAINTENANCE: "bg-amber-500/90 text-white border-amber-400/40",
};

const STATUS_LABELS: Record<GameStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MAINTENANCE: "Maintenance",
};

export function GamesView() {
  const router = useRouter();
  const [viewGame, setViewGame] = useState<Game | null>(null);
  const [deleteGame, setDeleteGame] = useState<Game | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | GameStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isPending, error, refetch } = useGames();

  const filtered = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (g) =>
        (statusFilter === "ALL" || g.status === statusFilter) &&
        (!q ||
          g.name.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q))
    );
  }, [data, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const games = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function renderCard(game: Game) {
    return (
      <Card
        key={game.id}
        className="overflow-hidden rounded-xl border border-primary/50 bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/20 transition-all duration-200 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20"
      >
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
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <Badge className={`${STATUS_STYLES[game.status]} text-xs shadow`}>
              {STATUS_LABELS[game.status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-md bg-background/80 backdrop-blur"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewGame(game)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/games/${game.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteGame(game)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Name + category */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{game.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {game.category}
              </p>
            </div>
          </div>

          {/* Stats */}
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
                Boards
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

        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header band with decorative art */}
      <div className="relative">
        <GamesHeaderArt />

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Games</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the bookable games catalog — pricing, capacity, and availability status.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            onClick={() => router.push("/games/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add game
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex items-center gap-3">
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
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as "ALL" | GameStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
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
            {search || statusFilter !== "ALL"
              ? "Try a different search or status filter."
              : "Add your first game to get started."}
          </p>
        </div>
      )}

      {/* Cards grid */}
      {!isPending && !error && games.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {games.map(renderCard)}
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

      {/* View details sheet */}
      <GameDetailsSheet game={viewGame} onClose={() => setViewGame(null)} />

      {/* Delete game confirm dialog */}
      <DeleteGameDialog game={deleteGame} onClose={() => setDeleteGame(null)} />
    </div>
  );
}

export default GamesView;
