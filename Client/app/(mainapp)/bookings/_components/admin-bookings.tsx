"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock,
  Gamepad2,
  IndianRupee,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";

import type {
  Booking,
  BookingStatus,
  PaymentStatus,
} from "@/api/bookings.api";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useAllBookings,
  useUpdateBookingStatus,
  useVerifyBookingPayment,
} from "../_hooks/use-bookings";

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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BookingRow({ booking }: { booking: Booking }) {
  const update = useUpdateBookingStatus();
  const verify = useVerifyBookingPayment();
  const busy = update.isPending || verify.isPending;

  const act = (input: Parameters<typeof update.mutate>[0]["input"]) =>
    update.mutate({ id: booking.id, input });

  return (
    <Card className="glass-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gamepad2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{booking.game.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {booking.user.name} · {booking.user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmtDateTime(booking.startAt)} · {booking.durationMinutes} min
          </p>
        </div>

        <div className="flex items-center gap-2">
          {booking.boardNumber != null && (
            <Badge variant="outline" className="text-xs">
              Board {booking.boardNumber}
            </Badge>
          )}
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

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-0.5 font-display text-base font-bold text-primary">
            <IndianRupee className="h-4 w-4" />
            {formatINR(booking.totalAmount)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {booking.status === "PENDING" && (
                <DropdownMenuItem onClick={() => act({ status: "CONFIRMED" })}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm booking
                </DropdownMenuItem>
              )}
              {booking.paymentStatus === "PENDING" &&
                booking.paymentMethod === "STRIPE" &&
                booking.status !== "CANCELLED" && (
                  <DropdownMenuItem
                    onClick={() => verify.mutate({ id: booking.id })}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify Stripe payment
                  </DropdownMenuItem>
                )}
              {booking.paymentStatus === "PENDING" &&
                booking.status !== "CANCELLED" && (
                  <DropdownMenuItem
                    onClick={() => act({ paymentStatus: "SUCCEEDED" })}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Mark as paid (counter)
                  </DropdownMenuItem>
                )}
              {booking.status === "CONFIRMED" && (
                <>
                  <DropdownMenuItem onClick={() => act({ status: "COMPLETED" })}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => act({ status: "NO_SHOW" })}>
                    <Clock className="mr-2 h-4 w-4" />
                    Mark no-show
                  </DropdownMenuItem>
                </>
              )}
              {(booking.status === "PENDING" ||
                booking.status === "CONFIRMED") && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => act({ status: "CANCELLED" })}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel booking
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/** Admin view — all customer bookings with status transitions. */
export function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>(
    "ALL"
  );
  const [search, setSearch] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const { data, isPending, error, refetch } = useAllBookings({
    limit: 100,
    includeCancelled: showCancelled,
  });

  const bookings = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (b) =>
        (statusFilter === "ALL" || b.status === statusFilter) &&
        (!q ||
          b.game.name.toLowerCase().includes(q) ||
          b.user.name.toLowerCase().includes(q) ||
          b.user.email.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q))
    );
  }, [data, statusFilter, search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer bookings — confirm, complete, mark counter payments, or
          cancel.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search game, customer, booking #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "ALL" | BookingStatus)}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="NO_SHOW">No-show</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => setShowCancelled((v) => !v)}
        >
          {showCancelled ? "Hide cancelled" : "Show cancelled"}
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading bookings…
        </div>
      )}

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

      {!isPending && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No bookings found</p>
          <p className="text-xs text-muted-foreground">
            {search || statusFilter !== "ALL"
              ? "Try a different search or filter."
              : "Customer bookings will appear here."}
          </p>
        </div>
      )}

      {!isPending && !error && bookings.length > 0 && (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
