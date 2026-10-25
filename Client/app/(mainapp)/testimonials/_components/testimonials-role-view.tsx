"use client";

import { Suspense } from "react";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";

import { AdminTestimonials } from "./admin-testimonials";
import { UserTestimonials } from "./user-testimonials";

/** Admin gets the management view; customers get their submission & community view. */
export function TestimonialsRoleView() {
  const { user, isPending } = useAuthUser();

  if (isPending) return null;
  if (isAdmin(user)) return <AdminTestimonials />;
  return (
    <Suspense fallback={null}>
      <UserTestimonials />
    </Suspense>
  );
}
