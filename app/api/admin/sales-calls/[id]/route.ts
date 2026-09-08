import { NextResponse } from "next/server";
import { z } from "zod";

import type { SalesCallSequenceResult } from "@/lib/admin/bookings/sales-call-sequence";
import { mapQualificationToForm } from "@/lib/admin/onboarding/qualification-mapper";
import {
  createOnboardingClient,
  prefillAgenceFormFromQualification,
} from "@/lib/admin/onboarding/supabase";
import {
  createSalesCallsClient,
  findSalesCallById,
  replaceSalesCallNotesSection,
  updateSalesCallStatus,
} from "@/lib/sales-calls/supabase";

const patchSchema = z.object({
  qualification: z.record(z.string(), z.unknown()).optional(),
  closing: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["completed", "not_paid", "no_show"]).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const client = createSalesCallsClient();
    const salesCall = await findSalesCallById(client, id);
    if (!salesCall) {
      return NextResponse.json({ error: "Sales call not found" }, { status: 404 });
    }
    return NextResponse.json({ salesCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sales_calls fetch failed";
    console.error("[admin/sales-calls/id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createSalesCallsClient();
    let salesCall = await findSalesCallById(client, id);
    if (!salesCall) {
      return NextResponse.json({ error: "Sales call not found" }, { status: 404 });
    }

    if (parsed.data.qualification) {
      salesCall = await replaceSalesCallNotesSection(
        client,
        id,
        "qualification",
        parsed.data.qualification,
      );

      // Fire-and-forget: pre-fill agence.profile.form from qualification answers.
      // Runs after the notes are saved; does not block the response.
      if (salesCall.agence_id) {
        const onboardingClient = createOnboardingClient();
        const formPatch = mapQualificationToForm(
          parsed.data.qualification as Parameters<typeof mapQualificationToForm>[0],
        );
        prefillAgenceFormFromQualification(onboardingClient, salesCall.agence_id, formPatch).catch(
          (err: unknown) => {
            console.error(
              "[sales-calls/id] prefillAgenceForm failed:",
              err instanceof Error ? err.message : err,
            );
          },
        );
      }
    }

    if (parsed.data.closing) {
      salesCall = await replaceSalesCallNotesSection(
        client,
        id,
        "closing",
        parsed.data.closing,
      );
    }

    let sequence: SalesCallSequenceResult | undefined;

    if (parsed.data.status && parsed.data.status !== salesCall.status) {
      salesCall = await updateSalesCallStatus(client, id, parsed.data.status);
      if (parsed.data.status === "completed") {
        const { startUpsellSequence } = await import(
          "@/lib/upsell-sequence/orchestrator"
        );
        await startUpsellSequence(salesCall).catch((err: unknown) => {
          console.error(
            "[sales-calls/id] upsell sequence failed:",
            err instanceof Error ? err.message : err,
          );
        });
      }
      if (parsed.data.status === "not_paid") {
        const leadId = salesCall.agence_id ?? salesCall.entreprise_id;
        if (!leadId) {
          return NextResponse.json(
            { error: "Lead introuvable pour la séquence" },
            { status: 422 },
          );
        }
        const { startCloseIndecisSequence } = await import(
          "@/lib/close-indecis-sequence/orchestrator"
        );
        sequence = await startCloseIndecisSequence(salesCall, leadId);
      }
      if (parsed.data.status === "no_show") {
        const leadId = salesCall.agence_id ?? salesCall.entreprise_id;
        if (!leadId) {
          return NextResponse.json(
            { error: "Lead introuvable pour la séquence" },
            { status: 422 },
          );
        }
        const { startNoShowSequence } = await import(
          "@/lib/no-show-sequence/orchestrator"
        );
        sequence = await startNoShowSequence(salesCall, leadId);
      }
    }

    return NextResponse.json({ salesCall, sequence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sales_calls update failed";
    console.error("[admin/sales-calls/id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
