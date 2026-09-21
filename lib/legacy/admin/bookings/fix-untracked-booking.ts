import { generateUniqueSlug } from "@/lib/legacy/admin/slug";
import { persistMeetingActionLinksForLead } from "@/lib/legacy/booking-communication/meeting-links";
import { provisionRoleRecoveryLead } from "@/lib/legacy/link-tracking/provision-role-recovery-lead";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import {
  buildCifLeadUrls,
  buildComptableLeadUrls,
  buildDashboardUrl,
  buildEntrepriseLeadUrls,
  buildLeadUrls,
} from "@/lib/legacy/link-tracking/urls";
import {
  isCabinetBuyerCategory,
  type LeadCategory,
  type LeadLookup,
  type LinkTrackingLead,
} from "@/lib/legacy/link-tracking/types";
import {
  createSalesCallsClient,
  upsertSalesCallFromBooking,
} from "@/lib/legacy/sales-calls/supabase";

export type FixUntrackedBookingParams = {
  email: string;
  firstName?: string | null;
  company?: string | null;
  startTime: string;
  inviteeUri: string;
  eventUri?: string | null;
  bookingCategory: LeadCategory;
  slug?: string | null;
  questions?: Record<string, string>;
  calendlyJoinUrl?: string | null;
  calendlyRescheduleUrl?: string | null;
  calendlyCancelUrl?: string | null;
};

export type FixUntrackedBookingResult =
  | { ok: true; lookup: LeadLookup; created: boolean }
  | { ok: false; reason: string; errorMessage?: string };

function urlFieldsForCategory(
  slug: string,
  email: string,
  category: LeadCategory,
): Record<string, string> {
  if (category === "comptable") {
    return buildComptableLeadUrls(slug, email);
  }
  if (category === "cif") {
    return buildCifLeadUrls(slug, email);
  }
  if (category === "entreprise") {
    return buildEntrepriseLeadUrls(slug, email);
  }
  return buildLeadUrls(slug, email);
}

function dashboardLinkForCategory(slug: string, category: LeadCategory): string | null {
  if (category === "agence" || category === "comptable" || category === "cif") {
    return buildDashboardUrl(slug);
  }
  return null;
}

async function upsertBookedLeadForCategory(
  params: FixUntrackedBookingParams,
): Promise<FixUntrackedBookingResult> {
  const client = createLinkTrackingClient();
  const category = params.bookingCategory;
  const email = normalizeEmail(params.email);
  const scheduledAt = params.startTime.trim();
  const bookedAt = new Date().toISOString();
  const calendlyPayload = {
    invitee_uri: params.inviteeUri,
    event_uri: params.eventUri ?? null,
  };

  const existing = await findLeadByEmail(client, email);
  if (existing && existing.category !== category) {
    return {
      ok: false,
      reason: "category_collision",
      errorMessage: `Lead existant dans ${existing.category}`,
    };
  }

  const resolvedSlug =
    params.slug?.trim() ||
    existing?.lead.slug?.trim() ||
    (await generateUniqueSlug(client));

  const row: Record<string, unknown> = {
    email,
    statut: "MEETING_BOOKED",
    slug: resolvedSlug,
    ...urlFieldsForCategory(resolvedSlug, email, category),
    first_name: params.firstName?.trim() || null,
    company: params.company?.trim() || null,
    scheduled_at: scheduledAt,
    booked_at: bookedAt,
    calendly_invitee_uri: params.inviteeUri,
    calendly_payload: calendlyPayload,
    calendly_questions: params.questions ?? {},
    instantly_synced_at: bookedAt,
  };

  const dashboardLink = dashboardLinkForCategory(resolvedSlug, category);
  if (dashboardLink) {
    row.dashboard_link = dashboardLink;
  }

  if (existing) {
    const { data, error } = await client
      .from(category)
      .update(row)
      .eq("id", existing.lead.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        reason: "update_failed",
        errorMessage: error?.message ?? "update returned no row",
      };
    }

    return {
      ok: true,
      lookup: { category, lead: data as LinkTrackingLead },
      created: false,
    };
  }

  const { data, error } = await client
    .from(category)
    .insert({
      ...row,
      instantly_lead_id: null,
      instantly_campaign_id: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      reason: "insert_failed",
      errorMessage: error?.message ?? "insert returned no row",
    };
  }

  return {
    ok: true,
    lookup: { category, lead: data as LinkTrackingLead },
    created: true,
  };
}

