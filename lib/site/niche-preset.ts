import type { LegalAudience } from "@/lib/site/legal-content";

/** Map scraper / reply-agent preset ids to a legal/product audience. */
export function legalAudienceFromNichePreset(presetId: string): LegalAudience {
  const id = presetId.trim().toLowerCase();
  if (id.includes("comptable")) {
    return "comptable";
  }
  if (
    id.includes("prevoyance") ||
    id.includes("courtiers") ||
    id.includes("courtier") ||
    id === "ias" ||
    id.startsWith("ias_")
  ) {
    return "assurance";
  }
  if (
    id.includes("gestion_patrimoine") ||
    id.includes("conseiller") ||
    id === "cif" ||
    id.startsWith("cif_")
  ) {
    return "cif";
  }
  if (
    id.includes("jum") ||
    id.includes("restaurant") ||
    id.includes("terrassement") ||
    id.includes("dentiste") ||
    id.includes("medecin") ||
    id.includes("kine") ||
    id.includes("avocat") ||
    id.includes("architecte") ||
    id.includes("veterinaire")
  ) {
    return "jum";
  }
  return "agence";
}

export function isComptableNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "comptable";
}

export function isCifNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "cif";
}

export function isAssuranceNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "assurance";
}

export function isJumNichePreset(presetId: string): boolean {
  return legalAudienceFromNichePreset(presetId) === "jum";
}
