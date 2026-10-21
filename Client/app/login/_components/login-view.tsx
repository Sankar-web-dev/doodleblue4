import Link from "next/link";
import { Layers } from "lucide-react";

import { AuthBrandPanel } from "@/app/_components/auth-brand-panel";
import { FEATURES } from "../_lib/constants";
import { LoginForm } from "./login-form";

/** Full login screen — brand panel + form panel layout. */
export function LoginView() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AuthBrandPanel
        headline={
          <>
            Manage access
            <br />
            <span className="text-[oklch(0.78_0.14_262)]">with confidence.</span>
          </>
        }
        subtitle="Sign in to manage bookings, games, and memberships."
        features={FEATURES}
      />

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center bg-ambient-mesh px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              DoodleBlue
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
