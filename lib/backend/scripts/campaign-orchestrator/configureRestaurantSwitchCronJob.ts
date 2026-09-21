/**
 * Register (or update) the one-shot cron-job.org job for campaign-restaurant-switch.
 *
 * Schedule: Wednesday 10:00 Europe/Paris (expires end of 2026-09-24).
 *
 * Requires in .env:
 *   CRON_JOB_ORG_API_KEY  — from cron-job.org Console → Settings
 *   CRON_SECRET           — same value as Vercel (Authorization header on our endpoint)
 *
 * Optional:
 *   NEXT_PUBLIC_APP_URL   — defaults to https://www.hercule.dev
 */

const CRON_JOB_API = "https://api.cron-job.org";
const JOB_TITLE = "hercule campaign-restaurant-switch";

/** End of switch day (Europe/Paris) — auto-disable after mercredi 24/09/2026. */
const EXPIRES_AT_SECONDS = Math.floor(
  Date.parse("2026-09-24T23:59:59+02:00") / 1000,
);

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
  return `${base}/api/cron/campaign-restaurant-switch`;
}

type CronJobListItem = {
  jobId: number;
  title?: string;
  url?: string;
};

type CronJobDetail = CronJobListItem & {
  enabled?: boolean;
  saveResponses?: boolean;
  requestMethod?: number;
  extendedData?: {
    headers?: Record<string, string>;
  };
  schedule?: {
    timezone?: string;
    expiresAt?: number;
    hours?: number[];
    mdays?: number[];
    minutes?: number[];
    months?: number[];
    wdays?: number[];
  };
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
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    throw new Error(
      `cron-job.org ${response.status} on ${path}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`,
    );
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
      requestTimeout: 300,
      extendedData: {
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      },
      schedule: {
        timezone: "Europe/Paris",
        expiresAt: EXPIRES_AT_SECONDS,
        hours: [10],
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [3],
      },
    },
  };
}

async function findExistingJob(apiKey: string): Promise<CronJobListItem | null> {
  const page = await cronJobFetch<{ jobs?: CronJobListItem[] }>(apiKey, "/jobs");
  const target = cronTargetUrl();
  return (
    page.jobs?.find(
      (job) =>
        job.url === target ||
        job.title === JOB_TITLE ||
        job.url?.includes("/api/cron/campaign-restaurant-switch"),
    ) ?? null
  );
}

async function main(): Promise<void> {
  const apiKey = requireEnv("CRON_JOB_ORG_API_KEY");
  const cronSecret = requireEnv("CRON_SECRET");
  const payload = buildJobPayload(cronSecret);

  const existing = await findExistingJob(apiKey);
  if (existing?.jobId) {
    await cronJobFetch(apiKey, `/jobs/${existing.jobId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    console.log(
      `Updated cron-job.org job ${existing.jobId} → ${payload.job.url} (Wed 10:00 Europe/Paris, expires ${EXPIRES_AT_SECONDS})`,
    );
    return;
  }

  const created = await cronJobFetch<{ jobId?: number }>(apiKey, "/jobs", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  console.log(
    `Created cron-job.org job ${created.jobId ?? "?"} → ${payload.job.url} (Wed 10:00 Europe/Paris, expires ${EXPIRES_AT_SECONDS})`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
