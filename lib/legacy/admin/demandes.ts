import type { DemandeNiche, DemandeStatus } from "@/lib/site/demandes-data";

export interface AgenceDemandeRow {
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

export async function listAllDemandesCards(): Promise<AgenceDemandeRow[]> {
  return [];
}

export async function getDemandeCard(
  _externalId: string,
): Promise<AgenceDemandeRow | null> {
  return null;
}

export async function updateDemandeCard(
  externalId: string,
  _fields: Record<string, unknown>,
): Promise<AgenceDemandeRow> {
  void externalId;
  throw new Error("agence_demandes table removed — carousel disabled");
}
