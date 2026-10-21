import {
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Resource } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof ShieldCheck;
  /**
   * Permission resource gating this nav item — the user needs "read" on it.
   * Omit for items every authenticated user can see (e.g. Dashboard).
   */
  resource?: Resource;
};

/**
 * All sidebar navigation items. The shell filters this list with
 * `usePermissions` — gated items are shown only when the user has "read"
 * access to that resource (SUPER_ADMIN sees everything).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/roles",        label: "Roles",        icon: ShieldCheck,    resource: "roles" },
  { href: "/users",        label: "Users",        icon: Users,          resource: "users" },
  { href: "/subscription", label: "Billing",      icon: CreditCard },
];
