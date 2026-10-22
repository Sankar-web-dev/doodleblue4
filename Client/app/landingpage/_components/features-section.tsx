import { FEATURES } from "../_lib/constants";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** Why members stay — the three pillars from the auth screens. */
export function FeaturesSection() {
  return (
    <section className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="// Built for regulars"
          title="Perks that"
          accent="stack up."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="h-full border border-white/10 bg-[#0b0b0b] p-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-500/70">
                  Perk {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  {f.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
