"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Crown,
  Gamepad2,
  Receipt,
  ShieldCheck,
  Users,
  UserCheck,
  KeyRound,
} from "lucide-react";

import { useAuthUser } from "@/lib/use-auth-user";
import { isAdmin } from "@/lib/permissions";
import { getRoleLabel } from "@/api/auth.api";
import { useUsers } from "../users/_hooks/use-users";
import { useSubscription } from "../subscription/_hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "../_components/console-utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthUser();
  const admin = isAdmin(user);
  const firstName = user?.name.split(" ")[0] ?? "there";

  const { data: usersData, isPending: usersPending } = useUsers(undefined, admin);
  const { data: subscription } = useSubscription();

  const users = Array.isArray(usersData?.data) ? usersData.data : [];
  const activeUsers = users.filter((u) => u.isActive).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="animate-fade-up flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {greeting()},{" "}
            <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s an overview of your console.
          </p>
        </div>
        {user && (
          <Badge variant="secondary" className="w-fit text-xs">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {getRoleLabel(user.role)}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {admin && (
          <Link href="/users" className="group">
            <Card className="glass-card h-full transition-all group-hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Users
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold">
                  {usersPending ? "—" : users.length}
                </p>
                <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{activeUsers} active</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
        <Link href="/subscription" className="group">
          <Card className="glass-card h-full transition-all group-hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscription
              </CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold capitalize">
                {subscription?.plan ?? "—"}
              </p>
              <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {subscription?.status === "active"
                    ? "Active"
                    : subscription
                      ? subscription.status
                      : "No subscription"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Admin quick links */}
      {admin && (
        <div className="animate-fade-up">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Management
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/bookings", label: "Bookings", icon: CalendarDays },
              { href: "/games",    label: "Games",    icon: Gamepad2 },
              { href: "/plans",    label: "Plans",    icon: Crown },
              { href: "/payments", label: "Payments", icon: Receipt },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="glass-card h-full transition-all group-hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Account card */}
      {user && (
        <Card className="glass-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Your account
            </CardTitle>
            <CardDescription>
              Details for the signed-in user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-12 w-12 rounded-full border border-primary/20 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              {user.mustChangePassword && (
                <Badge
                  variant="outline"
                  className="ml-auto border-amber-500/30 bg-amber-500/10 text-amber-600"
                >
                  <KeyRound className="mr-1 h-3 w-3" />
                  Password reset required
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
