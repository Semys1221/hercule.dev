import { NextResponse } from "next/server";

import {
  applyStripeForRenewalChoice,
  clientStillOpenForRenewal,
  parseRenewalChoiceBody,
  recordRenewalChoice,
} from "@/lib/clients/monthly-renewal-choice";
import { evaluateClientRenewalPrompt } from "@/lib/clients/load-monthly-renewal";
import { createClientsClient, findClientBySlug } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const choice = parseRenewalChoiceBody(body);
  if (!choice) {
    return NextResponse.json({ error: "Choix invalide" }, { status: 400 });
  }

  try {
    const db = createClientsClient();
    const row = await findClientBySlug(db, normalizedSlug);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!clientStillOpenForRenewal(row)) {
      return NextResponse.json({ error: "Décision déjà enregistrée" }, { status: 409 });
    }

    const evaluation = await evaluateClientRenewalPrompt(db, row);
    if (evaluation.status === "closed") {
      return NextResponse.json({ error: "Décision déjà enregistrée" }, { status: 409 });
    }
    if (evaluation.status !== "show" || !row.stripe_subscription_id) {
      return NextResponse.json({ error: "Cette question n'est pas ouverte" }, { status: 400 });
    }

    await applyStripeForRenewalChoice(choice, row.stripe_subscription_id);
    const recorded = await recordRenewalChoice(db, row.id, choice);
    if (!recorded.ok) {
      return NextResponse.json({ error: "Décision déjà enregistrée" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, choice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Renewal choice failed";
    console.error("[api/clients/slug/monthly-renewal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
