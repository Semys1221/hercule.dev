import { NextResponse } from "next/server";

import { hasSucceededPayment } from "@/lib/dashboard/payments";
import type { DashboardFaqItem, DashboardFormData } from "@/lib/dashboard/types";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

function timelineFromProfile(profile: Record<string, unknown> | null) {
  const display = profile?.display as Record<string, unknown> | undefined;
  const timeline = display?.timeline;
  if (Array.isArray(timeline)) {
    return timeline;
  }
  return [
    { id: "confirmed", label: "Commande confirmée", status: "done" },
    { id: "setup", label: "Mise en place", status: "pending" },
    { id: "preparation", label: "Première livraison en préparation", status: "pending" },
    { id: "delivery", label: "Première demande attribuée", status: "pending" },
  ];
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, normalizedSlug);
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    const lead = lookup.lead;
    const profile = (lead.profile ?? {}) as Record<string, unknown>;
    const form = (profile.form ?? {}) as DashboardFormData;
    const closing = (profile.dashboard ?? {}) as Record<string, unknown>;
    const isPaid = await hasSucceededPayment(client, lead.id);
    const isOnboarded = Boolean(lead.onboarding_completed_at);

    const dashboardMode = !isPaid
      ? "onboarding_preview"
      : !isOnboarded
        ? "dashboard_state"
        : "dashboard_active";

    const rawFaq = Array.isArray(profile.faq) ? profile.faq : [];
    const faq = rawFaq.filter(
      (item): item is DashboardFaqItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as DashboardFaqItem).q === "string" &&
        typeof (item as DashboardFaqItem).a === "string",
    );

    return NextResponse.json({
      slug: lead.slug,
      email: lead.email,
      firstName: lead.first_name,
      company: lead.company,
      statut: lead.statut,
      productStatut: (lead as { product_statut?: string }).product_statut ?? "NONE",
      scheduledAt: lead.scheduled_at,
      dashboardLink: dashboardLinkFor(lead),
      timeline: timelineFromProfile(profile),
      onboardingCompleted: isOnboarded,
      tieDownAccepted: Boolean(closing.tie_down_accepted),
      form,
      faq,
      isPaid,
      dashboardMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard fetch failed";
    console.error("[dashboard/slug]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, normalizedSlug);
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    const lead = lookup.lead;

    // Guard: onboarding completion requires payment
    if (body.completeOnboarding === true) {
      const isPaid = await hasSucceededPayment(client, lead.id);
      if (!isPaid) {
        return NextResponse.json(
          { error: "Payment required to complete onboarding" },
          { status: 403 },
        );
      }
    }

    const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
    const dashboardMeta = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };

    if (body.form && typeof body.form === "object") {
      profile.form = {
        ...((profile.form ?? {}) as Record<string, unknown>),
        ...(body.form as Record<string, unknown>),
      };
    }

    if (body.tieDownAccepted === true) {
      dashboardMeta.tie_down_accepted = true;
      dashboardMeta.tie_down_accepted_at = new Date().toISOString();
    }

    // CGV acceptance fields
    if (body.cgvVersion && typeof body.cgvVersion === "string") {
      dashboardMeta.cvg_version = body.cgvVersion;
      dashboardMeta.cvg_accepted_at = new Date().toISOString();
    }

    profile.dashboard = dashboardMeta;

    const patch: Record<string, unknown> = { profile };
    if (body.completeOnboarding === true) {
      const completedAt = new Date().toISOString();
      patch.onboarding_completed_at = completedAt;
      // Activation: paiement + onboarding complété → IN_DELIVERANCE (service actif)
      patch.product_statut = "IN_DELIVERANCE";
    }

    const { data, error } = await client
      .from("agence")
      .update(patch)
      .eq("id", lead.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Update failed");
    }

    // After successful onboarding completion: start Calendly seat workflow
    if (body.completeOnboarding === true) {
      try {
        const { startCalendlySeatWorkflow } = await import(
          "@/lib/calendly-seat-onboarding/orchestrator"
        );
        await startCalendlySeatWorkflow(lead.id);
      } catch (workflowError) {
        console.error(
          "[dashboard/slug] calendly seat workflow failed:",
          workflowError instanceof Error ? workflowError.message : workflowError,
        );
      }

      try {
        const { startOnboardingSequence } = await import(
          "@/lib/onboarding-sequence/orchestrator"
        );
        await startOnboardingSequence(lead.id);
      } catch (sequenceError) {
        console.error(
          "[dashboard/slug] onboarding sequence failed:",
          sequenceError instanceof Error ? sequenceError.message : sequenceError,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard update failed";
    console.error("[dashboard/slug]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
