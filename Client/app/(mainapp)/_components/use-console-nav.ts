"use client";

import { useMemo } from "react";

import type { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { NAV_ITEMS, type NavItem } from "./console-nav";

/**
 * Sidebar nav visibility.
 *
 * Every gated item requires "read" on its resource. SUPER_ADMIN always sees
 * everything.
 */
export function useConsoleNav(user: AuthUser | null): NavItem[] {
  const { can } = usePermissions(user);

  return useMemo(
    () => NAV_ITEMS.filter((item) => !item.resource || can(item.resource, "read")),
    [can]
  );
}
