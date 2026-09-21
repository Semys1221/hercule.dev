import { cn } from "@/lib/utils";

type GeometricBananaProps = {
  className?: string;
};

/**
 * Low-poly banana silhouette drawn with white line segments.
 */
export function GeometricBanana({ className }: GeometricBananaProps) {
  return (
    <svg
      viewBox="0 0 200 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-auto w-full max-w-[180px]", className)}
    >
      {/* stem */}
      <line x1="118" y1="18" x2="128" y2="52" stroke="currentColor" strokeWidth="2" />
      <line x1="128" y1="52" x2="108" y2="58" stroke="currentColor" strokeWidth="2" />
      <line x1="108" y1="58" x2="118" y2="18" stroke="currentColor" strokeWidth="2" />

      {/* outer hull */}
      <polyline
        points="108,58 72,92 48,148 42,210 58,268 96,298 142,286 168,236 176,168 158,108 128,58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* facet grid */}
      <line x1="108" y1="58" x2="72" y2="92" stroke="currentColor" strokeWidth="1.5" />
      <line x1="72" y1="92" x2="48" y2="148" stroke="currentColor" strokeWidth="1.5" />
      <line x1="48" y1="148" x2="42" y2="210" stroke="currentColor" strokeWidth="1.5" />
      <line x1="42" y1="210" x2="58" y2="268" stroke="currentColor" strokeWidth="1.5" />
      <line x1="58" y1="268" x2="96" y2="298" stroke="currentColor" strokeWidth="1.5" />
      <line x1="96" y1="298" x2="142" y2="286" stroke="currentColor" strokeWidth="1.5" />
      <line x1="142" y1="286" x2="168" y2="236" stroke="currentColor" strokeWidth="1.5" />
      <line x1="168" y1="236" x2="176" y2="168" stroke="currentColor" strokeWidth="1.5" />
      <line x1="176" y1="168" x2="158" y2="108" stroke="currentColor" strokeWidth="1.5" />
      <line x1="158" y1="108" x2="128" y2="58" stroke="currentColor" strokeWidth="1.5" />

      {/* inner facets */}
      <line x1="90" y1="74" x2="62" y2="132" stroke="currentColor" strokeWidth="1.5" />
      <line x1="62" y1="132" x2="56" y2="198" stroke="currentColor" strokeWidth="1.5" />
      <line x1="56" y1="198" x2="74" y2="256" stroke="currentColor" strokeWidth="1.5" />
      <line x1="74" y1="256" x2="118" y2="276" stroke="currentColor" strokeWidth="1.5" />
      <line x1="118" y1="276" x2="152" y2="248" stroke="currentColor" strokeWidth="1.5" />
      <line x1="152" y1="248" x2="162" y2="186" stroke="currentColor" strokeWidth="1.5" />
      <line x1="162" y1="186" x2="142" y2="124" stroke="currentColor" strokeWidth="1.5" />
      <line x1="142" y1="124" x2="108" y2="58" stroke="currentColor" strokeWidth="1.5" />

      {/* cross braces */}
      <line x1="72" y1="92" x2="142" y2="124" stroke="currentColor" strokeWidth="1.5" />
      <line x1="48" y1="148" x2="162" y2="186" stroke="currentColor" strokeWidth="1.5" />
      <line x1="58" y1="268" x2="152" y2="248" stroke="currentColor" strokeWidth="1.5" />
      <line x1="96" y1="298" x2="118" y2="276" stroke="currentColor" strokeWidth="1.5" />
      <line x1="90" y1="74" x2="158" y2="108" stroke="currentColor" strokeWidth="1.5" />
      <line x1="62" y1="132" x2="176" y2="168" stroke="currentColor" strokeWidth="1.5" />
      <line x1="56" y1="198" x2="168" y2="236" stroke="currentColor" strokeWidth="1.5" />
      <line x1="74" y1="256" x2="142" y2="286" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
