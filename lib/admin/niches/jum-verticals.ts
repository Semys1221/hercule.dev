export type JumVerticalKey = "restaurant" | "btp" | "dentiste";

export type JumSegment = "restaurant" | "b2b" | "dentiste";

export type JumVertical = {
  key: JumVerticalKey;
  label: string;
  segment: JumSegment;
  listId: string;
  campaignId: string;
  listName: string;
  campaignName: string;
  calendlySchedulingUrl: string;
};

/** Instantly list + campaign pairs for JUM outreach (one vertical per campaign). */
export const JUM_VERTICALS: readonly JumVertical[] = [
  {
    key: "restaurant",
    label: "Restaurant",
    segment: "restaurant",
    listId: "8ad641e7-3456-42df-9281-2c11f97df1c5",
    campaignId: "e4f11e76-717e-4be9-a6ad-c7f0a331afb7",
    listName: "TEMP - RESTAURANT",
    campaignName: "Hercule — Restaurants indépendants (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-restaurant",
  },
  {
    key: "btp",
    label: "Terrassement / BTP",
    segment: "b2b",
    listId: "ef52cbe1-e6cb-4076-85bc-55ead03cb4bd",
    campaignId: "05bc06f8-4f60-4e6c-bae1-7afe30df38c7",
    listName: "TEMP - TERRASSEMENT",
    campaignName: "Hercule — Terrassement / VRD (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-btp",
  },
  {
    key: "dentiste",
    label: "Dentiste",
    segment: "dentiste",
    listId: "c4eb10d7-2285-4fc3-aa06-3230d2498d8e",
    campaignId: "0f0b450a-e550-461c-96f6-1a7681678d67",
    listName: "TEMP - DENTISTE",
    campaignName: "Hercule — Chirurgiens-dentistes (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-dentiste",
  },
];

const VERTICAL_BY_KEY = new Map(JUM_VERTICALS.map((row) => [row.key, row]));
const VERTICAL_BY_LIST_ID = new Map(JUM_VERTICALS.map((row) => [row.listId, row]));
const VERTICAL_BY_CAMPAIGN_ID = new Map(JUM_VERTICALS.map((row) => [row.campaignId, row]));

export function getJumVertical(key: JumVerticalKey): JumVertical {
  const row = VERTICAL_BY_KEY.get(key);
  if (!row) {
    throw new Error(`Unknown JUM vertical: ${key}`);
  }
  return row;
}

export function resolveJumVerticalByListId(listId: string): JumVertical | null {
  return VERTICAL_BY_LIST_ID.get(listId.trim()) ?? null;
}

export function resolveJumVerticalByCampaignId(campaignId: string): JumVertical | null {
  return VERTICAL_BY_CAMPAIGN_ID.get(campaignId.trim()) ?? null;
}

export function resolveJumVertical(
  input: { vertical?: string | null; listId?: string | null; campaignId?: string | null },
): JumVertical | null {
  const verticalKey = input.vertical?.trim().toLowerCase();
  if (verticalKey && VERTICAL_BY_KEY.has(verticalKey as JumVerticalKey)) {
    return getJumVertical(verticalKey as JumVerticalKey);
  }
  if (input.listId?.trim()) {
    const byList = resolveJumVerticalByListId(input.listId);
    if (byList) return byList;
  }
  if (input.campaignId?.trim()) {
    const byCampaign = resolveJumVerticalByCampaignId(input.campaignId);
    if (byCampaign) return byCampaign;
  }
  return null;
}

/** Primary JUM campaign for niche_outreach_config / reply-agent fallback. */
export function defaultJumVertical(): JumVertical {
  return JUM_VERTICALS[0];
}

export function calendlyUrlForJumSegment(segment: string | null | undefined): string {
  const normalized = segment?.trim().toLowerCase();
  if (normalized === "restaurant") {
    return getJumVertical("restaurant").calendlySchedulingUrl;
  }
  if (normalized === "dentiste") {
    return getJumVertical("dentiste").calendlySchedulingUrl;
  }
  if (normalized === "b2b" || normalized === "btp" || normalized === "terrassement") {
    return getJumVertical("btp").calendlySchedulingUrl;
  }
  return defaultJumVertical().calendlySchedulingUrl;
}
