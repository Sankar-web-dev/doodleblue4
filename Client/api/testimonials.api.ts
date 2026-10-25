import { api, PaginationMeta } from "@/lib/api";

export const TESTIMONIALS_KEY = ["testimonials"] as const;

export type TestimonialStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TestimonialUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  rating: number;
  headline: string | null;
  content: string;
  status: TestimonialStatus;
  isHero: boolean;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: TestimonialUser;
}

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hero: number;
}

export interface CreateTestimonialParams {
  rating: number;
  headline?: string;
  content: string;
}

export interface UpdateTestimonialStatusParams {
  status: TestimonialStatus;
  adminNote?: string;
}

export interface ListAdminTestimonialsParams {
  status?: TestimonialStatus;
  isHero?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

function qs(params: ListAdminTestimonialsParams) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const testimonialsApi = {
  /** Featured hero testimonials (placed on hero by admin) */
  getHero: () => api.get<Testimonial[]>("/api/v1/testimonials/hero"),

  /** Public approved testimonials */
  getPublic: () => api.get<Testimonial[]>("/api/v1/testimonials/public"),

  /** User's own submitted testimonials */
  getMy: () => api.get<Testimonial[]>("/api/v1/testimonials/my"),

  /** User submits a testimonial */
  create: (data: CreateTestimonialParams) =>
    api.post<Testimonial>("/api/v1/testimonials", data),

  /** Admin list with filters, search, pagination, and stats */
  listAdmin: (params: ListAdminTestimonialsParams = {}) =>
    api.getWithMeta<Testimonial[], PaginationMeta & { stats?: TestimonialStats }>(
      `/api/v1/testimonials/admin${qs(params)}`
    ),

  /** Admin updates testimonial status (APPROVED, REJECTED, PENDING) */
  updateStatus: (id: string, data: UpdateTestimonialStatusParams) =>
    api.patch<Testimonial>(`/api/v1/testimonials/${id}/status`, data),

  /** Admin places or unplaces testimonial on the hero landing page */
  setHero: (id: string, isHero: boolean) =>
    api.patch<Testimonial>(`/api/v1/testimonials/${id}/hero`, { isHero }),

  /** Admin deletes a testimonial */
  delete: (id: string) =>
    api.delete<{ id: string; deleted: boolean }>(`/api/v1/testimonials/${id}`),
};
