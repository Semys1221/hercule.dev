/**
 * Cabinet delivery outreach verticals (Instantly lists/campaigns).
 *
 * Marketing vertical = DEC (Expert-Comptable). Code/DB niche key = `comptable_delivery`.
 */

export const DEC_OPS_NICHE_ALIAS = "comptable_delivery" as const;

export type ComptableDeliveryVerticalKey =
  | "restaurant"
  | "btp"
  | "dentiste"
  | "medecin"
  | "kine"
  | "avocat"
  | "architecte"
  | "veterinaire";

export type ComptableDeliverySegment =
  | "restaurant"
  | "b2b"
  | "dentiste"
  | "medecin"
  | "kine"
  | "avocat"
  | "architecte"
  | "veterinaire";

export type ComptableDeliveryRouteSegment =
  | "restaurant"
  | "btp"
  | "chirurgien-dentiste";

export type ComptableDeliveryVertical = {
  key: ComptableDeliveryVerticalKey;
  label: string;
  segment: ComptableDeliverySegment;
  routeSegment: ComptableDeliveryRouteSegment;
  listId: string;
  campaignId: string;
  listName: string;
  campaignName: string;
  calendlySchedulingUrl: string;
};

export const COMPTABLE_DELIVERY_VERTICALS: readonly ComptableDeliveryVertical[] = [
  {
    key: "restaurant",
    label: "Restaurant",
    segment: "restaurant",
    routeSegment: "restaurant",
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
    routeSegment: "btp",
    listId: "ea5818ff-e086-4ed3-aee7-87b614fc7432",
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
    routeSegment: "chirurgien-dentiste",
    listId: "c4eb10d7-2285-4fc3-aa06-3230d2498d8e",
    campaignId: "0f0b450a-e550-461c-96f6-1a7681678d67",
    listName: "TEMP - DENTISTE",
    campaignName: "Hercule — Chirurgiens-dentistes (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-dentiste",
  },
  {
    key: "medecin",
    label: "Médecin généraliste",
    segment: "medecin",
    routeSegment: "restaurant",
    listId: "7e3b619f-9823-4d64-bc50-31f01bb08e6d",
    campaignId: "5c142a13-fcdf-4d6d-92e7-2afbc1865a5a",
    listName: "Hercule — Médecins généralistes (France)",
    campaignName: "Médecins (CIF)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-medecin",
  },
  {
    key: "kine",
    label: "Kinésithérapeute",
    segment: "kine",
    routeSegment: "restaurant",
    listId: "2a45b863-c705-4116-acec-31f49857bbbb",
    campaignId: "581b9357-753e-4c6e-aa99-d8b36fefca2d",
    listName: "Hercule — Kinésithérapeutes (France)",
    campaignName: "Hercule — Kinésithérapeutes (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-kinesitherapeute",
  },
  {
    key: "avocat",
    label: "Avocat",
    segment: "avocat",
    routeSegment: "restaurant",
    listId: "d4993823-d593-4839-8d67-48aa32782998",
    campaignId: "273473f0-b2f1-4462-a668-f0277f90d807",
    listName: "Hercule — Avocats (France)",
    campaignName: "Hercule — Avocats (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-avocat",
  },
  {
    key: "architecte",
    label: "Architecte DPLG",
    segment: "architecte",
    routeSegment: "restaurant",
    listId: "44b49536-aa48-4acd-9d3b-117e331d41f3",
    campaignId: "7ec0e211-9832-4baf-8803-e12ab93ee517",
    listName: "Hercule — Architectes DPLG (France)",
    campaignName: "Hercule — Architectes DPLG (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-architecte-dplg",
  },
  {
    key: "veterinaire",
    label: "Vétérinaire",
    segment: "veterinaire",
    routeSegment: "restaurant",
    listId: "29a1ca36-9964-4ee8-bc20-7a8c840af21d",
    campaignId: "7300a1ce-9e55-4bfa-92fd-d25361a22a59",
    listName: "Hercule — Vétérinaires (France)",
    campaignName: "Hercule — Vétérinaires (France)",
    calendlySchedulingUrl:
      "https://calendly.com/jum-advisory/rendez-vous-comptable-veterinaire",
  },
];

