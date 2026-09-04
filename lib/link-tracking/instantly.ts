import {
  patchLeadCustomVariables,
  updateLeadInterestStatus,
} from "@/lib/instantly";

import type { LeadCategory, LeadStatut, LinkTrackingLead } from "./types";
import { buildInstantlyCustomVariables, leadSlug } from "./urls";

const MEETING_BOOKED_INTEREST = 2;

function getInstantlyApiKey(): string {
  const key = process.env.INSTANTLY_API_KEY?.trim();
  if (!key) {
    throw new Error("INSTANTLY_API_KEY is not set");
  }
  return key;
}

function confirmedInterestValue(): number | null {
  const raw = process.env.INSTANTLY_CONFIRMED_INTEREST_VALUE?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function patchStatutVariable(
  lead: LinkTrackingLead,
  _category: LeadCategory,
  statut: string,
): Promise<void> {
  if (!lead.instantly_lead_id) return;
  const apiKey = getInstantlyApiKey();
  const slug = leadSlug(lead);
  if (!slug) return;
  try {
    await patchLeadCustomVariables(
      apiKey,
      lead.instantly_lead_id,
      buildInstantlyCustomVariables(slug, lead.email, statut),
    );
  } catch (err) {
    console.warn(
      `[link-tracking] Instantly custom_variables PATCH failed for ${lead.email}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function syncLeadMeetingBookedToInstantly(
  lead: LinkTrackingLead,
  category: LeadCategory,
): Promise<void> {
  if (lead.instantly_synced_at) {
    return;
  }

  const apiKey = getInstantlyApiKey();
  await updateLeadInterestStatus(apiKey, {
    lead_email: lead.email,
    interest_value: MEETING_BOOKED_INTEREST,
    campaign_id: lead.instantly_campaign_id ?? undefined,
  });
  await patchStatutVariable(lead, category, "MEETING_BOOKED");
}

export async function syncLeadConfirmedToInstantly(
  lead: LinkTrackingLead,
  category: LeadCategory,
): Promise<void> {
  if (lead.instantly_confirmed_synced_at) {
    return;
  }

  const apiKey = getInstantlyApiKey();
  const customValue = confirmedInterestValue();
  if (customValue !== null) {
    await updateLeadInterestStatus(apiKey, {
      lead_email: lead.email,
      interest_value: customValue,
      campaign_id: lead.instantly_campaign_id ?? undefined,
    });
  }
  await patchStatutVariable(lead, category, "CONFIRMED");
}

export async function syncLeadStatutToInstantly(
  lead: LinkTrackingLead,
  category: LeadCategory,
  statut: LeadStatut,
): Promise<void> {
  if (statut === "MEETING_BOOKED" || statut === "BOOKED") {
    await syncLeadMeetingBookedToInstantly(lead, category);
    return;
  }
  if (statut === "CONFIRMED") {
    await syncLeadConfirmedToInstantly(lead, category);
    return;
  }
  await patchStatutVariable(lead, category, statut);
}
