import type {
  DemandeContrat,
  DemandeNiche,
  DemandeStatus,
  DemandeTeaser,
} from "@/lib/site/demandes-data";
import { withMarketingFetchFallback } from "@/lib/site/marketing/resilient-fetch";

interface ComptableDemandeRow {
  external_id: string;
  record_type: "demande" | "teaser";
  niche: DemandeNiche;
  secteur: string;
  prestation: string | null;
  budget: string | null;
  taille: string | null;
  zone: string | null;
  disponibilite: string | null;
  origine: string | null;
  duree_souhaitee: string | null;
  horizon_resultat: string | null;
  historique_agences: string | null;
  status: DemandeStatus | null;
  available_from: string | null;
  available_until: string | null;
  titre: string | null;
  description: string | null;
  note: string | null;
  sort_order: number;
}

export function mapComptableDemandeRow(row: ComptableDemandeRow): DemandeContrat {
  return {
    id: row.external_id,
    niche: row.niche,
    secteur: row.secteur,
    availableFrom: row.available_from ?? "",
    availableUntil: row.available_until ?? "",
    prestation: row.prestation ?? "",
    budget: row.budget ?? "",
    taille: row.taille ?? "",
    dureeSouhaitee: row.duree_souhaitee ?? "",
    horizonResultat: row.horizon_resultat ?? "",
    historiqueAgences: row.historique_agences ?? "",
    zone: row.zone ?? "",
    disponibilite: row.disponibilite ?? "",
    origine: row.origine ?? "",
    status: row.status ?? "available",
    masked: true,
  };
}

function mapTeaserRow(row: ComptableDemandeRow): DemandeTeaser {
  return {
    id: row.external_id,
    niche: "a-venir",
    secteur: row.secteur,
    titre: row.titre ?? "",
    description: row.description ?? "",
    note: row.note ?? "",
  };
}

async function loadComptableDemandesForCarousel(): Promise<DemandeContrat[]> {
  return [];
}

export async function fetchComptableDemandesForCarousel(): Promise<DemandeContrat[]> {
  return withMarketingFetchFallback(
    "comptable carousel demandes",
    loadComptableDemandesForCarousel,
    [],
  );
}

async function loadComptableDemandeTeaser(): Promise<DemandeTeaser | null> {
  return null;
}

export async function fetchComptableDemandeTeaser(): Promise<DemandeTeaser | null> {
  return withMarketingFetchFallback(
    "comptable demande teaser",
    loadComptableDemandeTeaser,
    null,
  );
}
