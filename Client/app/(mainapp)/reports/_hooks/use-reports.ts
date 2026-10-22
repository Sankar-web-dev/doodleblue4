import { useQuery } from "@tanstack/react-query";
import { reportsApi, REPORTS_SUMMARY_KEY } from "@/api/reports.api";

/** Admin reports dashboard — server caches this for ~60s. */
export function useReportsSummary() {
  return useQuery({
    queryKey: REPORTS_SUMMARY_KEY,
    queryFn: reportsApi.summary,
    staleTime: 60_000,
  });
}
