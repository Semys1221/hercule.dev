import type { SupabaseClient } from "@supabase/supabase-js";

import { sendBookingEmail } from "@/lib/legacy/booking-communication/send";

import { HERCULE_OPS_EMAIL, isCheckoutPlaceholderEmail } from "../ops";
import { buildClientDashboardUrl, findClientBySlug } from "../supabase";
import type { ClientRow } from "../types";

export type ReportNoshowResult = {
  client: ClientRow;
  rdvUsed: number;
  rdvTotal: number;
  refunded: boolean;
};

export async function reportClientNoshow(params: {
  supabase: SupabaseClient;
  slug: string;
  message: string;
}): Promise<ReportNoshowResult> {
  const message = params.message.trim();
  if (message.length < 10) {
    throw new Error("Le message doit contenir au moins 10 caractères");
  }

  const row = await findClientBySlug(params.supabase, params.slug);
  if (!row) {
    throw new Error("Client not found");
  }

  const previousUsed = row.rdv_used;
  const nextUsed = Math.max(0, previousUsed - 1);
  const refunded = nextUsed < previousUsed;

  const { data, error } = await params.supabase
    .from("clients")
    .update({ rdv_used: nextUsed })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data as ClientRow;
  const displayName = updated.first_name?.trim() || updated.email;
  const dashboardLink = buildClientDashboardUrl(updated.slug);
  const reportedAt = new Date().toISOString();
  const remaining = Math.max(0, updated.rdv_total - updated.rdv_used);

  const opsSubject = `[No-show] Signalement client conférence — ${displayName}`;
  const opsText = [
    "Un client conférence a signalé un problème depuis son dashboard.",
    "",
    `Nom : ${displayName}`,
    `Email : ${updated.email}`,
    `Vertical : ${updated.client_type.toUpperCase()}`,
    `Slug : ${updated.slug}`,
    `Dashboard : ${dashboardLink}`,
    `Signalé le : ${new Date(reportedAt).toLocaleString("fr-FR")}`,
    `Crédit remboursé : ${refunded ? "oui (−1 utiliséé)" : "non (aucun crédit consommé)"}`,
    `Solde : ${updated.rdv_used} / ${updated.rdv_total} (${remaining} restants)`,
    "",
    "Message du client :",
    message,
  ].join("\n");

  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: opsSubject,
    text: opsText,
    idempotencyKey: `client-noshow-ops:${updated.id}:${reportedAt}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (!isCheckoutPlaceholderEmail(updated.email)) {
    const clientSubject = "Votre signalement a bien été reçu";
    const clientText = [
      updated.first_name ? `Bonjour ${updated.first_name},` : "Bonjour,",
      "",
      "Nous avons bien reçu votre signalement concernant un rendez-vous.",
      refunded
        ? "Un crédit rendez-vous a été remboursé automatiquement sur votre compte."
        : "Aucun crédit n'a été remboursé (aucun crédit n'était consommé).",
      "",
      `Solde actuel : ${updated.rdv_used} / ${updated.rdv_total} (${remaining} restants).`,
      "Notre équipe traite les demandes 7j/7 avec un délai maximal de traitement de 24 h.",
      "",
      `Référence : #${updated.slug.slice(0, 8).toUpperCase()}`,
      "",
      "L'équipe Hercule",
    ].join("\n");

    const clientResult = await sendBookingEmail({
      to: updated.email,
      subject: clientSubject,
      text: clientText,
      idempotencyKey: `client-noshow-client:${updated.id}:${reportedAt}`,
    });
    if (!clientResult.ok) {
      throw new Error(clientResult.error);
    }
  }

  return {
    client: updated,
    rdvUsed: updated.rdv_used,
    rdvTotal: updated.rdv_total,
    refunded,
  };
}
