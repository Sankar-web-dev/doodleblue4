import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "./reveal";

const CORNER = "pointer-events-none absolute h-6 w-6 border-violet-400/80";

/** Closing call-to-action — big HUD frame, one button. */
export function CtaSection() {
  return (
    <section className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-4xl px-5">
        <Reveal>
          <div className="relative border border-white/10 bg-[#0b0b0b] px-8 py-16 text-center sm:px-16">
            <span aria-hidden className={`${CORNER} -left-px -top-px border-l-2 border-t-2`} />
            <span aria-hidden className={`${CORNER} -right-px -top-px border-r-2 border-t-2`} />
            <span aria-hidden className={`${CORNER} -bottom-px -left-px border-b-2 border-l-2`} />
            <span aria-hidden className={`${CORNER} -bottom-px -right-px border-b-2 border-r-2`} />

            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-violet-400">
              {"// Your station is waiting"}
            </p>
            <h2 className="mx-auto mt-6 max-w-xl font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl">
              Ready to <span className="text-violet-400">enter?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-neutral-400">
              Create your account, pick a membership, and your first booking
              takes under a minute.
            </p>
            <Link
              href="/signup"
              className="mt-10 inline-flex items-center gap-2 rounded-md bg-violet-400 px-8 py-4 text-sm font-bold uppercase tracking-widest text-black shadow-[0_0_32px_-6px_rgba(139,92,246,0.7)] transition-all hover:bg-violet-300 hover:shadow-[0_0_44px_-4px_rgba(139,92,246,0.8)]"
            >
              Join the arena
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