const VERTICAL_BY_KEY = new Map(
  COMPTABLE_DELIVERY_VERTICALS.map((row) => [row.key, row]),
);
const VERTICAL_BY_LIST_ID = new Map(
  COMPTABLE_DELIVERY_VERTICALS.filter((row) => row.listId).map((row) => [
    row.listId,
    row,
  ]),
);
const VERTICAL_BY_CAMPAIGN_ID = new Map(
  COMPTABLE_DELIVERY_VERTICALS.filter((row) => row.campaignId).map((row) => [
    row.campaignId,
    row,
  ]),
);

const ROUTE_BY_SEGMENT = new Map<ComptableDeliverySegment, ComptableDeliveryRouteSegment>(
  COMPTABLE_DELIVERY_VERTICALS.map((row) => [row.segment, row.routeSegment]),
);

export function getComptableDeliveryVertical(
  key: ComptableDeliveryVerticalKey,
): ComptableDeliveryVertical {
  const row = VERTICAL_BY_KEY.get(key);
  if (!row) {
    throw new Error(`Unknown comptable delivery vertical: ${key}`);
  }
  return row;
}

export function resolveComptableDeliveryVerticalByListId(
  listId: string,
): ComptableDeliveryVertical | null {
  return VERTICAL_BY_LIST_ID.get(listId.trim()) ?? null;
}

export function resolveComptableDeliveryVerticalByCampaignId(
  campaignId: string,
): ComptableDeliveryVertical | null {
  return VERTICAL_BY_CAMPAIGN_ID.get(campaignId.trim()) ?? null;
}

export function resolveComptableDeliveryVertical(input: {
  vertical?: string | null;
  listId?: string | null;
  campaignId?: string | null;
}): ComptableDeliveryVertical | null {
  const verticalKey = input.vertical?.trim().toLowerCase();
  if (
    verticalKey &&
    VERTICAL_BY_KEY.has(verticalKey as ComptableDeliveryVerticalKey)
  ) {
    return getComptableDeliveryVertical(verticalKey as ComptableDeliveryVerticalKey);
  }
  if (input.listId?.trim()) {
    const byList = resolveComptableDeliveryVerticalByListId(input.listId);
    if (byList) return byList;
  }
  if (input.campaignId?.trim()) {
    const byCampaign = resolveComptableDeliveryVerticalByCampaignId(
      input.campaignId,
    );
    if (byCampaign) return byCampaign;
  }
  return null;
}

export function defaultComptableDeliveryVertical(): ComptableDeliveryVertical {
  return COMPTABLE_DELIVERY_VERTICALS[0];
}

export function routeSegmentForComptableDeliverySegment(
  segment: string | null | undefined,
): ComptableDeliveryRouteSegment {
  const normalized = segment?.trim().toLowerCase();
  if (normalized === "b2b" || normalized === "btp" || normalized === "terrassement") {
    return "btp";
  }
  if (normalized === "dentiste") {
    return "chirurgien-dentiste";
  }
  if (normalized === "restaurant") {
    return "restaurant";
  }
  if (normalized && ROUTE_BY_SEGMENT.has(normalized as ComptableDeliverySegment)) {
    return ROUTE_BY_SEGMENT.get(normalized as ComptableDeliverySegment)!;
  }
  return "restaurant";
}

export function calendlyUrlForComptableDeliverySegment(
  segment: string | null | undefined,
): string {
  const normalized = segment?.trim().toLowerCase();
  if (normalized === "restaurant") {
    return getComptableDeliveryVertical("restaurant").calendlySchedulingUrl;
  }
  if (normalized === "dentiste") {
    return getComptableDeliveryVertical("dentiste").calendlySchedulingUrl;
  }
  if (normalized === "medecin" || normalized === "médecin") {
    return getComptableDeliveryVertical("medecin").calendlySchedulingUrl;
  }
  if (normalized === "kine" || normalized === "kiné" || normalized === "kinesitherapeute") {
    return getComptableDeliveryVertical("kine").calendlySchedulingUrl;
  }
  if (normalized === "avocat") {
    return getComptableDeliveryVertical("avocat").calendlySchedulingUrl;
  }
  if (normalized === "architecte") {
    return getComptableDeliveryVertical("architecte").calendlySchedulingUrl;
  }
  if (normalized === "veterinaire" || normalized === "vétérinaire") {
    return getComptableDeliveryVertical("veterinaire").calendlySchedulingUrl;
  }
  if (normalized === "b2b" || normalized === "btp" || normalized === "terrassement") {
    return getComptableDeliveryVertical("btp").calendlySchedulingUrl;
  }
  return defaultComptableDeliveryVertical().calendlySchedulingUrl;
}
