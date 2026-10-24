import { api } from "@/lib/api";

export const REPORTS_SUMMARY_KEY = ["reports", "summary"] as const;

export interface MonthlyRevenuePoint {
  /** `YYYY-M` bucket key. */
  month: string;
  /** Short label like "Oct". */
  label: string;
  total: number;
}

export interface PopularGame {
  gameId: string;
  name: string;
  bookings: number;
}

export interface BookingStat {
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  count: number;
}

export interface MembershipStat {
  plan: string;
  count: number;
}

export interface ReportsSummary {
  /** Succeeded payments per month — last 6 months including current. */
  monthlyRevenue: MonthlyRevenuePoint[];
  /** Top 5 games by booking count. */
  popularGames: PopularGame[];
  /** Booking counts by status (zero-filled). */
  bookingStats: BookingStat[];
  /** Active members per plan. */
  memberships: MembershipStat[];
  /** Estimated recurring revenue per month (yearly subs ÷ 12). */
  estimatedMonthlyRecurringRevenue: number;
  currency: string;
}

export const reportsApi = {
  summary: () => api.get<ReportsSummary>("/api/v1/reports/summary"),
};
