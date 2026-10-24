import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bookingsApi,
  BOOKINGS_LIST_KEY,
  type CreateBookingInput,
  type ListBookingsParams,
  type UpdateBookingStatusInput,
} from "@/api/bookings.api";

/** Signed-in user's own bookings (server scopes non-admin lists to self). */
export function useMyBookings() {
  return useQuery({
    queryKey: [...BOOKINGS_LIST_KEY, "mine"],
    queryFn: () => bookingsApi.list({ limit: 100 }),
  });
}

/** Admin — all bookings with optional status/payment filters. */
export function useAllBookings(
  params: ListBookingsParams = { limit: 100, includeCancelled: false }
) {
  return useQuery({
    queryKey: [...BOOKINGS_LIST_KEY, "admin", params],
    queryFn: () => bookingsApi.list(params),
  });
}

/** Booked intervals for a game on a day (YYYY-MM-DD) — used to show taken slots. */
export function useGameAvailability(gameId: string | null, date: string) {
  return useQuery({
    queryKey: ["bookings", "availability", gameId, date],
    queryFn: () => bookingsApi.availability(gameId!, date),
    enabled: !!gameId && !!date,
  });
}

/** Create a booking — STRIPE returns checkoutUrl, PAY_AT_CENTRE confirms. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    },
  });
}

/** Cancel one of the user's own bookings. */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    },
  });
}

/** Verify booking payment on return from Stripe checkout. */
export function useVerifyBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId?: string }) =>
      bookingsApi.verifyPayment(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    },
  });
}

/** Admin — status transitions + counter payment collection. */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBookingStatusInput;
    }) => bookingsApi.updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_LIST_KEY });
    },
  });
}
