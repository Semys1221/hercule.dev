import {
  createLinkTrackingClient,
  findLeadByEmail,
} from "@/lib/link-tracking/supabase";

import type { AiReplyTargetType } from "./types";

const FALLBACK_BUYER = "https://www.hercule.dev/reservation.html";
const FALLBACK_SELLER = "https://www.hercule.dev/reservation-entreprise.html";

type CtaColumn = "reservation_agence_link" | "reservation_entreprise_link";

export function ctaLinkColumn(targetType: AiReplyTargetType): CtaColumn {
  return targetType === "buyer"
    ? "reservation_agence_link"
    : "reservation_entreprise_link";
}

export function fallbackCtaLink(targetType: AiReplyTargetType): string {
  return targetType === "buyer" ? FALLBACK_BUYER : FALLBACK_SELLER;
}

export async function resolveLeadCtaLink(
  leadEmail: string,
  targetType: AiReplyTargetType,
): Promise<string> {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, leadEmail);
  const column = ctaLinkColumn(targetType);
  if (lookup?.lead) {
    const value = lookup.lead[column]?.trim();
    if (value) return value;
  }
  return fallbackCtaLink(targetType);
}

export function applyPromptLinkVariables(
  prompt: string,
  ctaLink: string,
  targetType: AiReplyTargetType,
): string {
  const agenceLink =
    targetType === "buyer" ? ctaLink : fallbackCtaLink("buyer");
  const entrepriseLink =
    targetType === "seller" ? ctaLink : fallbackCtaLink("seller");

  let result = prompt;
  for (const [key, value] of [
    ["reservation_agence_link", agenceLink],
    ["reservation_entreprise_link", entrepriseLink],
  ] as const) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
