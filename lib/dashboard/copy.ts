import { COMMERCIAL } from "@/lib/commercial/constants";

export const DASHBOARD_EYEBROW = "Votre suivi :";
export const DASHBOARD_SCREEN_SHARE_PROMPT = "Partagez votre écran.";
export const DASHBOARD_STARTER_SUBTITLE = "Suivi de vos contrats PME sécurisés";
export const DASHBOARD_POST_PAYMENT_FAQ_LABEL = "Questions fréquentes — service actif";
export const DASHBOARD_RETRACTION_BADGE_PENDING = "Rétractation en cours";
export const DASHBOARD_RETRACTION_BADGE_ACTIVE = "Service actif";

export function dashboardPageTitle(slug: string): string {
  return `Suivi ${slug}`;
}

export function dashboardDocumentTitle(slug: string): string {
  return `${dashboardPageTitle(slug)} · Hercule`;
}

export function formatContratProgress(used: number, total: number): string {
  const safeTotal = total > 0 ? total : COMMERCIAL.starter998Attributions;
  const safeUsed = Math.max(0, Math.min(used, safeTotal));
  return `${safeUsed}/${safeTotal} contrats`;
}

/** @deprecated Use formatContratProgress */
export function formatStarterProgress(used: number, total: number): string {
  return formatContratProgress(used, total);
}
