/**
 * Purely decorative header art — the neon controller PNG blended into the
 * dark theme with a soft radial glow, circuit trails, and pixel accents.
 * Absolutely positioned, non-interactive, hidden below md.
 */
export function GamesHeaderArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-36 hidden w-[560px] select-none overflow-hidden md:block"
    >
      {/* ambient glow behind the controller */}
      <div className="absolute right-10 top-1/2 h-56 w-80 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />

      {/* circuit trails sweeping toward the controller */}
      <svg
        viewBox="0 0 560 160"
        fill="none"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gh-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="70%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="gh-line-hi" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <path
          d="M0 30 C 110 30, 180 62, 300 66"
          stroke="url(#gh-line)"
          strokeWidth="1"
        />
        <path
          d="M0 132 C 120 132, 190 102, 305 92"
          stroke="url(#gh-line)"
          strokeWidth="1"
        />
        <path
          d="M0 80 C 140 80, 200 79, 298 79"
          stroke="url(#gh-line-hi)"
          strokeWidth="0.75"
        />
        <path
          d="M40 152 C 150 148, 230 118, 315 100"
          stroke="url(#gh-line)"
          strokeWidth="0.75"
          strokeOpacity="0.6"
        />

        {/* trail end nodes */}
        <circle cx="300" cy="66" r="2" fill="#a855f7" fillOpacity="0.55" />
        <circle cx="305" cy="92" r="2" fill="#a855f7" fillOpacity="0.55" />
        <circle cx="298" cy="79" r="1.6" fill="#818cf8" fillOpacity="0.5" />
      </svg>

      {/* scattered pixel accents */}
      <div className="absolute left-[42%] top-[22%] h-1.5 w-1.5 rounded-[1px] bg-primary/50" />
      <div className="absolute left-[30%] top-[68%] h-1 w-1 rounded-[1px] bg-indigo-400/40" />
      <div className="absolute left-[55%] top-[80%] h-1.5 w-1.5 rounded-[1px] bg-primary/35" />
      <div className="absolute left-[70%] top-[12%] h-1 w-1 rounded-[1px] bg-indigo-300/40" />

      {/* controller */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/joystick.png"
        alt=""
        className="absolute -right-6 top-1/2 h-[170%] -translate-y-1/2 object-contain opacity-90 mix-blend-screen"
        style={{
          maskImage:
            "radial-gradient(ellipse 55% 52% at 62% 50%, black 38%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 52% at 62% 50%, black 38%, transparent 82%)",
        }}
      />
    </div>
  );
}
