import { Crosshair, Signal, Timer, Zap } from "lucide-react";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const TILES = [
  { icon: Zap, label: "Neon-lit zones", detail: "Mood lighting per arena" },
  { icon: Crosshair, label: "Pro equipment", detail: "Tournament-grade gear" },
  { icon: Timer, label: "Timed sessions", detail: "Auto-start & overrun alerts" },
  { icon: Signal, label: "Live scoreboards", detail: "Synced across every screen" },
];

/** Arena vibe — HUD tiles standing in for real venue shots. */
export function ArenaSection() {
  return (
    <section id="arena" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="// Inside the arena"
          title="The floor"
          accent="is live."
          description="Every zone is wired — live status, instant check-in, arena-grade equipment on every table."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((t, i) => (
            <Reveal key={t.label} delay={(i % 4) * 80}>
              <div className="group relative h-52 overflow-hidden border border-white/10 bg-[#0b0b0b] p-6 transition-colors hover:border-violet-400/50">
                {/* Diagonal stripe tint */}
                <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0_12px,rgba(139,92,246,0.03)_12px_24px)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between">
                  <t.icon className="h-5 w-5 text-violet-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
                    {t.label}
                  </h3>
                  <p className="mt-1.5 text-xs text-neutral-500">{t.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
