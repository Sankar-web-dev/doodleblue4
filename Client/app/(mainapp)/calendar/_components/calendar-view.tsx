"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAllBookings } from "../../bookings/_hooks/use-bookings";
import { GamesHeaderArt } from "../../games/_components/games-header-art";
import {
  BookingsCalendar,
  calendarRange,
  firstOfMonth,
} from "./bookings-calendar";

/** Admin calendar — month grid of all customer bookings. */
export function CalendarView() {
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [search, setSearch] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  // Fetch the full visible grid range so edge-of-month cells aren't empty.
  const range = calendarRange(month);
  const { data, isPending, error, refetch } = useAllBookings({
    from: range.start.toISOString(),
    to: range.end.toISOString(),
    limit: 100,
    includeCancelled: showCancelled,
  });

  const bookings = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (b) =>
        b.game.name.toLowerCase().includes(q) ||
        b.user.name.toLowerCase().includes(q) ||
        b.user.email.toLowerCase().includes(q) ||
        b.bookingNumber.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header band with decorative art */}
      <div className="relative">
        <GamesHeaderArt />

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Month view of all customer bookings.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Search bookings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs shrink-0 self-start sm:self-auto"
            onClick={() => setShowCancelled((v) => !v)}
          >
            {showCancelled ? "Hide cancelled" : "Show cancelled"}
          </Button>
        </div>
      </div>

      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load bookings."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <BookingsCalendar
          bookings={bookings}
          isPending={isPending}
          month={month}
          onMonthChange={setMonth}
        />
      )}
    </div>
  );
}
