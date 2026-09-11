import {
  createLinkTrackingClient,
  findLeadByEmail,
} from "@/lib/link-tracking/supabase";

import type { AiReplyTargetType } from "./types";

const FALLBACK_BUYER = "https://www.hercule.dev/reservation.html";
const FALLBACK_SELLER = "https://www.hercule.dev/reservation-entreprise.html";

type CtaColumn = "reservation_agence_link" | "reservation_entreprise_link";

export type PromptLinks = {
  primary: string;
  agenceLink: string;
  entrepriseLink: string;
  comptableLink: string;
  cifLink: string;
};

export function ctaLinkColumn(targetType: AiReplyTargetType): CtaColumn {
  return targetType === "buyer"
    ? "reservation_agence_link"
    : "reservation_entreprise_link";
}

export function fallbackCtaLink(targetType: AiReplyTargetType): string {
  return targetType === "buyer" ? FALLBACK_BUYER : FALLBACK_SELLER;
}

export async function resolvePromptLinks(
  leadEmail: string,
  targetType: AiReplyTargetType,
): Promise<PromptLinks> {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, leadEmail);

  let agenceLink = fallbackCtaLink("buyer");
  let entrepriseLink = fallbackCtaLink("seller");
  let comptableLink = entrepriseLink;
  let cifLink = entrepriseLink;

  if (lookup?.lead) {
    const agence = lookup.lead.reservation_agence_link?.trim();
    if (agence) agenceLink = agence;

    const entreprise = lookup.lead.reservation_entreprise_link?.trim();
    if (entreprise) entrepriseLink = entreprise;

    const comptable = lookup.lead.reservation_comptable_link?.trim();
    if (comptable) comptableLink = comptable;

    const cif = lookup.lead.reservation_cif_link?.trim();
    if (cif) cifLink = cif;
  }

  const primary =
    lookup?.category === "comptable"
      ? comptableLink
      : lookup?.category === "cif"
        ? cifLink
        : targetType === "buyer"
          ? agenceLink
          : entrepriseLink;

  return { primary, agenceLink, entrepriseLink, comptableLink, cifLink };
}

export async function resolveLeadCtaLink(
  leadEmail: string,
  targetType: AiReplyTargetType,
): Promise<string> {
  const links = await resolvePromptLinks(leadEmail, targetType);
  return links.primary;
}

export function applyPromptLinkVariables(
  prompt: string,
  ctaLink: string,
  targetType: AiReplyTargetType,
  links?: Pick<PromptLinks, "agenceLink" | "entrepriseLink" | "comptableLink" | "cifLink">,
): string {
  const agenceLink =
    links?.agenceLink ??
    (targetType === "buyer" ? ctaLink : fallbackCtaLink("buyer"));
  const entrepriseLink =
    links?.entrepriseLink ??
    (targetType === "seller" ? ctaLink : fallbackCtaLink("seller"));
  const comptableLink =
    links?.comptableLink ??
    (prompt.includes("reservation_comptable_link") ? ctaLink : entrepriseLink);
  const cifLink =
    links?.cifLink ??
    (prompt.includes("reservation_cif_link") ? ctaLink : entrepriseLink);

  let result = prompt;
  for (const [key, value] of [
    ["reservation_agence_link", agenceLink],
    ["reservation_entreprise_link", entrepriseLink],
    ["reservation_comptable_link", comptableLink],
    ["reservation_cif_link", cifLink],
  ] as const) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
