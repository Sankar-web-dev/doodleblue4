"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

import { gamesApi, type Game, type GameStatus } from "@/api/games.api";
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
  useCreateGame,
  useUpdateGame,
  useGameCategories,
} from "../_hooks/use-games";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface GameFormProps {
  game?: Game;
}

export function GameForm({ game }: GameFormProps) {
  const router = useRouter();
  const isEdit = !!game;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(game?.name ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [description, setDescription] = useState(game?.description ?? "");
  const [category, setCategory] = useState(game?.category ?? "");
  const [imageUrl, setImageUrl] = useState(game?.imageUrl ?? "");
  const [pricePerHour, setPricePerHour] = useState(
    game ? String(money(game.pricePerHour)) : ""
  );
  const [minBookingMins, setMinBookingMins] = useState(
    String(game?.minBookingMins ?? 60)
  );
  const [maxBookingMins, setMaxBookingMins] = useState(
    String(game?.maxBookingMins ?? 240)
  );
  const [capacity, setCapacity] = useState(String(game?.capacity ?? 1));
  const [maxPlayers, setMaxPlayers] = useState(String(game?.maxPlayers ?? 2));
  const [status, setStatus] = useState<GameStatus>(game?.status ?? "ACTIVE");
  const [sortOrder, setSortOrder] = useState(String(game?.sortOrder ?? 0));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if the game prop loads asynchronously (render-time adjust).
  const [prevGame, setPrevGame] = useState(game);
  if (game !== prevGame) {
    setPrevGame(game);
    if (game) {
      setName(game.name ?? "");
      setSlug(game.slug ?? "");
      setDescription(game.description ?? "");
      setCategory(game.category ?? "");
      setImageUrl(game.imageUrl ?? "");
      setPricePerHour(String(money(game.pricePerHour)));
      setMinBookingMins(String(game.minBookingMins));
      setMaxBookingMins(String(game.maxBookingMins));
      setCapacity(String(game.capacity));
      setMaxPlayers(String(game.maxPlayers ?? 2));
      setStatus(game.status);
      setSortOrder(String(game.sortOrder));
    }
  }

  const { data: categories } = useGameCategories();

  // Dropdown options — existing categories from the API + sensible defaults,
  // plus the game's current category when editing (so it stays selectable).
  const categoryOptions = useMemo(() => {
    const base = ["Board games", "Console", "Arcade", "Table sports", "VR"];
    return Array.from(
      new Set([...base, ...(categories ?? []), ...(game?.category ? [game.category] : [])])
    );
  }, [categories, game]);

  const onSaved = () => router.push("/games");

  const createMutation = useCreateGame(() => {
    toast.success("Game created", {
      description: `${name} is now in the catalog.`,
    });
    onSaved();
  });

  const updateMutation = useUpdateGame(game?.id ?? "", () => {
    toast.success("Game updated");
    onSaved();
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploadingImage;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);
      const res = await gamesApi.uploadImage(file);
      setImageUrl(res.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(msg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function parseIntField(value: string): number | undefined {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name is required (min 2 characters).");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }
    if (slug.trim() && !SLUG_PATTERN.test(slug.trim())) {
      setError("Slug must be lowercase words separated by hyphens.");
      return;
    }

    const price = Number(pricePerHour);
    if (pricePerHour.trim() === "" || Number.isNaN(price) || price < 0) {
      setError("Price per hour must be a number ≥ 0.");
      return;
    }

    const minMins = parseIntField(minBookingMins);
    const maxMins = parseIntField(maxBookingMins);
    const cap = parseIntField(capacity);
    const players = parseIntField(maxPlayers);
    const sort = parseIntField(sortOrder);

    if (minMins == null || minMins < 15 || minMins > 1440) {
      setError("Minimum booking must be between 15 and 1440 minutes.");
      return;
    }
    if (maxMins == null || maxMins < 15 || maxMins > 1440) {
      setError("Maximum booking must be between 15 and 1440 minutes.");
      return;
    }
    if (minMins > maxMins) {
      setError("Minimum booking cannot exceed maximum booking.");
      return;
    }
    if (cap == null || cap < 1 || cap > 100) {
      setError("Boards / stations must be between 1 and 100.");
      return;
    }
    if (players == null || players < 1 || players > 100) {
      setError("Players per game must be between 1 and 100.");
      return;
    }
    if (sort == null || sort < 0 || sort > 10000) {
      setError("Sort order must be between 0 and 10000.");
      return;
    }
    if (imageUrl.trim() && !/^(\/|https?:\/\/)/.test(imageUrl.trim())) {
      setError("Image URL must start with http(s):// or /");
      return;
    }

    if (isEdit) {
      updateMutation.mutate(
        {
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          description: description.trim() || undefined,
          category: category.trim(),
          imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
          pricePerHour: price,
          minBookingMins: minMins,
          maxBookingMins: maxMins,
          capacity: cap,
          maxPlayers: players,
          status,
          sortOrder: sort,
        },
        { onError: (err) => setError(err.message) }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          category: category.trim(),
          ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
          pricePerHour: price,
          minBookingMins: minMins,
          maxBookingMins: maxMins,
          capacity: cap,
          maxPlayers: players,
          status,
          sortOrder: sort,
        },
        { onError: (err) => setError(err.message) }
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="game-name">Name</Label>
        <Input
          id="game-name"
          placeholder="e.g. PlayStation 5 — Station 1"
          className="h-11 rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="game-slug">
          Slug{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (optional — generated from name)
          </span>
        </Label>
        <Input
          id="game-slug"
          placeholder="e.g. ps5-station-1"
          className="h-11 rounded-lg font-mono text-sm"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="game-description">
          Description{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        </Label>
        <textarea
          id="game-description"
          rows={3}
          placeholder="Short description shown on the storefront…"
          className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-2xs transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Category + Status */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="game-category">Category</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={isPending}
          >
            <SelectTrigger id="game-category" className="h-11 rounded-lg w-full">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="game-status">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as GameStatus)}
            disabled={isPending}
          >
            <SelectTrigger id="game-status" className="h-11 rounded-lg w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active — bookable</SelectItem>
              <SelectItem value="INACTIVE">Inactive — hidden</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance — hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price + Boards + Players + Sort order */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="game-price">Price per hour (₹)</Label>
          <Input
            id="game-price"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 199"
            className="h-11 rounded-lg"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="game-capacity">Boards / stations</Label>
          <Input
            id="game-capacity"
            type="number"
            min={1}
            max={100}
            step={1}
            className="h-11 rounded-lg"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Physical boards or stations — e.g. carrom has 2 boards, so 2
            bookings can share a slot.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="game-players">Players per game</Label>
          <Input
            id="game-players"
            type="number"
            min={1}
            max={100}
            step={1}
            className="h-11 rounded-lg"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Shown to customers — e.g. carrom = 2 players, PS5 = 5.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="game-sort">Sort order</Label>
          <Input
            id="game-sort"
            type="number"
            min={0}
            max={10000}
            step={1}
            className="h-11 rounded-lg"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Booking window */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="game-min">Min booking (minutes)</Label>
          <Input
            id="game-min"
            type="number"
            min={15}
            max={1440}
            step={15}
            className="h-11 rounded-lg"
            value={minBookingMins}
            onChange={(e) => setMinBookingMins(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="game-max">Max booking (minutes)</Label>
          <Input
            id="game-max"
            type="number"
            min={15}
            max={1440}
            step={15}
            className="h-11 rounded-lg"
            value={maxBookingMins}
            onChange={(e) => setMaxBookingMins(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Image — upload to object storage or paste a URL */}
      <div className="space-y-3">
        <Label>
          Image{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        </Label>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-border/80 bg-muted flex items-center justify-center shadow-sm">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Game preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            )}
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                disabled={isPending}
                className="absolute top-0 right-0 bg-background/90 text-foreground rounded-full p-0.5 shadow hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isPending}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg gap-2 text-xs h-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {isUploadingImage ? "Uploading..." : "Upload image"}
              </Button>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, WEBP or GIF (Max 5MB)
              </span>
            </div>

            <Input
              id="game-image"
              placeholder="Or paste image URL (https://…)"
              className="h-9 rounded-lg text-xs"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        {isEdit && game?.imageUrl && !imageUrl && (
          <p className="text-xs text-muted-foreground">
            Saving with an empty URL removes the image.
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/games")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create game"}
        </Button>
      </div>
    </form>
  );
}

export default GameForm;
