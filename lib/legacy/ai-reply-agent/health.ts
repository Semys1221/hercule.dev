import { listMissedIngestCandidates } from "./missed-reply-sweep";
import { createAiReplyAgentClient } from "./supabase";
import { listBypassConfigs } from "@/lib/legacy/instantly-bypass/templates";

const SLOW_PENDING_HOURS = 24;
const FAILED_LOOKBACK_HOURS = 1;
const SLOW_PENDING_ALERT_THRESHOLD = 3;
const MISSED_INGEST_MINUTES = 30;
const INTERESTED_NO_OUTBOUND_HOURS = 2;

const NO_OUTBOUND_EXCLUDED_STATUSES = [
  "skipped_not_interested",
  "skipped_ooo",
  "skipped_waiting_e1",
  "superseded_by_e1",
  "skipped_post_e1_ack",
  "skipped_calendly_system",
] as const;

export type AiReplyHealthIssue = {
  kind: "failed" | "slow_pending" | "missed_ingest" | "interested_no_outbound";
  campaignId: string;
  leadEmail?: string;
  detail: string;
  createdAt?: string;
};

export type AiReplyHealthReport = {
  checkedAt: string;
  failedRecent: number;
  slowPending: number;
  missedIngest: number;
  interestedNoOutbound: number;
  issues: AiReplyHealthIssue[];
  alert: boolean;
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function collectMissedIngestIssues(): Promise<AiReplyHealthIssue[]> {
  const configs = await listBypassConfigs();
  const targets = configs.filter((config) => Boolean(config.initialized_at));
  const issues: AiReplyHealthIssue[] = [];

  for (const config of targets) {
    if (issues.length >= 20) break;
    const candidates = await listMissedIngestCandidates({
      campaignId: config.campaign_id,
      olderThanMinutes: MISSED_INGEST_MINUTES,
      limit: 40,
    });
    for (const candidate of candidates) {
      if (issues.length >= 20) break;
      issues.push({
        kind: "missed_ingest",
        campaignId: candidate.campaignId,
        leadEmail: candidate.leadEmail,
        detail: `Instantly inbound ${candidate.instantlyEmailId} missing from DB after ${candidate.ageMinutes}m`,
        createdAt: candidate.emailTimestamp ?? undefined,
      });
    }
  }

  return issues;
}

async function collectInterestedNoOutboundIssues(): Promise<
  AiReplyHealthIssue[]
> {
  const client = createAiReplyAgentClient();
  const since = hoursAgo(INTERESTED_NO_OUTBOUND_HOURS);

  const { data: inbound, error: inboundError } = await client
    .from("ai_reply_agent_messages")
    .select("id, campaign_id, lead_email, ai_status, ai_reason, created_at")
    .eq("direction", "inbound")
    .lte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(100);

  if (inboundError) {
    throw new Error(
      `Health check interested_no_outbound inbound query: ${inboundError.message}`,
    );
  }

  const excluded = new Set<string>(NO_OUTBOUND_EXCLUDED_STATUSES);
  const rows = (inbound ?? []).filter(
    (row) => !excluded.has(String(row.ai_status ?? "")),
  );
  if (rows.length === 0) return [];

  const campaignIds = [...new Set(rows.map((r) => String(r.campaign_id ?? "")))].filter(
    Boolean,
  );
  const leadEmails = [
    ...new Set(rows.map((r) => String(r.lead_email ?? "").toLowerCase())),
  ].filter(Boolean);

  // Any outbound for the same (campaign_id, lead_email) clears the SLA.
  const { data: outbound, error: outboundError } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email")
    .eq("direction", "outbound")
    .in("campaign_id", campaignIds)
    .in("lead_email", leadEmails);

  if (outboundError) {
    throw new Error(
      `Health check interested_no_outbound outbound query: ${outboundError.message}`,
    );
  }

  const outboundKeys = new Set(
    (outbound ?? []).map(
      (row) =>
        `${String(row.campaign_id ?? "")}:${String(row.lead_email ?? "").toLowerCase()}`,
    ),
  );

  const seen = new Set<string>();
  const issues: AiReplyHealthIssue[] = [];
  for (const row of rows) {
    const campaignId = String(row.campaign_id ?? "");
    const leadEmail = String(row.lead_email ?? "").toLowerCase();
    if (!campaignId || !leadEmail) continue;
    const key = `${campaignId}:${leadEmail}`;
    if (seen.has(key) || outboundKeys.has(key)) continue;
    seen.add(key);
    issues.push({
      kind: "interested_no_outbound",
      campaignId,
      leadEmail,
      detail: `Inbound ${row.ai_status} >${INTERESTED_NO_OUTBOUND_HOURS}h with no outbound`,
      createdAt: String(row.created_at ?? ""),
    });
  }

  return issues;
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

  const missedIngestIssues = await collectMissedIngestIssues();
  issues.push(...missedIngestIssues);

  const interestedNoOutboundIssues = await collectInterestedNoOutboundIssues();
  issues.push(...interestedNoOutboundIssues);

  const failedRecent = failedRows?.length ?? 0;
  const slowPending = slowRows?.length ?? 0;
  const missedIngest = missedIngestIssues.length;
  const interestedNoOutbound = interestedNoOutboundIssues.length;
  const alert =
    failedRecent > 0 ||
    slowPending >= SLOW_PENDING_ALERT_THRESHOLD ||
    missedIngest > 0 ||
    interestedNoOutbound > 0;

  return {
    checkedAt: new Date().toISOString(),
    failedRecent,
    slowPending,
    missedIngest,
    interestedNoOutbound,
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
    `Missed ingest (>${MISSED_INGEST_MINUTES}m Instantly inbound not in DB): ${report.missedIngest}`,
    `Interested no outbound (>${INTERESTED_NO_OUTBOUND_HOURS}h): ${report.interestedNoOutbound}`,
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

  const subjectParts: string[] = [];
  if (report.failedRecent > 0) subjectParts.push(`${report.failedRecent} failed`);
  if (report.slowPending > 0) {
    subjectParts.push(`${report.slowPending} slow pending`);
  }
  if (report.missedIngest > 0) {
    subjectParts.push(`${report.missedIngest} missed ingest`);
  }
  if (report.interestedNoOutbound > 0) {
    subjectParts.push(`${report.interestedNoOutbound} no outbound`);
  }
  const subject =
    subjectParts.length > 0
      ? `[Reply Agent] ${subjectParts.join(", ")}`
      : `[Reply Agent] health alert`;

  try {
    const { getResendClient } = await import("@/lib/resend");
    const { getBookingFromAddress } = await import(
      "@/lib/legacy/booking-communication/templates"
    );
    await getResendClient().emails.send({
      from: getBookingFromAddress(),
      to: [opsEmail],
      subject,
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
