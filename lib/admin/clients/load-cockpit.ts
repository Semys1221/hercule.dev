import type { DashboardFormData, DashboardMode, TimelineStep } from "@/lib/dashboard/types";
import { hasSucceededPayment } from "@/lib/dashboard/payments";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";
import { listMatches, type MatchRow } from "@/lib/matching/store";

import { DEFAULT_TIMELINE, type ClientCockpitData } from "./types";

function timelineFromProfile(profile: Record<string, unknown> | null): TimelineStep[] {
  const display = profile?.display as Record<string, unknown> | undefined;
  const timeline = display?.timeline;
  if (!Array.isArray(timeline)) {
    return DEFAULT_TIMELINE;
  }
  return timeline.filter(
    (step): step is TimelineStep =>
      typeof step === "object" &&
      step !== null &&
      typeof (step as TimelineStep).id === "string" &&
      typeof (step as TimelineStep).label === "string",
  );
}

function resolveDashboardMode(params: {
  category: LeadCategory;
  isPaid: boolean;
  isOnboarded: boolean;
}): DashboardMode | null {
  if (params.category !== "agence") {
    return null;
  }
  if (!params.isPaid) return "onboarding_preview";
  if (!params.isOnboarded) return "dashboard_state";
  return "dashboard_active";
}

export async function loadClientCockpit(
  category: LeadCategory,
  slug: string,
): Promise<ClientCockpitData | null> {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByLink(client, slug.trim());
  if (!lookup || lookup.category !== category) {
    return null;
  }

  const lead = lookup.lead;
  const profile = (lead.profile ?? {}) as Record<string, unknown>;
  const form = (profile.form ?? {}) as DashboardFormData;
  const isOnboarded = Boolean(lead.onboarding_completed_at);
  const isPaid =
    category === "agence" ? await hasSucceededPayment(client, lead.id) : false;

  const matches: MatchRow[] = (await listMatches()).filter((match) =>
    category === "agence"
      ? match.agence_id === lead.id
      : match.entreprise_id === lead.id,
  );

  const productStatut =
    ((lead as { product_statut?: string }).product_statut ?? "NONE") as string;

  return {
    category,
    id: lead.id,
    slug: lead.slug,
    email: lead.email,
    firstName: lead.first_name,
    company: lead.company,
    statut: lead.statut,
    productStatut,
    scheduledAt: lead.scheduled_at,
    dashboardLink: dashboardLinkFor(lead),
    onboardingCompletedAt: lead.onboarding_completed_at,
    isPaid,
    dashboardMode: resolveDashboardMode({
      category,
      isPaid,
      isOnboarded,
    }),
    form,
    timeline: timelineFromProfile(profile),
    matches,
  };
}
