import Link from "next/link";
import { Layers } from "lucide-react";

import { AuthBrandPanel } from "@/app/_components/auth-brand-panel";
import { FEATURES } from "../_lib/constants";
import { SignupForm } from "./signup-form";

/** Full signup screen — brand panel + form panel layout. */
export function SignupView() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AuthBrandPanel
        headline={
          <>
            Join the
            <br />
            <span className="text-[oklch(0.80_0.16_195)]">arena.</span>
          </>
        }
        subtitle="Create your account to start booking and unlock member perks."
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
              Create your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to get started — it&apos;s free
            </p>
          </div>

          <SignupForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
