"use client";

export function FilmGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ opacity: 0.018, mixBlendMode: "multiply" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <filter id="conf-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          >
            <animate
              attributeName="seed"
              values="0;500"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </feTurbulence>
        </filter>
        <rect width="100%" height="100%" filter="url(#conf-grain)" />
      </svg>
    </div>
  );
}
