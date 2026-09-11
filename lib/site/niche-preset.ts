import type { LegalAudience } from "@/lib/site/legal-content";

/** Map scraper / reply-agent preset ids to a legal/product audience. */
export function legalAudienceFromNichePreset(presetId: string): LegalAudience {
  const id = presetId.trim().toLowerCase();
  if (id.includes("comptable")) {
    return "comptable";
  }
  if (
    id.includes("gestion_patrimoine") ||
    id.includes("conseiller") ||
    id === "cif" ||
    id.startsWith("cif_")
  ) {
    return "cif";
  }
  return "agence";
}

export function isComptableNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "comptable";
}

export function isCifNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "cif";
}
