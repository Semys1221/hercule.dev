import { NextResponse } from "next/server";

import { findCalendlySeatOnboardingByClientId } from "@/lib/(resend)/calendly-seat/client-store";
import { deleteConferenceClient } from "@/lib/clients/delete-client";
import { clientNeedsOps, clientOpsControls } from "@/lib/clients/engin-ops-controls";
import { loadPaymentOnboardingSteps } from "@/lib/clients/engin-payment-onboarding-steps";
import type { EnginClientRow } from "@/lib/clients/engin-types";
import { hasSucceededClientPayment } from "@/lib/clients/load-client-dashboard";
import { readClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";
import {
  clientEligibility,
  plannedShares,
} from "@/lib/clients/round-robin";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function loadEnginClientRow(clientId: string): Promise<EnginClientRow | null> {
  const supabase = createClientsClient();
  const client = await findClientById(supabase, clientId);
  if (!client) {
    return null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ClientRow[];
  const shares = plannedShares(rows);
  return {
    ...client,
    rrSharePct: shares.get(client.id)?.sharePct ?? 0,
    eligibility: clientEligibility(client),
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const supabase = createClientsClient();
    const client = await loadEnginClientRow(clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [onboardingSteps, calendlySeat, hasSucceededPayment] = await Promise.all([
      loadPaymentOnboardingSteps(supabase, clientId),
      findCalendlySeatOnboardingByClientId(clientId),
      hasSucceededClientPayment(supabase, clientId),
    ]);

    const seat = calendlySeat
      ? {
          status: calendlySeat.status,
          invitationStatus: calendlySeat.calendly_invitation_status,
        }
      : null;
    const controls = clientOpsControls({
      client,
      eligibility: client.eligibility,
      hasSucceededPayment,
      calendlySeat: seat,
    });

    return NextResponse.json({
      client: {
        ...client,
        hasSucceededPayment,
        needsOps: clientNeedsOps(controls),
      },
      answers: readClientOnboardingAnswers(client),
      onboardingSteps,
      calendlySeat,
      controls,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load client";
    console.error("[api/admin/engin/clients/id GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const result = await deleteConferenceClient({
      supabase: createClientsClient(),
      clientId,
    });
    return NextResponse.json({ ok: true, client: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete client";
    const status =
      message === "Client not found"
        ? 404
        : message === "Invalid client id"
          ? 400
          : 500;
    console.error("[api/admin/engin/clients/id DELETE]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
