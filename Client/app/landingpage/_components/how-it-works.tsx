import { STEPS } from "../_lib/constants";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** Booking flow — three numbered steps on a connected track. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-white/5 bg-[#070707] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="// From signup to start"
          title="Three steps."
          accent="Zero queues."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 120}>
              <div className="relative h-full border border-white/10 bg-[#0b0b0b] p-7">
                <p className="font-display text-5xl font-bold text-violet-400/20">
                  {s.step}
                </p>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  {s.description}
                </p>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-5 top-7 hidden font-display text-violet-400/50 md:block"
                  >
                    →
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
