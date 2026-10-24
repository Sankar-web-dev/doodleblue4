import { GAMES } from "../_lib/constants";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** Games grid — every zone in the arena, HUD-framed cards. */
export function GamesSection() {
  return (
    <section id="games" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="// Choose your zone"
          title="Every game."
          accent="One arena."
          description="Eight zones running around the clock — from slow-burn strategy to button-mashing chaos."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((g, i) => (
            <Reveal key={g.name} delay={(i % 4) * 80}>
              <div className="group relative h-full border border-white/10 bg-[#0b0b0b] p-6 transition-colors duration-300 hover:border-violet-400/50 hover:bg-[#0e0e0e]">
                <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-violet-400/0 transition-colors duration-300 group-hover:border-violet-400/80" />
                <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-violet-400/0 transition-colors duration-300 group-hover:border-violet-400/80" />
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet-400/30 bg-violet-400/10">
                  <g.icon className="h-4.5 w-4.5 text-violet-300" />
                </div>
                <h3 className="mt-5 font-display text-base font-bold uppercase tracking-wide text-white">
                  {g.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {g.blurb}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
