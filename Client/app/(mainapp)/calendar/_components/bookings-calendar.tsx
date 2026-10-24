"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gamepad2,
  IndianRupee,
  Loader2,
  User,
} from "lucide-react";

import type {
  Booking,
  BookingStatus,
  PaymentStatus,
} from "@/api/bookings.api";
import { formatINR, formatSlot } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const WEEKDAYS = [
  { short: "S", full: "Sun" },
  { short: "M", full: "Mon" },
  { short: "T", full: "Tue" },
  { short: "W", full: "Wed" },
  { short: "T", full: "Thu" },
  { short: "F", full: "Fri" },
  { short: "S", full: "Sat" },
];
const MAX_CHIPS = 2;

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500/90 text-white border-amber-400/40",
  CONFIRMED: "bg-emerald-500/90 text-white border-emerald-400/40",
  CANCELLED: "bg-muted/90 text-muted-foreground border-border/40",
  COMPLETED: "bg-primary/90 text-primary-foreground border-primary/40",
  NO_SHOW: "bg-destructive/90 text-destructive-foreground border-destructive/40",
};

const PAY_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-500/90 text-white border-amber-400/40",
  SUCCEEDED: "bg-emerald-500/90 text-white border-emerald-400/40",
  FAILED: "bg-destructive/90 text-destructive-foreground border-destructive/40",
  REFUNDED: "bg-muted/90 text-muted-foreground border-border/40",
  CANCELLED: "bg-muted/90 text-muted-foreground border-border/40",
};

/** Neon chip palette — a booking's game hashes to one stable color. */
const GAME_PALETTE = [
  { chip: "border-violet-400/70 bg-violet-500/15 text-violet-200", icon: "bg-violet-500/30 text-violet-200" },
  { chip: "border-teal-400/70 bg-teal-500/15 text-teal-200", icon: "bg-teal-500/30 text-teal-200" },
  { chip: "border-amber-400/70 bg-amber-500/15 text-amber-200", icon: "bg-amber-500/30 text-amber-200" },
  { chip: "border-sky-400/70 bg-sky-500/15 text-sky-200", icon: "bg-sky-500/30 text-sky-200" },
  { chip: "border-rose-400/70 bg-rose-500/15 text-rose-200", icon: "bg-rose-500/30 text-rose-200" },
  { chip: "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-200", icon: "bg-fuchsia-500/30 text-fuchsia-200" },
  { chip: "border-emerald-400/70 bg-emerald-500/15 text-emerald-200", icon: "bg-emerald-500/30 text-emerald-200" },
  { chip: "border-indigo-400/70 bg-indigo-500/15 text-indigo-200", icon: "bg-indigo-500/30 text-indigo-200" },
];

function gamePalette(gameId: string) {
  let h = 0;
  for (let i = 0; i < gameId.length; i++)
    h = (h * 31 + gameId.charCodeAt(i)) | 0;
  return GAME_PALETTE[Math.abs(h) % GAME_PALETTE.length];
}

export function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Visible grid range — Sunday on/before the 1st through Saturday on/after month end. */
export function calendarRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "10:00 – 12:00" compact 24h range for cell chips. */
function fmtRange(startAt: string, endAt: string) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return `${new Date(startAt).toLocaleTimeString([], opts)} – ${new Date(
    endAt
  ).toLocaleTimeString([], opts)}`;
}

/** Compact booking card shown in the day-details sheet. */
function DayBooking({ booking }: { booking: Booking }) {
  const palette = gamePalette(booking.game.id);
  return (
    <div className="glass-card rounded-lg p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              palette.icon
            )}
          >
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {booking.game.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{booking.user.name}</span>
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-0.5 font-display text-sm font-bold text-primary">
          <IndianRupee className="h-3.5 w-3.5" />
          {formatINR(booking.totalAmount)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>{formatSlot(booking.startAt, booking.endAt)}</span>
        <span>·</span>
        <span>{booking.durationMinutes} min</span>
        <span>·</span>
        <span className="font-mono">#{booking.bookingNumber}</span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge className={`${STATUS_STYLES[booking.status]} text-xs`}>
          {booking.status.replace("_", " ")}
        </Badge>
        <Badge className={`${PAY_STYLES[booking.paymentStatus]} text-xs`}>
          {booking.paymentStatus === "SUCCEEDED"
            ? "Paid"
            : booking.paymentStatus === "PENDING"
              ? "Unpaid"
              : booking.paymentStatus}
        </Badge>
      </div>
    </div>
  );
}

interface BookingsCalendarProps {
  bookings: Booking[];
  isPending?: boolean;
  /** First day of the visible month. */
  month: Date;
  onMonthChange: (month: Date) => void;
}

