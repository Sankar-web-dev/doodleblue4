import type { ReactNode } from "react";
import { Layers, type LucideIcon } from "lucide-react";

export interface AuthFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthBrandPanelProps {
  /** Headline rendered as the large display heading. */
  headline: ReactNode;
  subtitle: string;
  features: AuthFeature[];
  footer?: string;
}

/** Left brand panel shared by the login & signup screens (large screens only). */
export function AuthBrandPanel({
  headline,
  subtitle,
  features,
  footer = "DoodleBlue Admin Console",
}: AuthBrandPanelProps) {
  return (
    <aside className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-[oklch(0.16_0.02_262)] p-12 text-white">
      {/* Decorations */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="animate-drift pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.62_0.19_262/0.25)] blur-3xl" />
      <div className="animate-drift pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[oklch(0.70_0.13_215/0.15)] blur-3xl [animation-delay:-6s]" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.60_0.19_262)] text-white shadow-[0_0_24px_-4px] shadow-[oklch(0.60_0.19_262/0.6)]">
          <Layers className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">
          DoodleBlue
        </span>
      </div>

      <div className="relative max-w-md space-y-8">
        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
          {headline}
        </h1>
        <p className="text-sm leading-relaxed text-white/55">{subtitle}</p>

        <ul className="space-y-5">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <f.icon className="h-4 w-4 text-[oklch(0.78_0.13_262)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs leading-relaxed text-white/50">
                  {f.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/35">{footer}</p>
    </aside>
  );
}
