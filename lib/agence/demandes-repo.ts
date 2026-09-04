import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type {
  DemandeContrat,
  DemandeNiche,
  DemandeStatus,
  DemandeTeaser,
} from "@/lib/demandes-data";

interface AgenceDemandeRow {
  external_id: string;
  record_type: "demande" | "teaser";
  niche: DemandeNiche;
  secteur: string;
  prestation: string | null;
  budget: string | null;
  taille: string | null;
  zone: string | null;
  disponibilite: string | null;
  status: DemandeStatus | null;
  available_from: string | null;
  available_until: string | null;
  titre: string | null;
  description: string | null;
  note: string | null;
  sort_order: number;
}

function mapDemandeRow(row: AgenceDemandeRow): DemandeContrat {
  return {
    id: row.external_id,
    niche: row.niche,
    secteur: row.secteur,
    availableFrom: row.available_from ?? "",
    availableUntil: row.available_until ?? "",
    prestation: row.prestation ?? "",
    budget: row.budget ?? "",
    taille: row.taille ?? "",
    zone: row.zone ?? "",
    disponibilite: row.disponibilite ?? "",
    status: row.status ?? "available",
    masked: true,
  };
}

function mapTeaserRow(row: AgenceDemandeRow): DemandeTeaser {
  return {
    id: row.external_id,
    niche: "a-venir",
    secteur: row.secteur,
    titre: row.titre ?? "",
    description: row.description ?? "",
    note: row.note ?? "",
  };
}

export async function fetchDemandesForCarousel(): Promise<DemandeContrat[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .eq("record_type", "demande")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch demandes: ${error.message}`);
  }

  return (data as AgenceDemandeRow[]).map(mapDemandeRow);
}

export async function fetchDemandeTeaser(): Promise<DemandeTeaser | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .eq("record_type", "teaser")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch demande teaser: ${error.message}`);
  }

  if (!data) return null;
  return mapTeaserRow(data as AgenceDemandeRow);
}

export async function countAvailableDemandes(): Promise<number> {
  const client = createLinkTrackingClient();
  const { count, error } = await client
    .from("agence_demandes")
    .select("*", { count: "exact", head: true })
    .eq("record_type", "demande")
    .eq("status", "available");

  if (error) {
    throw new Error(`Failed to count available demandes: ${error.message}`);
  }

  return count ?? 0;
}
