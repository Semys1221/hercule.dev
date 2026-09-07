import { COMMERCIAL } from "@/lib/commercial/constants";

export const DASHBOARD_EYEBROW = "Votre suivi :";
export const DASHBOARD_SCREEN_SHARE_PROMPT = "Partagez votre écran.";
export const DASHBOARD_STARTER_SUBTITLE = "Formule Starter — suivi de vos attributions";
export const DASHBOARD_POST_PAYMENT_FAQ_LABEL = "Questions fréquentes — service actif";

export function dashboardPageTitle(slug: string): string {
  return `Suivi ${slug}`;
}

export function dashboardDocumentTitle(slug: string): string {
  return `${dashboardPageTitle(slug)} · Hercule`;
}

export function formatStarterProgress(used: number, total: number): string {
  const safeTotal = total > 0 ? total : COMMERCIAL.starterAttributions;
  const safeUsed = Math.max(0, Math.min(used, safeTotal));
  return `${safeUsed}/${safeTotal} rendez-vous`;
}
