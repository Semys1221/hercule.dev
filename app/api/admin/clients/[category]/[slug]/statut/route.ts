import { NextResponse } from "next/server";

import { isProductStatut } from "@/lib/admin/clients/types";
import { isAudience } from "@/lib/admin/navigation";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import {
  transitionToCancelled,
  transitionToArchived,
  transitionToInDeliverance,
  transitionToMatchProposed,
  transitionToMeetingBooked,
  transitionToOnboarded,
  transitionToPostRdvSurvey,
} from "@/lib/product/transitions";
import type { ProductStatut } from "@/lib/admin/clients/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

/**
 * Ops manual statut advance — routes through transitions.ts guards.
 * Transitions that require a paired ID (e.g. matchProposed needs both agence+entreprise)
 * fall back to a direct write since the ops override is intentional.
 */
async function applyTransition(
  client: ReturnType<typeof createLinkTrackingClient>,
  category: LeadCategory,
  leadId: string,
  statut: ProductStatut,
): Promise<void> {
  switch (statut) {
    case "ONBOARDED":
      await transitionToOnboarded(client, leadId, category);
      break;
    case "IN_DELIVERANCE":
      await transitionToInDeliverance(client, leadId, category);
      break;
    case "MATCH_PROPOSED":
      // Ops override — write directly (no paired entreprise available in this call)
      await client
        .from(category)
        .update({ product_statut: "MATCH_PROPOSED" })
        .eq("id", leadId)
        .throwOnError();
      break;
    case "MEETING_BOOKED":
      // Ops override — write directly
      await client
        .from(category)
        .update({ product_statut: "MEETING_BOOKED" })
        .eq("id", leadId)
        .throwOnError();
      break;
    case "POST_RDV_SURVEY":
      if (category === "agence") {
        await transitionToPostRdvSurvey(client, leadId);
      } else {
        await client
          .from(category)
          .update({ product_statut: "POST_RDV_SURVEY" })
          .eq("id", leadId)
          .throwOnError();
      }
      break;
    case "ARCHIVED":
      if (category === "entreprise") {
        await transitionToArchived(client, leadId);
      } else {
        await client
          .from(category)
          .update({ product_statut: "ARCHIVED" })
          .eq("id", leadId)
          .throwOnError();
      }
      break;
    case "CANCELLED":
      if (category === "agence") {
        await transitionToCancelled(client, leadId);
      } else {
        await client
          .from(category)
          .update({ product_statut: "CANCELLED" })
          .eq("id", leadId)
          .throwOnError();
      }
      break;
    default:
      // NONE, SOLD, PAID_PENDING_ONBOARDING — direct write for ops reset
      await client
        .from(category)
        .update({ product_statut: statut })
        .eq("id", leadId)
        .throwOnError();
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isAudience(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let body: { statut?: unknown };
  try {
    body = (await request.json()) as { statut?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.statut !== "string" || !isProductStatut(body.statut)) {
    return NextResponse.json({ error: "Invalid product_statut" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, slug.trim());
    if (!lookup || lookup.category !== category) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await applyTransition(client, category, lookup.lead.id, body.statut);

    return NextResponse.json({ ok: true, productStatut: body.statut });
  } catch (error) {
    const message = error instanceof Error ? error.message : "statut update failed";
    console.error("[admin/clients/statut]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
