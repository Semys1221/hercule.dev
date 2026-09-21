/**
 * Register (or update) the cron-job.org job for ai-reply-agent-reprocess.
 */

const CRON_JOB_API = "https://api.cron-job.org";
const JOB_TITLE = "hercule ai-reply-agent-reprocess";
const SCHEDULE_MINUTES = [0, 30];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function cronTargetUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://www.hercule.dev";
  return `${base}/api/cron/ai-reply-agent-reprocess`;
}

type CronJobListItem = { jobId: number; title?: string; url?: string };
type CronJobDetail = CronJobListItem & {
  enabled?: boolean;
  saveResponses?: boolean;
  requestMethod?: number;
  requestTimeout?: number;
  extendedData?: { headers?: Record<string, string> };
  schedule?: Record<string, unknown>;
};

async function cronJobFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${CRON_JOB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`cron-job.org ${response.status}: ${text}`);
  }
  return data as T;
}

function buildJobPayload(cronSecret: string): { job: CronJobDetail } {
  return {
    job: {
      title: JOB_TITLE,
      url: cronTargetUrl(),
      enabled: true,
      saveResponses: true,
      requestMethod: 0,
      requestTimeout: 120,
      extendedData: {
        headers: { Authorization: `Bearer ${cronSecret}` },
      },
      schedule: {
        timezone: "Europe/Paris",
        expiresAt: 0,
        hours: [-1],
        mdays: [-1],
        minutes: SCHEDULE_MINUTES,
        months: [-1],
        wdays: [-1],
      },
    },
  };
}

async function main(): Promise<void> {
  const apiKey = requireEnv("CRON_JOB_ORG_API_KEY");
  const cronSecret = requireEnv("CRON_SECRET");
  const payload = buildJobPayload(cronSecret);
  const page = await cronJobFetch<{ jobs?: CronJobListItem[] }>(apiKey, "/jobs");
  const target = cronTargetUrl();
  const existing =
    page.jobs?.find(
      (job) => job.url === target || job.title === JOB_TITLE,
    ) ?? null;

  if (existing?.jobId) {
    await cronJobFetch(apiKey, `/jobs/${existing.jobId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log(`Updated cron-job.org job ${existing.jobId} → ${target}`);
    return;
  }

  const created = await cronJobFetch<{ jobId?: number }>(apiKey, "/jobs", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  console.log(`Created cron-job.org job ${created.jobId ?? "?"} → ${target}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
