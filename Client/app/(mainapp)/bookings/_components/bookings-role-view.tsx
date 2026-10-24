"use client";

import { Suspense } from "react";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";

import { AdminBookings } from "./admin-bookings";
import { MyBookings } from "./my-bookings";

/** Admin gets the management view; customers get their own bookings. */
export function BookingsRoleView() {
  const { user, isPending } = useAuthUser();

  if (isPending) return null;
  if (isAdmin(user)) return <AdminBookings />;
  return (
    <Suspense fallback={null}>
      <MyBookings />
    </Suspense>
  );
}
