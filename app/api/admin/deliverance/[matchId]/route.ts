import { NextResponse } from "next/server";
import { z } from "zod";

import { runDeliveranceAction } from "@/lib/deliverance/orchestrator";
import { findMatchById } from "@/lib/matching/store";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { transitionToInDeliverance } from "@/lib/product/transitions";
import type { ProductStatut } from "@/lib/admin/clients/types";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["search_started", "milestone", "waitlist"]),
  }),
  z.object({
    action: z.literal("advance_step"),
  }),
  z.object({
    action: z.literal("delay_days"),
    days: z.number().int().min(1).max(30).default(7),
  }),
]);

type RouteParams = {
  params: Promise<{ matchId: string }>;
};

/** The ordered forward progression for product_statut. */
const STATUT_ADVANCE_MAP: Partial<Record<ProductStatut, ProductStatut>> = {
  ONBOARDED: "IN_DELIVERANCE",
  PAID_PENDING_ONBOARDING: "IN_DELIVERANCE",
  IN_DELIVERANCE: "MATCH_PROPOSED",
  MATCH_PROPOSED: "MEETING_BOOKED",
  MEETING_BOOKED: "POST_RDV_SURVEY",
  POST_RDV_SURVEY: "IN_DELIVERANCE",
};

export async function POST(request: Request, { params }: RouteParams) {
  const { matchId } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const match = await findMatchById(matchId);
    if (!match) {
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    }

    if (
      parsed.data.action === "search_started" ||
      parsed.data.action === "milestone" ||
      parsed.data.action === "waitlist"
    ) {
      await runDeliveranceAction({ matchId, action: parsed.data.action });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === "advance_step") {
      const client = createLinkTrackingClient();

      // Fetch current agence product_statut
      const { data: agenceRow } = await client
        .from("agence")
        .select("product_statut")
        .eq("id", match.agence_id)
        .maybeSingle();

      const current = agenceRow?.product_statut as ProductStatut | null;
      if (!current) {
        return NextResponse.json({ error: "agence_not_found" }, { status: 404 });
      }

      const next = STATUT_ADVANCE_MAP[current];
      if (!next) {
        return NextResponse.json(
          { error: `no_advance_defined_from_${current}` },
          { status: 422 },
        );
      }

      // Use transitions module for guarded writes
      if (next === "IN_DELIVERANCE") {
        await transitionToInDeliverance(client, match.agence_id, "agence");
      } else {
        // Direct write for intermediate advance steps (ops override)
        await client
          .from("agence")
          .update({ product_statut: next })
          .eq("id", match.agence_id)
          .throwOnError();
      }

      return NextResponse.json({ ok: true, from: current, to: next });
    }

    if (parsed.data.action === "delay_days") {
      const client = createLinkTrackingClient();
      const days = parsed.data.days;
      const delayMs = days * 24 * 60 * 60 * 1000;

      // Reschedule all pending jobs for this agence by +N days
      const { data: jobs } = await client
        .from("booking_email_jobs")
        .select("id, scheduled_for")
        .eq("lead_id", match.agence_id)
        .eq("status", "pending");

      if (jobs && jobs.length > 0) {
        for (const job of jobs) {
          if (!job.scheduled_for) continue;
          const newDate = new Date(new Date(job.scheduled_for).getTime() + delayMs);
          await client
            .from("booking_email_jobs")
            .update({ scheduled_for: newDate.toISOString() })
            .eq("id", job.id);
        }
      }

      // Also push estimated_completion_at
      await client
        .from("agence")
        .update({
          estimated_completion_at: client.rpc ? undefined : undefined, // handled below
        })
        .eq("id", match.agence_id);

      const { data: agenceData } = await client
        .from("agence")
        .select("estimated_completion_at")
        .eq("id", match.agence_id)
        .maybeSingle();

      if (agenceData?.estimated_completion_at) {
        const newEstimate = new Date(
          new Date(agenceData.estimated_completion_at).getTime() + delayMs,
        );
        await client
          .from("agence")
          .update({ estimated_completion_at: newEstimate.toISOString() })
          .eq("id", match.agence_id)
          .throwOnError();
      }

      return NextResponse.json({ ok: true, delayed: jobs?.length ?? 0, days });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "deliverance failed";
    console.error("[admin/deliverance]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
