import Link from "next/link";
import { Check } from "lucide-react";

import { TIERS } from "../_lib/constants";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** Membership tiers — featured plan highlighted in lime. */
export function PricingSection() {
  return (
    <section id="membership" className="relative border-t border-white/5 bg-[#070707] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="// Pick your pass"
          title="Membership"
          accent="tiers."
          description="Start with a day pass, go monthly for the perks. Cancel anytime."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 120}>
              <div
                className={`relative flex h-full flex-col border p-7 ${
                  t.featured
                    ? "border-violet-400/60 bg-violet-400/[0.06] shadow-[0_0_50px_-18px_rgba(139,92,246,0.5)]"
                    : "border-white/10 bg-[#0b0b0b]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">
                    {t.name}
                  </h3>
                  <span
                    className={`rounded-sm px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                      t.featured
                        ? "bg-violet-400 text-black"
                        : "border border-white/15 text-neutral-400"
                    }`}
                  >
                    {t.tag}
                  </span>
                </div>

                <p className="mt-6 font-display text-4xl font-bold text-white">
                  {t.price}
                  <span className="ml-1 text-sm font-medium text-neutral-500">
                    {t.period}
                  </span>
                </p>

                <ul className="mt-7 flex-1 space-y-3">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-neutral-400">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-md px-5 py-3 text-center text-xs font-bold uppercase tracking-widest transition-all ${
                    t.featured
                      ? "bg-violet-400 text-black shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)] hover:bg-violet-300"
                      : "border border-white/15 text-white hover:border-violet-400/60 hover:text-violet-300"
                  }`}
                >
                  Get started
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
