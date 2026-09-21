import type { Niche } from "@/lib/legacy/admin/navigation";

import type { EmailSequenceRecipient } from "./types";

export function buildCockpitHref(
  category: Niche,
  slug: string | null | undefined,
): string | null {
  if (!slug?.trim()) {
    return null;
  }
  return `/internal/clients/${category}/${slug.trim()}`;
}

export function buildManagementHref(
  niche: Niche,
  recipientId?: string | null,
): string {
  const base = `/internal/funnels/management/${niche}`;
  if (!recipientId?.trim()) {
    return base;
  }
  return `${base}?recipient=${encodeURIComponent(recipientId.trim())}`;
}

export async function resolveCockpitHref(
  recipient: EmailSequenceRecipient,
  slug?: string | null,
): Promise<string | null> {
  return buildCockpitHref(recipient.lead_category, slug);
}
