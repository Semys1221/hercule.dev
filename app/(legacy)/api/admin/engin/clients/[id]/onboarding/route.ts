import { NextResponse } from "next/server";

import { loadPaymentOnboardingSteps } from "@/lib/clients/engin-payment-onboarding-steps";
import { readClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";
import type { OnboardingStepStatus } from "@/lib/clients/engin-types";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export type { OnboardingStepStatus };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const supabase = createClientsClient();
    const client = await findClientById(supabase, clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const steps = await loadPaymentOnboardingSteps(supabase, clientId);

    return NextResponse.json({
      client: {
        id: client.id,
        email: client.email,
        firstName: client.first_name,
        slug: client.slug,
      },
      answers: readClientOnboardingAnswers(client),
      steps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load onboarding";
    console.error("[api/admin/engin/clients/id/onboarding]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
