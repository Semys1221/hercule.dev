import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { DemandeNiche, DemandeStatus } from "@/lib/demandes-data";

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
  status: DemandeStatus | null;
  available_from: string | null;
  available_until: string | null;
  titre: string | null;
  description: string | null;
  note: string | null;
  sort_order: number;
}

const DEMANDE_ALLOWED_FIELDS = new Set([
  "niche",
  "secteur",
  "prestation",
  "budget",
  "taille",
  "zone",
  "disponibilite",
  "origine",
  "status",
  "available_from",
  "available_until",
]);

const TEASER_ALLOWED_FIELDS = new Set(["secteur", "titre", "description", "note"]);

export async function listAllDemandesCards(): Promise<AgenceDemandeRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to list demandes: ${error.message}`);
  }

  return (data ?? []) as AgenceDemandeRow[];
}

export async function getDemandeCard(
  externalId: string,
): Promise<AgenceDemandeRow | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch demande: ${error.message}`);
  }

  return (data as AgenceDemandeRow | null) ?? null;
}

function pickAllowedFields(
  fields: Record<string, unknown>,
  allowed: Set<string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (allowed.has(key)) {
      payload[key] = value;
    }
  }
  return payload;
}

export async function updateDemandeCard(
  externalId: string,
  fields: Record<string, unknown>,
): Promise<AgenceDemandeRow> {
  const existing = await getDemandeCard(externalId);
  if (!existing) {
    throw new Error("Card not found");
  }

  const allowed =
    existing.record_type === "demande" ? DEMANDE_ALLOWED_FIELDS : TEASER_ALLOWED_FIELDS;
  const payload = pickAllowedFields(fields, allowed);
  if (Object.keys(payload).length === 0) {
    throw new Error("No valid fields to update");
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence_demandes")
    .update(payload)
    .eq("external_id", externalId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update demande: ${error.message}`);
  }

  return data as AgenceDemandeRow;
}
