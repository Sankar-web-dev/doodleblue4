import {
  CalendarDays,
  CreditCard,
  Crown,
  Gamepad2,
  LayoutDashboard,
  Receipt,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Show only to SUPER_ADMIN users. Omit for items every user can see. */
  adminOnly?: boolean;
};

/**
 * All sidebar navigation items. `adminOnly` items are filtered out for
 * non-admin users (the server enforces the same restriction).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/bookings",     label: "Bookings",     icon: CalendarDays,    adminOnly: true },
  { href: "/games",        label: "Games",        icon: Gamepad2,        adminOnly: true },
  { href: "/plans",        label: "Plans",        icon: Crown,           adminOnly: true },
  { href: "/payments",     label: "Payments",     icon: Receipt,         adminOnly: true },
  { href: "/users",        label: "Users",        icon: Users,           adminOnly: true },
  { href: "/subscription", label: "Billing",      icon: CreditCard },
];
