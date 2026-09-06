import { NextResponse } from "next/server";

import { sendBookingEmail } from "@/lib/booking-communication/send";
import { getBookingFromAddress } from "@/lib/booking-communication/templates";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const OPS_EMAIL = process.env.HERCULE_OPS_EMAIL?.trim() || "contact@hercule.dev";

function formatScheduledAt(value: string | null): string {
  if (!value) {
    return "Non planifié";
  }
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export async function POST(_request: Request, { params }: RouteParams) {
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
    const displayName =
      [lead.first_name, lead.company].filter(Boolean).join(" · ") || lead.email;
    const dashboardLink = lead.dashboard_link || dashboardLinkFor(lead);
    const reportedAt = new Date().toISOString();
    const scheduledLabel = formatScheduledAt(lead.scheduled_at);

    const opsSubject = `[No-show] Signalement client — ${displayName}`;
    const opsText = [
      "Un client a signalé un problème depuis son dashboard.",
      "",
      `Nom / société : ${displayName}`,
      `Email : ${lead.email}`,
      `Slug : ${lead.slug}`,
      `RDV planifié : ${scheduledLabel}`,
      `Dashboard : ${dashboardLink}`,
      `Signalé le : ${new Date(reportedAt).toLocaleString("fr-FR")}`,
      "",
      "Action requise : vérifier le rendez-vous et contacter le client si besoin.",
    ].join("\n");

    const clientSubject = "Votre signalement a bien été reçu";
    const clientText = [
      lead.first_name ? `Bonjour ${lead.first_name},` : "Bonjour,",
      "",
      "Nous avons bien reçu votre signalement concernant un rendez-vous.",
      "Notre équipe traite les demandes 7j/7 avec un délai maximal de traitement de 24 h.",
      "Vous recevrez une réponse à contact@hercule.dev dès que possible.",
      "",
      `Référence commande : #${lead.slug.slice(0, 8).toUpperCase()}`,
      "",
      "L'équipe Hercule",
    ].join("\n");

    const opsResult = await sendBookingEmail({
      to: OPS_EMAIL,
      subject: opsSubject,
      text: opsText,
      idempotencyKey: `dashboard-noshow-ops:${lead.id}:${reportedAt}`,
    });

    if (!opsResult.ok) {
      throw new Error(opsResult.error);
    }

    const clientResult = await sendBookingEmail({
      to: lead.email,
      subject: clientSubject,
      text: clientText,
      idempotencyKey: `dashboard-noshow-client:${lead.id}:${reportedAt}`,
    });

    if (!clientResult.ok) {
      throw new Error(clientResult.error);
    }

    return NextResponse.json({
      ok: true,
      from: getBookingFromAddress(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No-show notification failed";
    console.error("[dashboard/slug/noshow]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
