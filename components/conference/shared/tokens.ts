export const CONF_CANVAS = { w: 1280, h: 720 } as const;

/** Multiplicateur graphique — aligne icônes/px bruts avec le texte projection. */
export const CONF_GRAPHIC_SCALE = 1.55;

/** Plafond typo projection — pas de « big moment » vulgaire. */
export const CONF_FONT_MAX_PX = 32;

export function confPx(n: number): number {
  return Math.round(n * CONF_GRAPHIC_SCALE);
}

export function confFontPx(px: number): string {
  return `min(${px}px, ${CONF_FONT_MAX_PX}px)`;
}
