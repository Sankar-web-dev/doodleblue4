import { api, PaginationMeta } from "@/lib/api";

export const BOOKINGS_LIST_KEY = ["bookings", "list"] as const;
export const BOOKING_DETAIL_KEY = ["bookings", "detail"] as const;

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type BookingPaymentMethod = "STRIPE" | "PAY_AT_CENTRE";

export interface BookingGame {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl: string | null;
  capacity: number;
}

export interface BookingUser {
  id: string;
  name: string;
  email: string;
}

export interface BookingPayment {
  id: string;
  type: string;
  status: PaymentStatus;
  amount: string | number;
  currency: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  gameId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  baseAmount: string | number;
  discountPercent: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  currency: string;
  membershipPlanName: string | null;
  membershipId: string | null;
  status: BookingStatus;
  paymentMethod: BookingPaymentMethod;
  paymentStatus: PaymentStatus;
  customerNote: string | null;
  adminNote: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  game: BookingGame;
  user: BookingUser;
  payments?: BookingPayment[];
}

export interface ListBookingsParams {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  gameId?: string;
  userId?: string;
  from?: string;
  to?: string;
  includeCancelled?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateBookingStatusInput {
  status?: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  paymentStatus?: "SUCCEEDED" | "REFUNDED";
  adminNote?: string;
  cancellationReason?: string;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
}

function qs(params: ListBookingsParams) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const bookingsApi = {
  /** Customers get their own bookings; admins get all (+ filters). */
  list: (params: ListBookingsParams = {}) =>
    api.getWithMeta<Booking[], PaginationMeta>(
      `/api/v1/bookings${qs(params)}`
    ),

  get: (id: string) => api.get<Booking>(`/api/v1/bookings/${id}`),

  create: (input: {
    gameId: string;
    startAt: string;
    endAt: string;
    paymentMethod: BookingPaymentMethod;
    customerNote?: string;
  }) =>
    api.post<{ booking: Booking; checkoutUrl: string | null }>(
      "/api/v1/bookings",
      input
    ),

  cancel: (id: string, reason?: string) =>
    api.post<Booking>(`/api/v1/bookings/${id}/cancel`, { reason }),

  /** Admin-only status/payment transitions. */
  updateStatus: (id: string, input: UpdateBookingStatusInput) =>
    api.patch<Booking>(`/api/v1/bookings/${id}/status`, input),

  availability: (gameId: string, date: string) =>
    api.get<{
      gameId: string;
      date: string;
      capacity: number;
      slots: AvailabilitySlot[];
    }>(`/api/v1/bookings/availability?gameId=${gameId}&date=${date}`),
};
