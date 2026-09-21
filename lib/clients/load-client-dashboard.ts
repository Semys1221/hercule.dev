import type { SupabaseClient } from "@supabase/supabase-js";

import {
  clientDashboardDescription,
  clientDashboardTitle,
  CONFERENCE_CLIENT_TYPES,
  conferenceCheckoutMode,
  type ConferenceClientType,
} from "@/lib/commercial/conference-pricing";
import { getOnboardingFaq } from "@/lib/legacy/dashboard/onboarding-faq";
import { buildDashboardRetractionFields } from "@/lib/legacy/dashboard/retraction-fields";
import type { DashboardFaqAudience } from "@/lib/legacy/dashboard/types";
import { findCalendlySeatOnboardingByClientId } from "@/lib/legacy/calendly-seat-onboarding/store";

import type { ClientDashboardData, ClientMode, ClientRow } from "./types";

function retractionCategoryForClient(
  clientType: ConferenceClientType,
): "comptable" | "cif" {
  return clientType === CONFERENCE_CLIENT_TYPES.dec ? "comptable" : "cif";
}

function faqAudienceForClient(client: ClientRow): DashboardFaqAudience {
  if (client.client_type === CONFERENCE_CLIENT_TYPES.dec) {
    return "comptable";
  }
  return "cif";
}

function hubrisDashboardTitle(client: ClientRow): string {
  if (client.secondary_vertical === "ias") {
    return "Espace cabinet Hercule Hubris";
  }
  return clientDashboardTitle(client.client_type);
}

function hubrisDashboardDescription(client: ClientRow): string {
  if (client.secondary_vertical === "ias") {
    return "Suivi de votre déploiement Hercule Hubris — projets CIF et IAS qualifiés.";
  }
  return clientDashboardDescription(client.client_type);
}

export async function hasSucceededClientPayment(
  client: SupabaseClient,
  clientId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getLatestClientPayment(
  client: SupabaseClient,
  clientId: string,
): Promise<{
  offer_type: string;
  succeeded_at: string | null;
  stripe_subscription_id: string | null;
} | null> {
  const { data, error } = await client
    .from("payments")
    .select("offer_type, succeeded_at, stripe_subscription_id")
    .eq("client_id", clientId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function resolveClientMode(client: ClientRow, isPaid: boolean): ClientMode {
  if (client.product_statut === "CANCELLED") {
    return "unavailable";
  }
  if (!isPaid) {
    return "client_pending";
  }
  if (!client.onboarding_completed_at || !client.first_name?.trim()) {
    return "client_onboarding";
  }
  return "client_active";
}

export async function loadClientDashboard(
  client: SupabaseClient,
  row: ClientRow,
): Promise<ClientDashboardData> {
  const isPaid = await hasSucceededClientPayment(client, row.id);
  const payment = isPaid ? await getLatestClientPayment(client, row.id) : null;
  const clientMode = resolveClientMode(row, isPaid);

  const retractionCategory = retractionCategoryForClient(row.client_type);
  const { retraction, milestones } = buildDashboardRetractionFields({
    category: retractionCategory,
    lead: row,
  });

  const calendlySeatRow = await findCalendlySeatOnboardingByClientId(row.id);
  const faqConfig = getOnboardingFaq(faqAudienceForClient(row));
  const faq = faqConfig.items.map((item) => ({ q: item.q, a: item.a }));

  const billingPortalAvailable =
    row.billing === "monthly" &&
    Boolean(row.stripe_customer_id) &&
    conferenceCheckoutMode(row.offer_type) === "subscription";

  return {
    slug: row.slug,
    email: row.email,
    firstName: row.first_name,
    clientType: row.client_type,
    secondaryVertical: row.secondary_vertical,
    clientMode,
    isPaid,
    offerType: row.offer_type,
    billing: row.billing,
    rdvTotal: row.rdv_total,
    rdvUsed: row.rdv_used,
    succeededAt: payment?.succeeded_at ?? null,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
    timeline: milestones,
    retraction,
    calendlySeat: calendlySeatRow
      ? {
          status: calendlySeatRow.status,
          invitationStatus: calendlySeatRow.calendly_invitation_status,
        }
      : null,
    billingPortal: { available: billingPortalAvailable },
    faq,
    upsellUrl: "/conference/payment",
    contactEmail: "contact@hercule.dev",
    dashboardTitle: hubrisDashboardTitle(row),
    dashboardDescription: hubrisDashboardDescription(row),
  };
}
