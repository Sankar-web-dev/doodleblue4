"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Gamepad2,
  IndianRupee,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  BOOKINGS_LIST_KEY,
  type Booking,
  type BookingStatus,
  type PaymentStatus,
} from "@/api/bookings.api";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  useCancelBooking,
  useMyBookings,
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
  const cancel = useCancelBooking();
  // Customers can only cancel while pending — a confirmed slot is
  // admin-controlled (cancel via the venue). Backend permits both.
  const cancellable = booking.status === "PENDING";

  return (
    <Card className="glass-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gamepad2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{booking.game.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmtDateTime(booking.startAt)} –{" "}
            {new Date(booking.endAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
            #{booking.bookingNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {booking.paymentMethod === "STRIPE" ? "Online (Stripe)" : "Pay at centre"}
          </Badge>
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

        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
          <span className="flex items-center gap-0.5 font-display text-base font-bold text-primary">
            <IndianRupee className="h-4 w-4" />
            {formatINR(booking.totalAmount)}
          </span>
          {cancellable && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate({ id: booking.id })}
            >
              {cancel.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Customer "My bookings" list — also where Stripe redirects after checkout. */
export function MyBookings() {
  const params = useSearchParams();
  const paidId = params.get("paid");
  const sessionId = params.get("session_id");
  const cancelledId = params.get("cancelled");

  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useMyBookings();
  const bookings = Array.isArray(data?.data) ? data.data : [];

  const verifyPayment = useVerifyBookingPayment();
  const verifiedRef = useRef<string | null>(null);

  // If returning from Stripe with ?paid=..., verify payment directly with Stripe
  // and trigger polling intervals as a backup.
  useEffect(() => {
    if (!paidId || verifiedRef.current === paidId) return;
    verifiedRef.current = paidId;

    verifyPayment.mutate({
      id: paidId,
      sessionId: sessionId ?? undefined,
    });

    // Invalidate/refetch query a couple times to ensure list reflects final status
    const t1 = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    }, 1500);
    const t2 = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [paidId, sessionId, queryClient, verifyPayment]);

  const targetBooking = paidId ? bookings.find((b) => b.id === paidId) : null;
  const isPaidConfirmed =
    targetBooking?.paymentStatus === "SUCCEEDED" ||
    verifyPayment.data?.verified;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          My bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your game sessions — upcoming, past, and cancelled.
        </p>
      </div>

      {/* Stripe redirect banners */}
      {paidId && (
        <Card
          className={
            isPaidConfirmed
              ? "border-emerald-500/30 bg-emerald-500/5"
              : verifyPayment.isPending
                ? "border-primary/30 bg-primary/5"
                : "border-emerald-500/30 bg-emerald-500/5"
          }
        >
          <CardContent className="flex items-center gap-2 p-4 text-sm font-medium">
            {verifyPayment.isPending && !isPaidConfirmed ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <span className="text-primary">
                  Verifying your payment with Stripe…
                </span>
              </>
            ) : isPaidConfirmed ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-emerald-500">
                  Payment confirmed! Your booking is paid and confirmed.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-emerald-500">
                  Payment received — your booking is confirmed once Stripe settles.
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {cancelledId && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-2 p-4 text-sm font-medium text-amber-500">
            <XCircle className="h-4 w-4 shrink-0" />
            Checkout was cancelled — the booking is still pending payment.
          </CardContent>
        </Card>
      )}

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
          <p className="text-sm font-medium">No bookings yet</p>
          <p className="text-xs text-muted-foreground">
            Pick a game and book your first session.
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
