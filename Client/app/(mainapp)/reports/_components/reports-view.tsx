"use client";

import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { useReportsSummary } from "../_hooks/use-reports";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

/** Blue-to-cyan bar, matching the prototype's gradient. */
const BAR_GRADIENT = "bg-gradient-to-r from-sky-500 to-cyan-400";
const BAR_GRADIENT_Y = "bg-gradient-to-t from-sky-600 to-cyan-400";

function pct(value: number, max: number) {
  return max > 0 ? Math.max((value / max) * 100, 2) : 0;
}

function BarRow({
  label,
  value,
  max,
  right,
}: {
  label: string;
  value: number;
  max: number;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full ${BAR_GRADIENT}`}
          style={{ width: `${pct(value, max)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium">
        {right ?? value}
      </span>
    </div>
  );
}

export function ReportsView() {
  const { user: currentUser } = useAuthUser();
  const admin = isAdmin(currentUser);

  const { data, isPending, error, refetch } = useReportsSummary();

  if (currentUser && !admin) {
    return (
      <ForbiddenState message="Administrator access is required to view reports." />
    );
  }

  const maxRevenue = Math.max(...(data?.monthlyRevenue ?? []).map((m) => m.total), 0);
  const maxGameBookings = Math.max(...(data?.popularGames ?? []).map((g) => g.bookings), 0);
  const maxBookingCount = Math.max(...(data?.bookingStats ?? []).map((s) => s.count), 0);
  const maxMembers = Math.max(...(data?.memberships ?? []).map((m) => m.count), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue, bookings, and membership performance at a glance.
        </p>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reports…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load reports."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && data && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Monthly revenue — vertical bars, last 6 months */}
          <Card className="glass-card animate-fade-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">
                Monthly revenue ({data.currency})
              </h2>
              <div className="mt-6 flex justify-between gap-3">
                {data.monthlyRevenue.map((m) => (
                  <div
                    key={m.month}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {m.total > 0 ? formatINR(m.total) : ""}
                    </span>
                    <div className="flex h-32 w-full items-end">
                      <div
                        className={`mx-auto w-full max-w-10 rounded-t-md ${BAR_GRADIENT_Y}`}
                        style={{ height: `${pct(m.total, maxRevenue)}%` }}
                        title={`${m.label}: ${formatINR(m.total)}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular games — most booked */}
          <Card className="glass-card animate-fade-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Popular games</h2>
              <div className="mt-6 flex flex-col gap-4">
                {data.popularGames.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No bookings yet.
                  </p>
                )}
                {data.popularGames.map((g) => (
                  <BarRow
                    key={g.gameId}
                    label={g.name}
                    value={g.bookings}
                    max={maxGameBookings}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Booking statistics — counts by status */}
          <Card className="glass-card animate-fade-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Booking statistics</h2>
              <div className="mt-6 flex flex-col gap-4">
                {data.bookingStats.map((s) => (
                  <BarRow
                    key={s.status}
                    label={BOOKING_STATUS_LABELS[s.status] ?? s.status}
                    value={s.count}
                    max={maxBookingCount}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Membership statistics — members per plan + MRR */}
          <Card className="glass-card animate-fade-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold">Membership statistics</h2>
              <div className="mt-6 flex flex-col gap-4">
                {data.memberships.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active memberships yet.
                  </p>
                )}
                {data.memberships.map((m) => (
                  <BarRow
                    key={m.plan}
                    label={m.plan}
                    value={m.count}
                    max={maxMembers}
                  />
                ))}
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Est. recurring revenue:{" "}
                <span className="font-medium text-foreground">
                  {formatINR(data.estimatedMonthlyRecurringRevenue)}/month
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
