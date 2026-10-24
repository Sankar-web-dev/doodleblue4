"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Gamepad2,
  IndianRupee,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Wallet,
  XCircle,
} from "lucide-react";

import type {
  Booking,
  BookingPaymentMethod,
  BookingStatus,
  PaymentStatus,
} from "@/api/bookings.api";
import { formatINR, formatDateTime } from "@/lib/format";
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
import GenericTable from "@/components/ui/generic-table";

import {
  useAllBookings,
  useUpdateBookingStatus,
  useVerifyBookingPayment,
} from "../_hooks/use-bookings";

/* ------------------------------------------------------------------ */
/*  Styles and labels                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Summary cards (Revenue & Bookings Overview)                      */
/* ------------------------------------------------------------------ */

function SummaryCards({ bookings }: { bookings: Booking[] }) {
  const stats = useMemo(() => {
    let totalCollected = 0;
    let pendingAmount = 0;
    let paidCount = 0;

    for (const b of bookings) {
      const amt =
        typeof b.totalAmount === "number"
          ? b.totalAmount
          : Number(b.totalAmount) || 0;
      if (b.paymentStatus === "SUCCEEDED") {
        totalCollected += amt;
        paidCount++;
      } else if (b.paymentStatus === "PENDING" && b.status !== "CANCELLED") {
        pendingAmount += amt;
      }
    }
    return {
      totalCollected,
      pendingAmount,
      paidCount,
      totalCount: bookings.length,
    };
  }, [bookings]);

  const cards = [
    {
      label: "Total Collected",
      value: formatINR(stats.totalCollected),
      subtext: `${stats.paidCount} settled booking${stats.paidCount === 1 ? "" : "s"}`,
      icon: <Wallet className="h-5 w-5 text-emerald-500" />,
      accent: "text-emerald-500",
    },
    {
      label: "Pending Payment",
      value: formatINR(stats.pendingAmount),
      subtext: "Awaiting counter or online payment",
      icon: <Receipt className="h-5 w-5 text-amber-500" />,
      accent: "text-amber-500",
    },
    {
      label: "Paid Bookings",
      value: stats.paidCount.toString(),
      subtext: "Paid bookings count",
      icon: <CheckCircle2 className="h-5 w-5 text-teal-400" />,
      accent: "text-teal-400",
    },
    {
      label: "Total Bookings",
      value: stats.totalCount.toString(),
      subtext: "All customer reservations",
      icon: <CalendarDays className="h-5 w-5 text-primary" />,
      accent: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="glass-card">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              {c.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
              <p className={`text-lg font-bold tracking-tight ${c.accent}`}>
                {c.value}
              </p>
              <p className="truncate text-[10px] text-muted-foreground/70">
                {c.subtext}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Actions Dropdown                                          */
/* ------------------------------------------------------------------ */

function BookingActions({ booking }: { booking: Booking }) {
  const update = useUpdateBookingStatus();
  const verify = useVerifyBookingPayment();
  const busy = update.isPending || verify.isPending;

  const act = (input: Parameters<typeof update.mutate>[0]["input"]) =>
    update.mutate({ id: booking.id, input });

  // For completed bookings, no action button is needed
  if (booking.status === "COMPLETED") {
    return null;
  }

  return (
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
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Card Row                                                  */
/* ------------------------------------------------------------------ */

function BookingRow({ booking }: { booking: Booking }) {
  const discount = Number(booking.discountAmount) || 0;

  return (
    <Card className="glass-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gamepad2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{booking.game.name}</p>
            {booking.boardNumber != null && (
              <Badge variant="outline" className="text-[11px] font-mono">
                Board #{booking.boardNumber}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {booking.user.name} · {booking.user.email}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{fmtDateTime(booking.startAt)}</span>
            <span>·</span>
            <span>{booking.durationMinutes} min</span>
            <span>·</span>
            <span className="font-mono">#{booking.bookingNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method Badge */}
          <Badge variant="outline" className="gap-1 text-xs">
            {booking.paymentMethod === "STRIPE" ? (
              <CreditCard className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Wallet className="h-3 w-3 text-muted-foreground" />
            )}
            {booking.paymentMethod === "STRIPE" ? "Stripe" : "Pay at Centre"}
          </Badge>

          {/* Booking Status Badge */}
          <Badge className={`${STATUS_STYLES[booking.status]} text-xs`}>
            {booking.status.replace("_", " ")}
          </Badge>

          {/* Payment Status Badge */}
          <Badge className={`${PAY_STYLES[booking.paymentStatus]} text-xs`}>
            {booking.paymentStatus === "SUCCEEDED" ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <Receipt className="mr-1 h-3 w-3" />
            )}
            {booking.paymentStatus === "SUCCEEDED"
              ? "Paid"
              : booking.paymentStatus === "PENDING"
                ? "Unpaid"
                : booking.paymentStatus}
          </Badge>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-0.5 font-display text-base font-bold text-primary">
              <IndianRupee className="h-4 w-4" />
              {formatINR(booking.totalAmount)}
            </span>
            {discount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                <Tag className="h-2.5 w-2.5" />
                Saved {formatINR(discount)}
              </span>
            )}
          </div>

          <BookingActions booking={booking} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Columns Configuration                                       */
/* ------------------------------------------------------------------ */

function useBookingColumns() {
  return useMemo<ColumnDef<Booking, unknown>[]>(
    () => [
      {
        accessorKey: "user",
        header: "Customer",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "game",
        header: "Game & Slot",
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{b.game.name}</p>
                {b.boardNumber != null && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    B#{b.boardNumber}
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {fmtDateTime(b.startAt)} · #{b.bookingNumber}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => {
          const method = row.original.paymentMethod;
          return (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              {method === "STRIPE" ? (
                <CreditCard className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Wallet className="h-3 w-3 text-muted-foreground" />
              )}
              {method === "STRIPE" ? "Stripe" : "Pay at Centre"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => {
          const s = row.original.paymentStatus;
          return (
            <Badge className={`${PAY_STYLES[s]} text-xs`}>
              {s === "SUCCEEDED" ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <Receipt className="mr-1 h-3 w-3" />
              )}
              {s === "SUCCEEDED" ? "Paid" : s === "PENDING" ? "Unpaid" : s}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => {
          const discount = Number(row.original.discountAmount) || 0;
          return (
            <div>
              <span className="flex items-center gap-0.5 font-display text-sm font-bold text-primary">
                <IndianRupee className="h-3.5 w-3.5" />
                {formatINR(row.original.totalAmount)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] text-emerald-500">
                  -{formatINR(discount)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Booking Status",
        cell: ({ row }) => (
          <Badge className={`${STATUS_STYLES[row.original.status]} text-xs`}>
            {row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <BookingActions booking={row.original} />
          </div>
        ),
      },
    ],
    []
  );
}

/* ------------------------------------------------------------------ */
/*  AdminBookings Component                                           */
/* ------------------------------------------------------------------ */

export function AdminBookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [payStatusFilter, setPayStatusFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [methodFilter, setMethodFilter] = useState<"ALL" | BookingPaymentMethod>("ALL");
  const [showCancelled, setShowCancelled] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data, isPending, error, refetch } = useAllBookings({
    limit: 100,
    includeCancelled: showCancelled,
  });

  const allBookings = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allBookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (payStatusFilter !== "ALL" && b.paymentStatus !== payStatusFilter) return false;
      if (methodFilter !== "ALL" && b.paymentMethod !== methodFilter) return false;

      if (q) {
        const matches =
          b.game.name.toLowerCase().includes(q) ||
          b.user.name.toLowerCase().includes(q) ||
          b.user.email.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q) ||
          (b.boardNumber != null && String(b.boardNumber).includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allBookings, statusFilter, payStatusFilter, methodFilter, search]);

  const columns = useBookingColumns();

  const isFiltered =
    search !== "" ||
    statusFilter !== "ALL" ||
    payStatusFilter !== "ALL" ||
    methodFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPayStatusFilter("ALL");
    setMethodFilter("ALL");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Bookings &amp; Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage reservations, track collections, verify transactions, and process counter payments.
        </p>
      </div>

      {/* Revenue & Booking Summary Cards */}
      {!isPending && !error && <SummaryCards bookings={allBookings} />}

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="bookings-search"
              className="pl-9 w-full"
              placeholder="Search game, customer, booking #, board…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 shrink-0 self-start sm:self-auto">
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("cards")}
              title="Cards view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Booking Status */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | BookingStatus)}
          >
            <SelectTrigger id="booking-status-filter" className="h-9 w-36 sm:w-40 text-xs">
              <SelectValue placeholder="Booking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All booking statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="NO_SHOW">No-show</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status */}
          <Select
            value={payStatusFilter}
            onValueChange={(v) => setPayStatusFilter(v as "ALL" | PaymentStatus)}
          >
            <SelectTrigger id="booking-payment-status-filter" className="h-9 w-36 sm:w-40 text-xs">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All payment statuses</SelectItem>
              <SelectItem value="SUCCEEDED">Paid</SelectItem>
              <SelectItem value="PENDING">Unpaid</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Method */}
          <Select
            value={methodFilter}
            onValueChange={(v) => setMethodFilter(v as "ALL" | BookingPaymentMethod)}
          >
            <SelectTrigger id="booking-method-filter" className="h-9 w-36 sm:w-40 text-xs">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All payment methods</SelectItem>
              <SelectItem value="STRIPE">Online (Stripe)</SelectItem>
              <SelectItem value="PAY_AT_CENTRE">Pay at Centre</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Cancelled */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setShowCancelled((v) => !v)}
          >
            {showCancelled ? "Hide cancelled" : "Show cancelled"}
          </Button>

          {/* Clear Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading bookings…
        </div>
      )}

      {/* Error display */}
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

      {/* Empty State */}
      {!isPending && !error && filteredBookings.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No bookings found</p>
          <p className="text-xs text-muted-foreground">
            {isFiltered
              ? "Try adjusting your search query or status filters."
              : "Customer reservations and payments will appear here."}
          </p>
        </div>
      )}

      {/* Bookings Display: Cards View */}
      {!isPending && !error && filteredBookings.length > 0 && viewMode === "cards" && (
        <div className="flex flex-col gap-3">
          {filteredBookings.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </div>
      )}

      {/* Bookings Display: Table View */}
      {!isPending && !error && filteredBookings.length > 0 && viewMode === "table" && (
        <GenericTable
          columns={columns}
          data={filteredBookings}
          sort
          pagination
        />
      )}
    </div>
  );
}
