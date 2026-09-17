import { createAiReplyAgentClient } from "./supabase";

const SLOW_PENDING_HOURS = 24;
const FAILED_LOOKBACK_HOURS = 1;
const SLOW_PENDING_ALERT_THRESHOLD = 3;

export type AiReplyHealthIssue = {
  kind: "failed" | "slow_pending";
  campaignId: string;
  leadEmail?: string;
  detail: string;
  createdAt?: string;
};

export type AiReplyHealthReport = {
  checkedAt: string;
  failedRecent: number;
  slowPending: number;
  issues: AiReplyHealthIssue[];
  alert: boolean;
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function checkAiReplyAgentHealth(): Promise<AiReplyHealthReport> {
  const client = createAiReplyAgentClient();
  const sinceFailed = hoursAgo(FAILED_LOOKBACK_HOURS);
  const sinceSlow = hoursAgo(SLOW_PENDING_HOURS);

  const { data: failedRows, error: failedError } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email, ai_reason, created_at")
    .eq("direction", "inbound")
    .eq("ai_status", "failed")
    .gte("created_at", sinceFailed)
    .order("created_at", { ascending: false })
    .limit(50);

  if (failedError) {
    throw new Error(`Health check failed query: ${failedError.message}`);
  }

  const { data: slowRows, error: slowError } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email, ai_reason, created_at")
    .eq("direction", "inbound")
    .eq("ai_status", "pending")
    .lte("created_at", sinceSlow)
    .order("created_at", { ascending: true })
    .limit(100);

  if (slowError) {
    throw new Error(`Health check slow query: ${slowError.message}`);
  }

  const issues: AiReplyHealthIssue[] = [];

  for (const row of failedRows ?? []) {
    issues.push({
      kind: "failed",
      campaignId: String(row.campaign_id ?? ""),
      leadEmail: String(row.lead_email ?? ""),
      detail: String(row.ai_reason ?? "failed"),
      createdAt: String(row.created_at ?? ""),
    });
  }

  for (const row of slowRows ?? []) {
    issues.push({
      kind: "slow_pending",
      campaignId: String(row.campaign_id ?? ""),
      leadEmail: String(row.lead_email ?? ""),
      detail: "Inbound pending >24h with AI draft unsent",
      createdAt: String(row.created_at ?? ""),
    });
  }

  const failedRecent = failedRows?.length ?? 0;
  const slowPending = slowRows?.length ?? 0;
  const alert =
    failedRecent > 0 || slowPending >= SLOW_PENDING_ALERT_THRESHOLD;

  return {
    checkedAt: new Date().toISOString(),
    failedRecent,
    slowPending,
    issues,
    alert,
  };
}

export async function notifyOpsAiReplyHealthAlert(
  report: AiReplyHealthReport,
): Promise<boolean> {
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (!opsEmail || !report.alert) {
    return false;
  }

  const lines = [
    `AI Reply Agent health alert (${report.checkedAt})`,
    "",
    `Failed (last ${FAILED_LOOKBACK_HOURS}h): ${report.failedRecent}`,
    `Slow pending (>${SLOW_PENDING_HOURS}h): ${report.slowPending}`,
    "",
    "Issues:",
  ];

  for (const issue of report.issues.slice(0, 20)) {
    lines.push(
      `- [${issue.kind}] ${issue.campaignId} ${issue.leadEmail ?? ""}: ${issue.detail}`,
    );
  }
  if (report.issues.length > 20) {
    lines.push(`… and ${report.issues.length - 20} more`);
  }

  try {
    const { getResendClient } = await import("@/lib/resend");
    const { getBookingFromAddress } = await import(
      "@/lib/booking-communication/templates"
    );
    await getResendClient().emails.send({
      from: getBookingFromAddress(),
      to: [opsEmail],
      subject: `[Reply Agent] ${report.failedRecent} failed, ${report.slowPending} slow pending`,
      text: lines.join("\n"),
    });
    return true;
  } catch (err) {
    console.error(
      "[ai-reply-agent/health] ops notification failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}
