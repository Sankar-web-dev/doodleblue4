interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
}

/** Shared eyebrow + big display title used at the top of each section. */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-14 max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400">
          {eyebrow}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-violet-400/40 to-transparent" />
      </div>
      <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
        {title} {accent && <span className="text-violet-400">{accent}</span>}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          {description}
        </p>
      )}
    </div>
  );
}
