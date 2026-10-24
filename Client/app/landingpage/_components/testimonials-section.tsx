"use client";

import { useMemo } from "react";
import { MessageSquareQuote, Sparkles, Star } from "lucide-react";
import { useHeroTestimonials } from "@/app/(mainapp)/testimonials/_hooks/use-testimonials";
import type { Testimonial } from "@/api/testimonials.api";
import { SectionHeading } from "./section-heading";

const CORNER = "pointer-events-none absolute h-3.5 w-3.5 border-violet-400/70";

function TestimonialMarqueeCard({ item }: { item: Testimonial }) {
  return (
    <div className="group relative flex flex-col justify-between w-[320px] sm:w-[380px] shrink-0 border border-white/10 bg-[#0d0d0d]/90 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:border-violet-400 hover:bg-[#121019] hover:shadow-[0_0_35px_-5px_rgba(139,92,246,0.45)] hover:-translate-y-1">
      {/* Cyber HUD corners */}
      <span aria-hidden className={`${CORNER} -left-px -top-px border-l-2 border-t-2`} />
      <span aria-hidden className={`${CORNER} -right-px -top-px border-r-2 border-t-2`} />
      <span aria-hidden className={`${CORNER} -bottom-px -left-px border-b-2 border-l-2`} />
      <span aria-hidden className={`${CORNER} -bottom-px -right-px border-b-2 border-r-2`} />

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= item.rating
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                    : "fill-neutral-800 text-neutral-800"
                }`}
              />
            ))}
          </div>
          <span className="flex items-center gap-1 rounded border border-violet-400/40 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-300">
            <Sparkles className="h-2.5 w-2.5 text-amber-300" />
            Hero Pick
          </span>
        </div>

        {item.headline && (
          <h4 className="mt-3.5 font-display text-sm sm:text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
            &ldquo;{item.headline}&rdquo;
          </h4>
        )}

        <p className="mt-2.5 text-xs leading-relaxed text-neutral-400 line-clamp-3">
          &ldquo;{item.content}&rdquo;
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-violet-600/30 border border-violet-400/50 text-violet-300 font-bold flex items-center justify-center text-xs uppercase">
          {item.user?.name?.slice(0, 2) || "PL"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {item.user?.name || "Verified Gamer"}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
            Arena Player
          </p>
        </div>
        <MessageSquareQuote className="h-4 w-4 text-violet-400/40 group-hover:text-violet-400 transition-colors shrink-0" />
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { data: testimonials, isPending } = useHeroTestimonials();

  const sourceItems = useMemo(() => {
    return Array.isArray(testimonials) ? testimonials : [];
  }, [testimonials]);

  // Duplicate items to ensure a seamless infinite marquee loop
  const loopRow1 = useMemo(() => {
    if (sourceItems.length === 0) return [];
    const list = [...sourceItems];
    while (list.length < 8) {
      list.push(...sourceItems);
    }
    return [...list, ...list];
  }, [sourceItems]);

  if (!isPending && sourceItems.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="relative py-24 overflow-hidden bg-black">
      {/* Ambient lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-violet-400/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mb-10">
          <SectionHeading
            eyebrow="// Live player feed"
            title="The Squad"
            accent="Speaks."
            description="Real feedback from tournament regulars, casual gamers, and weekend squads. Placed on hero by arena management."
          />
        </div>
      </div>

      {/* Marquee Runway with Left & Right Gradient Shadows */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right fade masks */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-r from-black via-black/80 to-transparent z-20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-l from-black via-black/80 to-transparent z-20"
        />

        {/* Single Track — Moving Left */}
        <div className="flex w-max animate-marquee gap-5 sm:gap-6 pl-4">
          {loopRow1.map((item, idx) => (
            <TestimonialMarqueeCard key={`row1-${item.id}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
