import { NextResponse } from "next/server";

import { sendBookingEmail } from "@/lib/legacy/booking-communication/send";
import { getBookingFromAddress } from "@/lib/legacy/booking-communication/templates";
import { createClientsClient, findClientBySlug, buildClientDashboardUrl } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const OPS_EMAIL = process.env.HERCULE_OPS_EMAIL?.trim() || "contact@hercule.dev";

export async function POST(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const row = await findClientBySlug(client, normalizedSlug);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const displayName = row.first_name?.trim() || row.email;
    const dashboardLink = buildClientDashboardUrl(row.slug);
    const reportedAt = new Date().toISOString();

    const opsSubject = `[No-show] Signalement client conférence — ${displayName}`;
    const opsText = [
      "Un client conférence a signalé un problème depuis son dashboard.",
      "",
      `Nom : ${displayName}`,
      `Email : ${row.email}`,
      `Vertical : ${row.client_type.toUpperCase()}`,
      `Slug : ${row.slug}`,
      `Dashboard : ${dashboardLink}`,
      `Signalé le : ${new Date(reportedAt).toLocaleString("fr-FR")}`,
    ].join("\n");

    const clientSubject = "Votre signalement a bien été reçu";
    const clientText = [
      row.first_name ? `Bonjour ${row.first_name},` : "Bonjour,",
      "",
      "Nous avons bien reçu votre signalement concernant un rendez-vous.",
      "Notre équipe traite les demandes 7j/7 avec un délai maximal de traitement de 24 h.",
      "",
      `Référence : #${row.slug.slice(0, 8).toUpperCase()}`,
      "",
      "L'équipe Hercule",
    ].join("\n");

    const opsResult = await sendBookingEmail({
      to: OPS_EMAIL,
      subject: opsSubject,
      text: opsText,
      idempotencyKey: `client-noshow-ops:${row.id}:${reportedAt}`,
    });

    if (!opsResult.ok) {
      throw new Error(opsResult.error);
    }

    if (!row.email.includes("@checkout.hercule.dev")) {
      const clientResult = await sendBookingEmail({
        to: row.email,
        subject: clientSubject,
        text: clientText,
        idempotencyKey: `client-noshow-client:${row.id}:${reportedAt}`,
      });

      if (!clientResult.ok) {
        throw new Error(clientResult.error);
      }
    }

    return NextResponse.json({
      ok: true,
      from: getBookingFromAddress(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No-show notification failed";
    console.error("[api/clients/slug/noshow]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
