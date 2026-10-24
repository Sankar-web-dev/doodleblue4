import Link from "next/link";
import { Layers } from "lucide-react";

/** Minimal footer — brand, anchor links, auth shortcuts. */
export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070707]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-400 text-black">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-white">
            DoodleBlue Arena
          </span>
        </div>

        <nav className="flex items-center gap-7 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          <a href="#games" className="transition-colors hover:text-violet-300">Games</a>
          <a href="#membership" className="transition-colors hover:text-violet-300">Membership</a>
          <Link href="/login" className="transition-colors hover:text-violet-300">Sign in</Link>
          <Link href="/signup" className="transition-colors hover:text-violet-300">Sign up</Link>
        </nav>

        <p className="text-[11px] text-neutral-600">
          © 2026 DoodleBlue Arena
        </p>
      </div>
    </footer>
  );
}
