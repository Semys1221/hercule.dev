import type { SupabaseClient } from "@supabase/supabase-js";

import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";
import {
  buildDisplayLinks,
  type EnrichedCalendlyBooking,
} from "@/lib/calendly/enrich-bookings";
import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { buildDashboardUrl, buildLeadUrls } from "@/lib/link-tracking/urls";
import {
  createSalesCallsClient,
  replaceSalesCallNotesSection,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";

import {
  SALES_TEST_SESSION_CALENDLY_QUESTIONS,
  SALES_TEST_SESSION_CLOSING,
  SALES_TEST_SESSION_COMPANY,
  SALES_TEST_SESSION_EMAIL,
  SALES_TEST_SESSION_FIRST_NAME,
  SALES_TEST_SESSION_INVITEE_URI,
  SALES_TEST_SESSION_PROFILE_FORM,
  SALES_TEST_SESSION_QUALIFICATION,
  SALES_TEST_SESSION_SLUG,
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
): Promise<ProvisionTestMeetingResult> {
  const urls = buildLeadUrls(SALES_TEST_SESSION_SLUG, SALES_TEST_SESSION_EMAIL);
  const scheduledAt = scheduledAtOneHourFromNow();

  const { data: existingLead, error: existingError } = await client
    .from("agence")
    .select("id")
    .eq("slug", SALES_TEST_SESSION_SLUG)
    .maybeSingle();

  if (existingError) {
    throw new Error(`agence lookup failed: ${existingError.message}`);
  }

  let agenceId = existingLead?.id as string | undefined;

  if (agenceId) {
    const { error: paymentsError } = await client
      .from("payments")
      .delete()
      .eq("agence_id", agenceId);
    if (paymentsError) {
      throw new Error(`payments reset failed: ${paymentsError.message}`);
    }
  }

  const profile = {
    form: SALES_TEST_SESSION_PROFILE_FORM,
    display: { timeline: DEFAULT_TIMELINE },
  };

  const row = {
    email: SALES_TEST_SESSION_EMAIL,
    statut: "MEETING_BOOKED",
    slug: SALES_TEST_SESSION_SLUG,
    first_name: SALES_TEST_SESSION_FIRST_NAME,
    company: SALES_TEST_SESSION_COMPANY,
    product_statut: "NONE",
    onboarding_completed_at: null,
    scheduled_at: scheduledAt,
    dashboard_link: buildDashboardUrl(SALES_TEST_SESSION_SLUG),
    profile,
    ...urls,
  };

  const { data: upserted, error: upsertError } = await client
    .from("agence")
    .upsert(row, { onConflict: "slug" })
    .select("*")
    .single();

  if (upsertError || !upserted) {
    throw new Error(`agence upsert failed: ${upsertError?.message ?? "no row"}`);
  }

  agenceId = upserted.id as string;

  const salesClient = createSalesCallsClient();
  const salesCall = await upsertSalesCallFromBooking(salesClient, {
    agenceId,
    email: SALES_TEST_SESSION_EMAIL,
    inviteeUri: SALES_TEST_SESSION_INVITEE_URI,
    scheduledAt,
    status: "scheduled",
  });

  await replaceSalesCallNotesSection(
    salesClient,
    salesCall.id,
    "qualification",
    SALES_TEST_SESSION_QUALIFICATION as unknown as Record<string, unknown>,
  );
  await replaceSalesCallNotesSection(
    salesClient,
    salesCall.id,
    "closing",
    SALES_TEST_SESSION_CLOSING as unknown as Record<string, unknown>,
  );

  await salesClient
    .from("sales_calls")
    .update({ status: "scheduled" })
    .eq("id", salesCall.id);

  const bookingRow: CalendlyBookingRow = {
    email: SALES_TEST_SESSION_EMAIL,
    name: `${SALES_TEST_SESSION_FIRST_NAME} Test`,
    first_name: SALES_TEST_SESSION_FIRST_NAME,
    company: SALES_TEST_SESSION_COMPANY,
    start_time: scheduledAt,
    invitee_uri: SALES_TEST_SESSION_INVITEE_URI,
    event_uri: "https://api.calendly.com/scheduled_events/test-session",
    questions: SALES_TEST_SESSION_CALENDLY_QUESTIONS,
    slug: SALES_TEST_SESSION_SLUG,
    lead_id: agenceId,
    lead_category: "agence",
    booking_category: "agence",
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
  };

  const lead = {
    ...upserted,
    category: "agence" as const,
  };

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
    qualification: SALES_TEST_SESSION_QUALIFICATION,
    closing: SALES_TEST_SESSION_CLOSING,
    agenceId,
  };
}
