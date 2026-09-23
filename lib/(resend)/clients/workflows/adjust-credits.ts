import type { SupabaseClient } from "@supabase/supabase-js";

import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { renderNotification } from "@/lib/(resend)/notifications/file-io";

import type { CreditField } from "@/lib/clients/engin-types";
import { HERCULE_OPS_EMAIL, isCheckoutPlaceholderEmail } from "@/lib/clients/ops";
import { buildClientDashboardUrl, findClientById } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

export type { CreditField };

export type AdjustCreditsResult = {
  client: ClientRow;
  previousUsed: number;
  previousTotal: number;
  nextUsed: number;
  nextTotal: number;
};

function clampCredits(params: {
  field: CreditField;
  delta: number;
  used: number;
  total: number;
}): { nextUsed: number; nextTotal: number } {
  if (!Number.isFinite(params.delta) || params.delta === 0) {
    throw new Error("delta must be a non-zero number");
  }

  if (params.field === "rdv_used") {
    const nextUsed = Math.max(0, Math.min(params.total, params.used + params.delta));
    return { nextUsed, nextTotal: params.total };
  }

  const nextTotal = Math.max(0, params.total + params.delta);
  const nextUsed = Math.min(params.used, nextTotal);
  return { nextUsed, nextTotal };
}

export async function adjustClientCredits(params: {
  supabase: SupabaseClient;
  clientId: string;
  field: CreditField;
  delta: number;
  reason?: string;
}): Promise<AdjustCreditsResult> {
  const row = await findClientById(params.supabase, params.clientId);
  if (!row) {
    throw new Error("Client not found");
  }

  const previousUsed = row.rdv_used;
  const previousTotal = row.rdv_total;
  const { nextUsed, nextTotal } = clampCredits({
    field: params.field,
    delta: params.delta,
    used: previousUsed,
    total: previousTotal,
  });

  if (nextUsed === previousUsed && nextTotal === previousTotal) {
    throw new Error("No credit change applied (already at bound)");
  }

  const { data, error } = await params.supabase
    .from("clients")
    .update({ rdv_used: nextUsed, rdv_total: nextTotal })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data as ClientRow;
  const displayName = updated.first_name?.trim() || updated.email;
  const dashboardLink = buildClientDashboardUrl(updated.slug);
  const fieldLabel =
    params.field === "rdv_used" ? "crédits utilisés" : "quota RDV";
  const signedDelta = params.delta > 0 ? `+${params.delta}` : String(params.delta);
  const stamp = new Date().toISOString();

  const opsEmail = renderNotification("credits-adjusted-ops", {
    fieldLabel,
    displayName,
    email: updated.email,
    slug: updated.slug,
    signedDelta,
    before: `${previousUsed} / ${previousTotal}`,
    after: `${nextUsed} / ${nextTotal}`,
    reasonLine: params.reason?.trim() ? `Motif : ${params.reason.trim()}\n` : "",
    dashboardLink,
  });

  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: opsEmail.subject,
    text: opsEmail.text,
    idempotencyKey: `engin-credits-ops:${updated.id}:${params.field}:${stamp}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (!isCheckoutPlaceholderEmail(updated.email)) {
    const remaining = Math.max(0, nextTotal - nextUsed);
    const clientEmail = renderNotification("credits-adjusted-client", {
      greeting: updated.first_name ? `Bonjour ${updated.first_name},` : "Bonjour,",
      balance: `${nextUsed} utilisés / ${nextTotal} au total (${remaining} restants).`,
      dashboardLink,
    });

    const clientResult = await sendBookingEmail({
      to: updated.email,
      subject: clientEmail.subject,
      text: clientEmail.text,
      idempotencyKey: `engin-credits-client:${updated.id}:${params.field}:${stamp}`,
    });
    if (!clientResult.ok) {
      throw new Error(clientResult.error);
    }
  }

  return {
    client: updated,
    previousUsed,
    previousTotal,
    nextUsed,
    nextTotal,
  };
}
