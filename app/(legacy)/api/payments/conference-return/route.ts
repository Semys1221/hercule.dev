import { NextResponse } from "next/server";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { resolveConferenceCheckoutSession } from "@/lib/legacy/payments/conference-checkout-session";
import { getAppBaseUrl, getStripeClient } from "@/lib/legacy/payments/stripe";

/** Payment Link after_completion target — resolves the client slug, then hands off to /clients/[slug]. */
export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl();
  const fallback = NextResponse.redirect(`${baseUrl}/conference/inscription`);
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();

  if (!sessionId?.startsWith("cs_")) {
    return fallback;
  }

  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.status !== "complete") {
      return fallback;
    }

    const client = createLinkTrackingClient();
    const conferenceSession = await resolveConferenceCheckoutSession(client, session);
    const clientId = conferenceSession?.metadata?.client_id;
    if (!clientId) {
      return fallback;
    }

    const { data: clientRow } = await client
      .from("clients")
      .select("slug, client_type")
      .eq("id", clientId)
      .maybeSingle();
    if (!clientRow?.slug) {
      return fallback;
    }

    const target = new URL(`${baseUrl}/clients/${clientRow.slug}`);
    target.searchParams.set("paid", "1");
    target.searchParams.set("client_type", clientRow.client_type);
    target.searchParams.set("session_id", session.id);
    return NextResponse.redirect(target);
  } catch (error) {
    console.error(
      "[payments/conference-return]",
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}
