import type { SupabaseClient } from "@supabase/supabase-js";

import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";
import {
  buildDisplayLinks,
  type EnrichedCalendlyBooking,
} from "@/lib/calendly/enrich-bookings";
import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { buildDashboardUrl, buildEntrepriseLeadUrls, buildLeadUrls } from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";
import {
  createSalesCallsClient,
  replaceSalesCallNotesSection,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";

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
  const table = preset.leadCategory;
  const urls =
    table === "entreprise"
      ? buildEntrepriseLeadUrls(preset.slug, SALES_TEST_SESSION_EMAIL)
      : buildLeadUrls(preset.slug, SALES_TEST_SESSION_EMAIL);
  const scheduledAt = scheduledAtOneHourFromNow();

  const { data: existingLead, error: existingError } = await client
    .from(table)
    .select("id")
    .eq("slug", preset.slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(`${table} lookup failed: ${existingError.message}`);
  }

  let leadId = existingLead?.id as string | undefined;

  if (leadId && table === "agence") {
    const { error: paymentsError } = await client
      .from("payments")
      .delete()
      .eq("agence_id", leadId);
    if (paymentsError) {
      throw new Error(`payments reset failed: ${paymentsError.message}`);
    }
  }

  if (leadId && table === "entreprise") {
    const { error: paymentsError } = await client
      .from("payments")
      .delete()
      .eq("entreprise_id", leadId);
    if (paymentsError) {
      throw new Error(`payments reset failed: ${paymentsError.message}`);
    }

    const { error: salesCallsError } = await client
      .from("sales_calls")
      .delete()
      .eq("entreprise_id", leadId);
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
    .from(table)
    .upsert(row, { onConflict: "slug" })
    .select("*")
    .single();

  if (upsertError || !upserted) {
    throw new Error(`${table} upsert failed: ${upsertError?.message ?? "no row"}`);
  }

  leadId = upserted.id as string;

  const salesClient = createSalesCallsClient();
  const salesCall = await upsertSalesCallFromBooking(salesClient, {
    agenceId: table === "agence" ? leadId : null,
    entrepriseId: table === "entreprise" ? leadId : null,
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
