import type { SupabaseClient } from "@supabase/supabase-js";

import { sendMonthlyRenewalJ7Email } from "@/lib/(resend)/clients/workflows/monthly-renewal-j7";
import { listClientAppointments, toPublicAppointment } from "@/lib/clients/appointments/store";
import { volumeEndLabelForAnnouncement } from "@/lib/clients/monthly-renewal-announcement";
import { closeRenewalPrompt } from "@/lib/clients/monthly-renewal-choice";
import { getLatestClientPayment } from "@/lib/clients/load-client-dashboard";
import { createClientsClient } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";
import { buildDashboardRetractionFields } from "@/lib/legacy/dashboard/retraction-fields";

import { evaluateClientRenewalPrompt } from "../load-monthly-renewal";

export type MonthlyRenewalJ7CronResult = {
  scanned: number;
  emailed: number;
  closed: number;
  skipped: number;
};

export async function runMonthlyRenewalJ7Cron(
  db: SupabaseClient = createClientsClient(),
  now = new Date(),
): Promise<MonthlyRenewalJ7CronResult> {
  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("billing", "monthly")
    .not("stripe_subscription_id", "is", null)
    .is("renewal_choice", null)
    .is("renewal_prompt_closed_at", null)
    .neq("product_statut", "CANCELLED");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ClientRow[];
  const result: MonthlyRenewalJ7CronResult = {
    scanned: rows.length,
    emailed: 0,
    closed: 0,
    skipped: 0,
  };

  for (const row of rows) {
    try {
      const evaluation = await evaluateClientRenewalPrompt(db, row, now);
      if (evaluation.status === "expire") {
        const closed = await closeRenewalPrompt(db, row.id, now);
        if (closed) result.closed += 1;
        else result.skipped += 1;
        continue;
      }
      if (evaluation.status !== "show" || !evaluation.periodEnd) {
        result.skipped += 1;
        continue;
      }

      const payment = await getLatestClientPayment(db, row.id);
      const { retraction } = buildDashboardRetractionFields({
        category: row.client_type === CONFERENCE_CLIENT_TYPES.dec ? "comptable" : "cif",
        lead: row,
      });
      const appointments = (await listClientAppointments(row.id, db)).map(toPublicAppointment);
      const volumeEndLabel = volumeEndLabelForAnnouncement({
        succeededAt: payment?.succeeded_at ?? null,
        retraction: retraction
          ? {
              activationAt: retraction.activationAt,
              status: retraction.status,
              endsAt: retraction.endsAt,
            }
          : null,
        clientType: row.client_type,
        offerType: row.offer_type,
        rdvTotal: row.rdv_total,
        appointments: appointments.filter((appointment) => appointment.status === "scheduled"),
        slug: row.slug,
        calendarConnected: Boolean(row.calendly_scheduling_url),
        now,
      });

      const sent = await sendMonthlyRenewalJ7Email({
        db,
        client: row,
        rdvRemaining: Math.max(0, row.rdv_total - row.rdv_used),
        volumeEndLabel,
      });
      if (sent === "sent") result.emailed += 1;
      else result.skipped += 1;
    } catch (error) {
      result.skipped += 1;
      console.error(
        "[monthly-renewal-j7]",
        row.id,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return result;
}
