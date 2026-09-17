import { createAiReplyAgentClient } from "./supabase";

const DEFAULT_THRESHOLD = 10;
const LOOKBACK_HOURS = 24;

export type ReprocessCandidate = {
  campaignId: string;
  leadEmail: string;
  messageId: string;
  aiStatus: string;
  aiReason: string | null;
  createdAt: string;
};

export type ReprocessThresholdReport = {
  checkedAt: string;
  threshold: number;
  campaignsOverThreshold: Array<{
    campaignId: string;
    skippedCount: number;
    candidates: ReprocessCandidate[];
  }>;
  alert: boolean;
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function reprocessThreshold(): number {
  const raw = process.env.AI_REPLY_REPROCESS_THRESHOLD?.trim();
  if (!raw) return DEFAULT_THRESHOLD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_THRESHOLD;
}

export async function checkReprocessThreshold(): Promise<ReprocessThresholdReport> {
  const client = createAiReplyAgentClient();
  const since = hoursAgo(LOOKBACK_HOURS);
  const threshold = reprocessThreshold();

  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .select("id, campaign_id, lead_email, ai_status, ai_reason, created_at")
    .eq("direction", "inbound")
    .in("ai_status", ["skipped_unsafe", "skipped_recovery"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Reprocess threshold query failed: ${error.message}`);
  }

  const byCampaign = new Map<string, ReprocessCandidate[]>();
  for (const row of data ?? []) {
    const campaignId = String(row.campaign_id ?? "");
    if (!campaignId) continue;
    const list = byCampaign.get(campaignId) ?? [];
    list.push({
      campaignId,
      leadEmail: String(row.lead_email ?? ""),
      messageId: String(row.id ?? ""),
      aiStatus: String(row.ai_status ?? ""),
      aiReason: row.ai_reason ? String(row.ai_reason) : null,
      createdAt: String(row.created_at ?? ""),
    });
    byCampaign.set(campaignId, list);
  }

  const campaignsOverThreshold = [...byCampaign.entries()]
    .filter(([, candidates]) => candidates.length >= threshold)
    .map(([campaignId, candidates]) => ({
      campaignId,
      skippedCount: candidates.length,
      candidates,
    }));

  return {
    checkedAt: new Date().toISOString(),
    threshold,
    campaignsOverThreshold,
    alert: campaignsOverThreshold.length > 0,
  };
}

export async function notifyOpsReprocessAlert(
  report: ReprocessThresholdReport,
): Promise<boolean> {
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (!opsEmail || !report.alert) {
    return false;
  }

  const lines = report.campaignsOverThreshold.map(
    (item) =>
      `- ${item.campaignId}: ${item.skippedCount} skipped (threshold ${report.threshold})`,
  );

  const { getResendClient } = await import("@/lib/resend");
  const { getBookingFromAddress } = await import(
    "@/lib/booking-communication/templates"
  );
  await getResendClient().emails.send({
    from: getBookingFromAddress(),
    to: [opsEmail],
    subject: `[Reply Agent] ${report.campaignsOverThreshold.length} campagne(s) au-dessus du seuil reprocess`,
    text: [
      "Le volume de skipped_unsafe / skipped_recovery dépasse le seuil.",
      "Lancer: pnpm reprocess-skipped-replies -- --campaign-id <id> --execute",
      "",
      ...lines,
    ].join("\n"),
  });
  return true;
}
