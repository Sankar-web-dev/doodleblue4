import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import { STATS } from "../_lib/constants";
import { Reveal } from "./reveal";
import { HeroTestimonialPill } from "./hero-testimonial-pill";

const CORNER = "pointer-events-none absolute h-5 w-5 border-violet-400/70";

/** Full-viewport hero — giant display type + live-arena HUD panel. */
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-[130px]" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-violet-400/5 blur-[110px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-violet-400">
                {"// Indoor gaming arena"}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-violet-400/40 to-transparent" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-6 font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl xl:text-8xl">
              Ready.
              <br />
              Set.
              <br />
              <span className="text-violet-400">Play.</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-7 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
              50+ game stations across 10 zones — chess, pool, darts, PS5 pods
              and more. Book in seconds, play all night.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-violet-400 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-black shadow-[0_0_30px_-6px_rgba(139,92,246,0.7)] transition-all hover:bg-violet-300 hover:shadow-[0_0_40px_-4px_rgba(139,92,246,0.8)]"
              >
                Book a station
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-violet-400/60 hover:text-violet-300"
              >
                <Play className="h-4 w-4" />
                Sign in
              </Link>
            </div>
            <HeroTestimonialPill />
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-14 flex flex-wrap gap-x-10 gap-y-5">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-bold text-violet-400">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* PlayStation-style controller visual */}
        <Reveal delay={250} className="hidden lg:block">
          <div className="relative border border-white/10 bg-[#0b0b0b]/80 p-7 backdrop-blur-xl">
            <span aria-hidden className={`${CORNER} -left-px -top-px border-l-2 border-t-2`} />
            <span aria-hidden className={`${CORNER} -right-px -top-px border-r-2 border-t-2`} />
            <span aria-hidden className={`${CORNER} -bottom-px -left-px border-b-2 border-l-2`} />
            <span aria-hidden className={`${CORNER} -bottom-px -right-px border-b-2 border-r-2`} />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                {"// Quick book"}
              </span>
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                Live
              </span>
            </div>

            {/* Booking card mock */}
            <div className="mt-7 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div>
                  <p className="text-sm font-bold text-white">PS5 Arena · Pod 04</p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    4K pod · DualSense · 2 free now
                  </p>
                </div>
                <span className="rounded-sm border border-violet-400/40 bg-violet-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-300">
                  Open
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                  Pick a slot
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <span className="rounded-md border border-white/10 py-2.5 text-center text-[11px] font-semibold text-neutral-500">
                    6:00 PM
                  </span>
                  <span className="rounded-md border border-white/10 py-2.5 text-center text-[11px] font-semibold text-neutral-500">
                    7:00 PM
                  </span>
                  <span className="rounded-md bg-violet-400 py-2.5 text-center text-[11px] font-bold text-black shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]">
                    8:00 PM
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                    From
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">
                    ₹149<span className="text-xs font-medium text-neutral-500"> / hr</span>
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="rounded-md bg-violet-400 px-6 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)] transition-all hover:bg-violet-300"
                >
                  Reserve
                </Link>
              </div>
            </div>

            <div className="mt-7 rounded-md border border-violet-400/20 bg-violet-400/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
                Tonight: PS5 showdown · 8 PM
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
