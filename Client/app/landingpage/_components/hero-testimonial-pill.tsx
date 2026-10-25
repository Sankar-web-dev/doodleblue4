"use client";

import { useEffect, useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { useHeroTestimonials } from "@/app/(mainapp)/testimonials/_hooks/use-testimonials";

export function HeroTestimonialPill() {
  const { data: testimonials } = useHeroTestimonials();
  const [currentIndex, setCurrentIndex] = useState(0);

  const items = Array.isArray(testimonials) && testimonials.length > 0 ? testimonials : null;

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [items]);

  if (!items) return null;

  const current = items[currentIndex];

  return (
    <div className="relative mt-8 group">
      <div className="relative inline-flex items-center gap-3.5 rounded-full border border-violet-500/40 bg-violet-950/40 px-4 py-2 text-xs backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(139,92,246,0.35)] transition-all hover:border-violet-400">
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-[11px]">{current.rating}.0</span>
        </div>

        <span className="h-3 w-px bg-white/20" />

        <div className="flex items-center gap-2 max-w-xs sm:max-w-md truncate">
          <span className="font-semibold text-white truncate">
            {current.headline ? `"${current.headline}"` : current.content}
          </span>
          <span className="text-[10px] text-neutral-400 shrink-0">
            — {current.user.name}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300 shrink-0">
          <Sparkles className="h-2.5 w-2.5 text-amber-300" />
          Hero Pick
        </span>
      </div>
    </div>
  );
}