/** Month grid — per-game colored chips per day, click a day for its full list. */
export function BookingsCalendar({
  bookings,
  isPending,
  month,
  onMonthChange,
}: BookingsCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const today = new Date();

  const { start, end } = calendarRange(month);

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      rows.push(row);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = dayKey(new Date(b.startAt));
      const arr = map.get(key);
      if (arr) arr.push(b);
      else map.set(key, [b]);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }
    return map;
  }, [bookings]);

  const selectedBookings = selectedDay
    ? (byDay.get(dayKey(selectedDay)) ?? [])
    : [];

  const shiftMonth = (delta: number) =>
    onMonthChange(
      new Date(month.getFullYear(), month.getMonth() + delta, 1)
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Month & Nav Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight">
            Calendar ·{" "}
            <span className="text-primary">
              {month.toLocaleString([], { month: "long", year: "numeric" })}
            </span>
          </h2>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 sm:px-3"
            onClick={() => onMonthChange(firstOfMonth(new Date()))}
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday headers & Days grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center text-xs font-medium text-muted-foreground"
          >
            <span className="sm:hidden">{d.short}</span>
            <span className="hidden sm:inline">{d.full}</span>
          </div>
        ))}

        {weeks.flat().map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = sameDay(day, today);
          const isSelected = selectedDay && sameDay(day, selectedDay);
          const dayBookings = byDay.get(dayKey(day)) ?? [];
          return (
            <button
              key={dayKey(day)}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                "group relative flex min-h-[56px] sm:min-h-24 md:min-h-28 flex-col gap-1 rounded-lg border p-1 sm:p-2 text-left transition-all duration-200 overflow-hidden",
                inMonth
                  ? "border-border bg-card/40 hover:border-primary/60 hover:bg-card/60 hover:shadow-[0_0_20px_-6px] hover:shadow-primary/40"
                  : "border-border/50 bg-transparent opacity-45 hover:border-primary/40 hover:opacity-75",
                isToday &&
                  "border-primary/80 bg-primary/5 shadow-[0_0_24px_-4px] shadow-primary/60 ring-1 ring-primary/30",
                isSelected &&
                  "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
              )}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    isToday && "text-primary font-bold",
                    !inMonth && "text-muted-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                {dayBookings.length > 0 && (
                  <>
                    <span className="sm:hidden flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[9px] font-bold text-primary">
                      {dayBookings.length}
                    </span>
                    <span className="hidden sm:inline text-[9px] leading-none text-muted-foreground truncate">
                      {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>

              {/* Mobile indicator dots */}
              {dayBookings.length > 0 && (
                <div className="flex sm:hidden flex-wrap items-center gap-1 mt-auto pt-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <span
                      key={b.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        b.status === "CANCELLED"
                          ? "bg-muted-foreground/40"
                          : b.status === "COMPLETED"
                            ? "bg-primary"
                            : b.status === "CONFIRMED"
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                      )}
                    />
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="text-[8px] leading-none text-muted-foreground font-semibold">
                      +{dayBookings.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Tablet/Desktop chips */}
              <div className="hidden sm:flex flex-col gap-1 w-full">
                {dayBookings.slice(0, MAX_CHIPS).map((b) => {
                  const palette = gamePalette(b.game.id);
                  return (
                    <span
                      key={b.id}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-md border border-l-2 px-1.5 py-1",
                        palette.chip,
                        b.status === "CANCELLED" && "opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                          palette.icon
                        )}
                      >
                        <Gamepad2 className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[10px] font-semibold leading-tight",
                            b.status === "CANCELLED" && "line-through"
                          )}
                        >
                          {b.game.name}
                        </span>
                        <span className="block truncate text-[9px] leading-tight opacity-80">
                          {fmtRange(b.startAt, b.endAt)}
                        </span>
                      </span>
                      <ChevronRight className="hidden lg:block h-3 w-3 shrink-0 opacity-60" />
                    </span>
                  );
                })}

                {dayBookings.length > MAX_CHIPS && (
                  <span className="px-1 text-[10px] text-muted-foreground truncate">
                    +{dayBookings.length - MAX_CHIPS} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading bookings…
        </div>
      )}

      {/* Legend & Hint */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>Click any day to view complete bookings.</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Completed
          </span>
        </div>
      </div>

      {/* Selected Day Sheet */}
      <Sheet
        open={!!selectedDay}
        onOpenChange={(v) => !v && setSelectedDay(null)}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md p-4 sm:p-6"
        >
          {selectedDay && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base sm:text-lg">
                  {selectedDay.toLocaleDateString([], {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </SheetTitle>
                <SheetDescription>
                  {selectedBookings.length === 0
                    ? "No bookings scheduled on this day."
                    : `${selectedBookings.length} booking${
                        selectedBookings.length === 1 ? "" : "s"
                      }`}
                </SheetDescription>
              </SheetHeader>

              {selectedBookings.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No bookings on this day.
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-3">
                  {selectedBookings.map((b) => (
                    <DayBooking key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
