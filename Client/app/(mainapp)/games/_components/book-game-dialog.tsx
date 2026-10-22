"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Gamepad2,
  IndianRupee,
  Loader2,
  Wallet,
} from "lucide-react";

import type { Game } from "@/api/games.api";
import type { BookingPaymentMethod } from "@/api/bookings.api";
import { formatINR } from "@/lib/format";
import { AppDialog } from "@/components/ui/dialog";
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
  useCreateBooking,
  useGameAvailability,
} from "../../bookings/_hooks/use-bookings";

interface BookGameDialogProps {
  game: Game | null;
  onClose: () => void;
}

const PAYMENT_OPTIONS: {
  value: BookingPaymentMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: "STRIPE",
    label: "Pay online",
    hint: "Card / UPI via Stripe",
    icon: CreditCard,
  },
  {
    value: "PAY_AT_CENTRE",
    label: "Pay at centre",
    hint: "Hold the slot, pay on arrival",
    icon: Wallet,
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Local "HH:MM" for the next full hour — sensible default/min for a booking. */
function nextHourTime() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toTimeString().slice(0, 5);
}

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Booking form for one game — details → Stripe checkout or pay-at-centre. */
export function BookGameDialog({ game, onClose }: BookGameDialogProps) {
  const createBooking = useCreateBooking();

  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(nextHourTime());
  const [durationMins, setDurationMins] = useState(60);
  const [paymentMethod, setPaymentMethod] =
    useState<BookingPaymentMethod>("STRIPE");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: availability } = useGameAvailability(game?.id ?? null, date);

  const durations = useMemo(() => {
    if (!game) return [];
    const out: number[] = [];
    for (let m = game.minBookingMins; m <= game.maxBookingMins; m += 30) {
      out.push(m);
    }
    return out.length ? out : [game.minBookingMins];
  }, [game]);

  const effectiveDuration = durations.includes(durationMins)
    ? durationMins
    : durations[0] ?? 60;

  const estTotal = game
    ? (Number(game.pricePerHour) * effectiveDuration) / 60
    : 0;

  const error =
    formError ??
    (createBooking.error instanceof Error ? createBooking.error.message : null);

  function reset() {
    setDate(todayISO());
    setTime(nextHourTime());
    setPaymentMethod("STRIPE");
    setNote("");
    setDone(false);
    setFormError(null);
    createBooking.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!game) return;
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return;
    if (start.getTime() <= Date.now()) {
      setFormError("Pick a start time in the future.");
      return;
    }
    setFormError(null);
    const end = new Date(start.getTime() + effectiveDuration * 60_000);

    createBooking.mutate(
      {
        gameId: game.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        paymentMethod,
        customerNote: note.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) {
            window.location.assign(res.checkoutUrl);
            return;
          }
          setDone(true);
        },
      }
    );
  }

  const taken = availability?.slots ?? [];

  return (
    <AppDialog
      open={!!game}
      onOpenChange={(open) => !open && handleClose()}
      title={game ? `Book ${game.name}` : "Book game"}
      icon={<Gamepad2 className="h-5 w-5 text-primary" />}
      description={
        game
          ? `${game.category} · ${formatINR(game.pricePerHour)}/hr · up to ${game.capacity} players`
          : undefined
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="font-display text-lg font-bold">Booking confirmed</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your slot is held — pay at the centre when you arrive. You can
            review or cancel it anytime.
          </p>
          <Button asChild className="mt-2 bg-primary text-primary-foreground">
            <Link href="/bookings">View my bookings</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="book-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </Label>
              <Input
                id="book-date"
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-time" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Start time
              </Label>
              <Input
                id="book-time"
                type="time"
                min={date === todayISO() ? nextHourTime() : undefined}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-11 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </Label>
            <Select
              value={String(effectiveDuration)}
              onValueChange={(v) => setDurationMins(Number(v))}
            >
              <SelectTrigger className="h-11 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes{m >= 60 ? ` (${m / 60}h)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {taken.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                Already booked on this date
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {taken.map((s) => (
                  <span
                    key={s.startAt}
                    className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600"
                  >
                    {fmtSlot(s.startAt)} – {fmtSlot(s.endAt)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment method
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map((opt) => {
                const active = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-6px] shadow-primary/40"
                        : "border-border/70 hover:border-primary/40"
                    }`}
                  >
                    <opt.icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note <span className="font-normal">(optional)</span>
            </Label>
            <textarea
              id="book-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Anything we should know? (squad size, requests…)"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {effectiveDuration} min ·{" "}
              <CalendarDays className="h-3.5 w-3.5" /> {date} {time}
            </span>
            <span className="flex items-center gap-1 font-display text-lg font-bold text-primary">
              <IndianRupee className="h-4 w-4" />
              {formatINR(estTotal)}
            </span>
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Member discounts are applied automatically at checkout.
          </p>

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90"
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking…
              </>
            ) : paymentMethod === "STRIPE" ? (
              <>Continue to payment · {formatINR(estTotal)}</>
            ) : (
              <>Confirm booking · {formatINR(estTotal)}</>
            )}
          </Button>
        </form>
      )}
    </AppDialog>
  );
}
