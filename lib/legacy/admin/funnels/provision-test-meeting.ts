import type { SupabaseClient } from "@supabase/supabase-js";

import type { SalesClosingValues } from "@/components/legacy/internal/funnels/sales/sales-closing-sections";
import { DEFAULT_TIMELINE } from "@/lib/legacy/admin/clients/types";
import {
  buildDisplayLinks,
  type EnrichedCalendlyBooking,
} from "@/lib/legacy/calendly/enrich-bookings";
import type { CalendlyBookingRow } from "@/lib/legacy/calendly/list-bookings";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/legacy/admin/navigation";
import { buildDashboardUrl, buildCifLeadUrls, buildComptableLeadUrls } from "@/lib/legacy/link-tracking/urls";
import {
  isUnifiedLeadsCategory,
  outreachInsertRow,
} from "@/lib/legacy/link-tracking/leads-table";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";
import {
  createSalesCallsClient,
  replaceSalesCallNotesSection,
  upsertSalesCallFromBooking,
} from "@/lib/legacy/sales-calls/supabase";

import {
  getSalesTestSessionPreset,
  SALES_TEST_SESSION_EMAIL,
  SALES_TEST_SESSION_FIRST_NAME,
} from "./sales-test-session-preset";

export type ProvisionTestMeetingResult = {
  booking: EnrichedCalendlyBooking;
  qualification: SalesQualificationValues;
  closing: SalesClosingValues;
  agenceId: string;
};

function scheduledAtOneHourFromNow(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export async function provisionTestMeeting(
  client: SupabaseClient,
  audience: Audience = "agence",
): Promise<ProvisionTestMeetingResult> {
  const preset = getSalesTestSessionPreset(audience);
  const category = preset.leadCategory;
  if (!isUnifiedLeadsCategory(category)) {
    throw new Error(`provisionTestMeeting: ${category} product removed — use comptable or cif`);
  }
  const urls =
    category === "comptable"
      ? buildComptableLeadUrls(preset.slug, SALES_TEST_SESSION_EMAIL)
      : category === "cif"
        ? buildCifLeadUrls(preset.slug, SALES_TEST_SESSION_EMAIL)
        : buildComptableLeadUrls(preset.slug, SALES_TEST_SESSION_EMAIL);
  const scheduledAt = scheduledAtOneHourFromNow();

  const { data: existingLead, error: existingError } = await client
    .from("leads")
    .select("id")
    .eq("slug", preset.slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(`leads lookup failed: ${existingError.message}`);
  }

  let leadId = existingLead?.id as string | undefined;

  if (leadId) {
    const { error: paymentsError } = await client.from("payments").delete().eq("lead_id", leadId);
    if (paymentsError) {
      throw new Error(`payments reset failed: ${paymentsError.message}`);
    }

    const { error: salesCallsError } = await client
      .from("sales_calls")
      .delete()
      .eq("lead_id", leadId);
    if (salesCallsError) {
      throw new Error(`sales_calls reset failed: ${salesCallsError.message}`);
    }
  }

  const profile =
    Object.keys(preset.profileForm).length > 0
      ? {
          form: preset.profileForm,
          display: { timeline: DEFAULT_TIMELINE },
        }
      : {};

  const row = {
    email: SALES_TEST_SESSION_EMAIL,
    statut: "MEETING_BOOKED",
    slug: preset.slug,
    first_name: SALES_TEST_SESSION_FIRST_NAME,
    company: preset.company,
    product_statut: "NONE",
    onboarding_completed_at: null,
    scheduled_at: scheduledAt,
    dashboard_link: buildDashboardUrl(preset.slug),
    profile,
    ...urls,
  };

  const { data: upserted, error: upsertError } = await client
    .from("leads")
    .upsert(outreachInsertRow(category, row as Record<string, unknown>), { onConflict: "slug" })
    .select("*")
    .single();

  if (upsertError || !upserted) {
    throw new Error(`leads upsert failed: ${upsertError?.message ?? "no row"}`);
  }

  leadId = upserted.id as string;

  const salesClient = createSalesCallsClient();
  const salesCall = await upsertSalesCallFromBooking(salesClient, {
    leadId,
    email: SALES_TEST_SESSION_EMAIL,
    inviteeUri: preset.inviteeUri,
    scheduledAt,
    status: "scheduled",
  });

  await replaceSalesCallNotesSection(
    salesClient,
    salesCall.id,
    "qualification",
    preset.qualification as unknown as Record<string, unknown>,
  );
  await replaceSalesCallNotesSection(
    salesClient,
    salesCall.id,
    "closing",
    preset.closing as unknown as Record<string, unknown>,
  );

  await salesClient
    .from("sales_calls")
    .update({ status: "scheduled" })
    .eq("id", salesCall.id);

  const leadCategory = preset.leadCategory as LeadCategory;

  const bookingRow: CalendlyBookingRow = {
    email: SALES_TEST_SESSION_EMAIL,
    name: `${SALES_TEST_SESSION_FIRST_NAME} Test`,
    first_name: SALES_TEST_SESSION_FIRST_NAME,
    company: preset.company,
    start_time: scheduledAt,
    invitee_uri: preset.inviteeUri,
    event_uri: "https://api.calendly.com/scheduled_events/test-session",
    questions: preset.calendlyQuestions,
    slug: preset.slug,
    lead_id: leadId,
    lead_category: leadCategory,
    booking_category: leadCategory,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
  };

  const lead = upserted;

  const links = buildDisplayLinks(bookingRow, lead);

  const booking: EnrichedCalendlyBooking = {
    ...bookingRow,
    statut: "MEETING_BOOKED",
    sales_call_status: "scheduled",
    links,
    lead_matched: true,
    provisioned: false,
    warning: null,
  };

  return {
    booking,
    qualification: preset.qualification,
    closing: preset.closing,
    agenceId: leadId,
  };
}