async function persistSalesCall(
  lookup: LeadLookup,
  params: FixUntrackedBookingParams,
): Promise<void> {
  if (lookup.category !== "agence" && !isCabinetBuyerCategory(lookup.category)) {
    return;
  }

  const client = createSalesCallsClient();
  try {
    await upsertSalesCallFromBooking(client, {
      agenceId: lookup.category === "agence" ? lookup.lead.id : null,
      comptableId: lookup.category === "comptable" ? lookup.lead.id : null,
      cifId: lookup.category === "cif" ? lookup.lead.id : null,
      email: params.email,
      inviteeUri: params.inviteeUri,
      scheduledAt: params.startTime,
      status: "scheduled",
    });
  } catch (err) {
    console.error("[fix-untracked-booking] sales_calls upsert failed:", err);
  }
}

export async function fixUntrackedBooking(
  params: FixUntrackedBookingParams,
): Promise<FixUntrackedBookingResult> {
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7839bc" },
    body: JSON.stringify({
      sessionId: "7839bc",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "fix-untracked-booking.ts:fixUntrackedBooking:entry",
      message: "fix untracked booking requested",
      data: {
        emailDomain: params.email.split("@")[1] ?? null,
        bookingCategory: params.bookingCategory,
        hasSlug: Boolean(params.slug?.trim()),
        hasInviteeUri: Boolean(params.inviteeUri?.trim()),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const client = createLinkTrackingClient();
  const existing = await findLeadByEmail(client, params.email);
  if (existing) {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7839bc" },
      body: JSON.stringify({
        sessionId: "7839bc",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "fix-untracked-booking.ts:fixUntrackedBooking:existing-lead",
        message: "lead already exists before fix",
        data: {
          existingCategory: existing.category,
          bookingCategory: params.bookingCategory,
          existingStatut: existing.lead.statut,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  let provisioned: FixUntrackedBookingResult;

  if (params.bookingCategory === "agence") {
    const result = await provisionRoleRecoveryLead({
      email: params.email,
      firstName: params.firstName,
      company: params.company,
      scheduledAt: params.startTime,
      calendlyInviteeUri: params.inviteeUri,
      calendlyPayload: {
        invitee_uri: params.inviteeUri,
        event_uri: params.eventUri ?? null,
      },
      calendlyQuestions: params.questions ?? {},
      slug: params.slug,
      bookedAt: new Date().toISOString(),
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        errorMessage: result.errorMessage,
      };
    }

    const syncedAt = new Date().toISOString();
    const { data, error } = await client
      .from("agence")
      .update({ instantly_synced_at: syncedAt })
      .eq("id", result.lookup.lead.id)
      .select("*")
      .maybeSingle();

    provisioned = {
      ok: true,
      lookup: {
        category: "agence",
        lead: (data as LinkTrackingLead | null) ?? result.lookup.lead,
      },
      created: result.created,
    };

    if (error) {
      console.warn("[fix-untracked-booking] instantly_synced_at update failed:", error.message);
    }
  } else {
    provisioned = await upsertBookedLeadForCategory(params);
  }

  if (!provisioned.ok) {
    return provisioned;
  }

  let lookup = provisioned.lookup;

  try {
    const lead = await persistMeetingActionLinksForLead(lookup, {
      joinUrl: params.calendlyJoinUrl ?? undefined,
      rescheduleUrl: params.calendlyRescheduleUrl ?? undefined,
      cancelUrl: params.calendlyCancelUrl ?? undefined,
    }, {
      calendlyInviteeUri: params.inviteeUri,
      scheduledAt: params.startTime,
      calendlyPayload: {
        invitee_uri: params.inviteeUri,
        event_uri: params.eventUri ?? null,
      },
    });
    lookup = { category: lookup.category, lead };
  } catch (err) {
    console.error("[fix-untracked-booking] meeting links persist failed:", err);
  }

  await persistSalesCall(lookup, params);

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7839bc" },
    body: JSON.stringify({
      sessionId: "7839bc",
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "fix-untracked-booking.ts:fixUntrackedBooking:success",
      message: "fix untracked booking completed",
      data: {
        category: lookup.category,
        created: provisioned.created,
        leadStatut: lookup.lead.statut,
        hasDashboardLink: Boolean(lookup.lead.dashboard_link?.trim()),
        hasInviteeUri: Boolean(lookup.lead.calendly_invitee_uri?.trim()),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return { ok: true, lookup, created: provisioned.created };
}
