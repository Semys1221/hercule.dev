import {
  createLinkTrackingClient,
  findLeadByEmail,
} from "@/lib/legacy/link-tracking/supabase";

import type { AiReplyTargetType } from "./types";

const FALLBACK_BUYER = "https://www.hercule.dev/reservation";
const FALLBACK_SELLER = "https://www.hercule.dev/reservation";

type CtaColumn = "reservation_agence_link" | "reservation_entreprise_link";

export type PromptLinks = {
  primary: string;
  agenceLink: string;
  entrepriseLink: string;
  comptableLink: string;
  cifLink: string;
  jumLink: string;
};

export function ctaLinkColumn(targetType: AiReplyTargetType): CtaColumn {
  return targetType === "buyer"
    ? "reservation_agence_link"
    : "reservation_entreprise_link";
}

export function fallbackCtaLink(targetType: AiReplyTargetType): string {
  return targetType === "buyer" ? FALLBACK_BUYER : FALLBACK_SELLER;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function resolvePromptLinks(
  leadEmail: string,
  targetType: AiReplyTargetType,
  campaignId?: string | null,
): Promise<PromptLinks> {
  const client = createLinkTrackingClient();

  // SaaS autonome — prefer Calendly URL from client_outreach_slot when campaign known
  if (campaignId?.trim()) {
    try {
      const { resolveSlotByCampaignId } = await import(
        "@/lib/legacy/capacity/pipeline-bridge"
      );
      const slot = await resolveSlotByCampaignId(client, campaignId);
      if (slot?.calendlySchedulingUrl) {
        const url = slot.calendlySchedulingUrl;
        return {
          primary: url,
          agenceLink: url,
          entrepriseLink: fallbackCtaLink("seller"),
          comptableLink: url,
          cifLink: url,
          jumLink: url,
        };
      }
    } catch {
      // fall through to link-tracking lookup
    }
  }

  const lookup = await withRetry(() => findLeadByEmail(client, leadEmail));

  let agenceLink = fallbackCtaLink("buyer");
  let entrepriseLink = fallbackCtaLink("seller");
  let comptableLink = entrepriseLink;
  let cifLink = entrepriseLink;
  let jumLink = entrepriseLink;

  if (lookup?.lead) {
    const agence = lookup.lead.reservation_agence_link?.trim();
    if (agence) agenceLink = agence;

    const entreprise = lookup.lead.reservation_entreprise_link?.trim();
    if (entreprise) entrepriseLink = entreprise;

    const comptable = lookup.lead.reservation_comptable_link?.trim();
    if (comptable) comptableLink = comptable;

    const cif = lookup.lead.reservation_cif_link?.trim();
    if (cif) cifLink = cif;

    const jum = lookup.lead.reservation_jum_link?.trim();
    if (jum) jumLink = jum;
  }

  const primary =
    lookup?.category === "comptable"
      ? comptableLink
      : lookup?.category === "cif"
        ? cifLink
        : lookup?.category === "jum"
          ? jumLink
        : targetType === "buyer"
          ? agenceLink
          : entrepriseLink;

  return { primary, agenceLink, entrepriseLink, comptableLink, cifLink, jumLink };
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
  links?: Pick<
    PromptLinks,
    "agenceLink" | "entrepriseLink" | "comptableLink" | "cifLink" | "jumLink"
  >,
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
  const jumLink =
    links?.jumLink ??
    (prompt.includes("reservation_jum_link") ? ctaLink : entrepriseLink);

  let result = prompt;
  for (const [key, value] of [
    ["reservation_agence_link", agenceLink],
    ["reservation_entreprise_link", entrepriseLink],
    ["reservation_comptable_link", comptableLink],
    ["reservation_cif_link", cifLink],
    ["reservation_jum_link", jumLink],
  ] as const) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
