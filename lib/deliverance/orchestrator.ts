import { sendProductEmailNow, scheduleLeadEmailJobs } from "@/lib/booking-communication/product-send";
import { findMatchById, updateMatch } from "@/lib/matching/store";

export type DeliveranceAction = "search_started" | "milestone" | "waitlist";

const ACTION_TYPE = {
  search_started: "deliverance_search_started",
  milestone: "deliverance_milestone",
  waitlist: "deliverance_waitlist",
} as const;

export async function runDeliveranceAction(params: {
  matchId: string;
  action: DeliveranceAction;
}): Promise<{ ok: boolean }> {
  const match = await findMatchById(params.matchId);
  if (!match) {
    throw new Error("match_not_found");
  }

  const emailType = ACTION_TYPE[params.action];
  const idempotencyKey = `deliverance:${params.action}:${match.id}:${Date.now()}`;

  await sendProductEmailNow({
    category: "agence",
    leadId: match.agence_id,
    emailType,
    triggeredBy: "deliverance_admin",
    idempotencyKey: `${idempotencyKey}:agence`,
  });
  await sendProductEmailNow({
    category: "entreprise",
    leadId: match.entreprise_id,
    emailType,
    triggeredBy: "deliverance_admin",
    idempotencyKey: `${idempotencyKey}:entreprise`,
  });

  if (params.action === "search_started") {
    await updateMatch(match.id, { search_started_at: new Date().toISOString() });
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await scheduleLeadEmailJobs({
      category: "agence",
      leadId: match.agence_id,
      triggeredBy: "deliverance_admin",
      jobs: [
        {
          emailType: "deliverance_d7_update",
          scheduledFor: inSevenDays,
          idempotencyKey: `deliverance:d7:${match.id}:agence`,
        },
      ],
    });
    await scheduleLeadEmailJobs({
      category: "entreprise",
      leadId: match.entreprise_id,
      triggeredBy: "deliverance_admin",
      jobs: [
        {
          emailType: "deliverance_d7_update",
          scheduledFor: inSevenDays,
          idempotencyKey: `deliverance:d7:${match.id}:entreprise`,
        },
      ],
    });
  }

  return { ok: true };
}
