import Link from "next/link";
import { Layers } from "lucide-react";

import { NAV_LINKS } from "../_lib/constants";

/** Sticky landing nav — brand left, anchors centre, auth actions right. */
export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-400 text-black shadow-[0_0_20px_-4px_rgba(139,92,246,0.7)]">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-white">
            DoodleBlue
          </span>
          <span className="hidden rounded-sm border border-violet-400/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-300 sm:inline">
            Arena
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors hover:text-violet-300"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-violet-400/60 hover:text-violet-300"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-violet-400 px-4 py-2 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)] transition-all hover:bg-violet-300"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
