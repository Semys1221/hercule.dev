export const TEAM_IMAGE_PRESET = {
  /** Légèrement zoomée pour rogner les bords (souvent plus compressés) */
  imageClass:
    "object-cover scale-[1.04] brightness-[0.88] contrast-[0.94] saturate-[0.72]",
  /** Fusion avec le fond internal — discret, pas de couleur */
  overlayClass:
    "pointer-events-none absolute inset-0 bg-gradient-to-t from-background/75 via-background/20 to-background/10",
  /** Vignette latérale pour « poser » l'image dans le cadre */
  vignetteClass:
    "pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(9,9,11,0.45)]",
  /** Grain SVG/CSS ultra-léger — masque les bandes de compression */
  grainClass:
    "pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay",
  frameClass:
    "relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-card/20",
} as const;

/** Pattern 64×64 feTurbulence, répété en background-size 128px */
export const TEAM_IMAGE_GRAIN_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Variantes documentées (non actives) — remplacer TEAM_IMAGE_PRESET si besoin :
 *
 * softDocument — saturate 0.85, brightness 0.92, pas de grain :
 *   imageClass: "object-cover scale-[1.02] brightness-[0.92] contrast-[0.96] saturate-[0.85]"
 *   overlayClass: "pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-background/15 to-transparent"
 *
 * minimalGround — gradient seul, pas de filtres image :
 *   imageClass: "object-cover"
 *   overlayClass: "pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 to-transparent"
 */
