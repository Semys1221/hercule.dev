import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type {
  DemandeContrat,
  DemandeNiche,
  DemandeStatus,
  DemandeTeaser,
} from "@/lib/site/demandes-data";
import { withMarketingFetchFallback } from "@/lib/site/marketing/resilient-fetch";

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

export function mapDemandeRow(row: AgenceDemandeRow): DemandeContrat {
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

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadDemandesForCarousel(): Promise<DemandeContrat[]> {
  const client = createLinkTrackingClient();
  const today = todayIsoDate();
  // #region agent log
  const fetchStartedAt = Date.now();
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "51039f" },
    body: JSON.stringify({
      sessionId: "51039f",
      runId: "post-fix",
      hypothesisId: "H2-H4",
      location: "demandes-repo.ts:fetchDemandesForCarousel:start",
      message: "Agence carousel fetch starting",
      data: { today, table: "agence_demandes" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .eq("record_type", "demande")
    .lte("sort_order", 16)
    .lte("available_from", today)
    .gte("available_until", today)
    .order("sort_order", { ascending: true });

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "51039f" },
    body: JSON.stringify({
      sessionId: "51039f",
      runId: "post-fix",
      hypothesisId: "H1-H3-H5",
      location: "demandes-repo.ts:fetchDemandesForCarousel:end",
      message: "Agence carousel fetch finished",
      data: {
        today,
        durationMs: Date.now() - fetchStartedAt,
        rowCount: data?.length ?? 0,
        error: error?.message ?? null,
        errorCode: error?.code ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (error) {
    throw new Error(`Failed to fetch demandes: ${error.message}`);
  }

  return (data as AgenceDemandeRow[]).map(mapDemandeRow);
}

export async function fetchDemandesForCarousel(): Promise<DemandeContrat[]> {
  return withMarketingFetchFallback(
    "agence carousel demandes",
    loadDemandesForCarousel,
    [],
  );
}

async function loadDemandeTeaser(): Promise<DemandeTeaser | null> {
  const client = createLinkTrackingClient();
  // #region agent log
  const teaserStartedAt = Date.now();
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "51039f" },
    body: JSON.stringify({
      sessionId: "51039f",
      runId: "post-fix",
      hypothesisId: "H3",
      location: "demandes-repo.ts:fetchDemandeTeaser:start",
      message: "Agence teaser fetch starting",
      data: { table: "agence_demandes" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const { data, error } = await client
    .from("agence_demandes")
    .select("*")
    .eq("record_type", "teaser")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "51039f" },
    body: JSON.stringify({
      sessionId: "51039f",
      runId: "post-fix",
      hypothesisId: "H1-H3-H5",
      location: "demandes-repo.ts:fetchDemandeTeaser:end",
      message: "Agence teaser fetch finished",
      data: {
        durationMs: Date.now() - teaserStartedAt,
        hasData: Boolean(data),
        error: error?.message ?? null,
        errorCode: error?.code ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (error) {
    throw new Error(`Failed to fetch demande teaser: ${error.message}`);
  }

  if (!data) return null;
  return mapTeaserRow(data as AgenceDemandeRow);
}

export async function fetchDemandeTeaser(): Promise<DemandeTeaser | null> {
  return withMarketingFetchFallback(
    "agence demande teaser",
    loadDemandeTeaser,
    null,
  );
}
