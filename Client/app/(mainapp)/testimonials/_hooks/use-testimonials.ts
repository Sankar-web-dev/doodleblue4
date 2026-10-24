import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  testimonialsApi,
  TESTIMONIALS_KEY,
  type CreateTestimonialParams,
  type ListAdminTestimonialsParams,
  type UpdateTestimonialStatusParams,
} from "@/api/testimonials.api";

/** Current user's submitted testimonials */
export function useMyTestimonials() {
  return useQuery({
    queryKey: [...TESTIMONIALS_KEY, "my"],
    queryFn: () => testimonialsApi.getMy(),
  });
}

/** Public approved testimonials wall */
export function usePublicTestimonials() {
  return useQuery({
    queryKey: [...TESTIMONIALS_KEY, "public"],
    queryFn: () => testimonialsApi.getPublic(),
  });
}

/** Featured testimonials displayed on hero landing page */
export function useHeroTestimonials() {
  return useQuery({
    queryKey: [...TESTIMONIALS_KEY, "hero"],
    queryFn: () => testimonialsApi.getHero(),
  });
}

/** Admin management — list with filters, pagination and stats */
export function useAdminTestimonials(
  params: ListAdminTestimonialsParams = { limit: 50 }
) {
  return useQuery({
    queryKey: [...TESTIMONIALS_KEY, "admin", params],
    queryFn: () => testimonialsApi.listAdmin(params),
  });
}

/** User submits a new testimonial */
export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestimonialParams) => testimonialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
    },
  });
}

/** Admin updates testimonial status */
export function useUpdateTestimonialStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTestimonialStatusParams;
    }) => testimonialsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
    },
  });
}

/** Admin toggles placing testimonial on the hero page */
export function useSetHeroTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isHero }: { id: string; isHero: boolean }) =>
      testimonialsApi.setHero(id, isHero),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
    },
  });
}

/** Admin deletes a testimonial */
export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testimonialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
    },
  });
}
