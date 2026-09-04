/**
 * Audit cron-job.org registration and live endpoint health.
 * Usage: pnpm audit-crons
 */

import { createClient } from "@supabase/supabase-js";

const CRON_JOB_API = "https://api.cron-job.org";

const TARGETS = [
  { path: "/api/cron/booking-emails", label: "booking-emails" },
  { path: "/api/cron/instantly-bypass-jobs", label: "instantly-bypass-jobs" },
  { path: "/api/cron/instantly-bypass-pipeline", label: "instantly-bypass-pipeline" },
] as const;

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

async function main(): Promise<void> {
  const apiKey = env("CRON_JOB_ORG_API_KEY");
  const secret = env("CRON_SECRET");
  const base = (env("NEXT_PUBLIC_APP_URL") || "https://www.hercule.dev").replace(/\/$/, "");

  console.log("=== Hercule cron audit ===\n");
  console.log(`NEXT_PUBLIC_APP_URL: ${base}`);
  console.log(`CRON_SECRET: ${secret ? `SET (${secret.length} chars)` : "MISSING"}`);
  console.log(
    `CRON_JOB_ORG_API_KEY: ${apiKey ? `SET (${apiKey.length} chars)` : "MISSING"}`,
  );
  console.log(
    `INSTANTLY_BYPASS_WEBHOOK_SECRET: ${
      env("INSTANTLY_BYPASS_WEBHOOK_SECRET") || env("CRON_SECRET")
        ? "SET (or CRON_SECRET fallback)"
        : "MISSING"
    }`,
  );

  if (!apiKey) {
    console.error("\nCannot list cron-job.org jobs without CRON_JOB_ORG_API_KEY.");
    process.exit(1);
  }

  const listRes = await fetch(`${CRON_JOB_API}/jobs`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!listRes.ok) {
    console.error(`\ncron-job.org API error: ${listRes.status} ${await listRes.text()}`);
    process.exit(1);
  }

  const data = (await listRes.json()) as { jobs?: Array<{ jobId: number; title?: string; url?: string; enabled?: boolean }> };
  const jobs = data.jobs ?? [];

  console.log(`\n--- cron-job.org (${jobs.length} jobs) ---`);
  let allRegistered = true;
  for (const { path, label } of TARGETS) {
    const match = jobs.find((j) => (j.url ?? "").includes(path));
    if (match) {
      console.log(
        `OK   ${label.padEnd(28)} jobId=${match.jobId} enabled=${match.enabled} title="${match.title ?? "?"}"`,
      );
    } else {
      allRegistered = false;
      console.log(`MISS ${label.padEnd(28)} no cron-job.org entry for ${base}${path}`);
    }
  }

  const herculeJobs = jobs.filter(
    (j) =>
      /hercule|hercul/i.test(j.title ?? "") ||
      /hercule\.dev/.test(j.url ?? ""),
  );
  if (herculeJobs.length > TARGETS.length) {
    console.log("\n--- other hercule-related jobs ---");
    for (const j of herculeJobs) {
      const known = TARGETS.some((t) => (j.url ?? "").includes(t.path));
      if (!known) {
        console.log(`     jobId=${j.jobId} enabled=${j.enabled} title="${j.title ?? "?"}" url=${j.url ?? "?"}`);
      }
    }
  }

  console.log("\n--- live endpoint smoke (Bearer CRON_SECRET) ---");
  let allHealthy = true;
  for (const { path, label } of TARGETS) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      const text = await res.text();
      let summary = text.slice(0, 120);
      try {
        summary = JSON.stringify(JSON.parse(text)).slice(0, 120);
      } catch {
        /* keep raw */
      }
      const ok = res.ok;
      if (!ok) allHealthy = false;
      console.log(`${ok ? "OK  " : "FAIL"} ${label.padEnd(28)} HTTP ${res.status} ${summary}`);
    } catch (err) {
      allHealthy = false;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERR  ${label.padEnd(28)} ${message}`);
    }
  }

  const supabaseUrl = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && serviceKey) {
    const sb = createClient(supabaseUrl, serviceKey);
    const { data: configs, error: configError } = await sb
      .from("instantly_bypass_config")
      .select(
        "campaign_id,campaign_name,initialized_at,webhook_auto_send_enabled,pipeline_auto_advance_enabled",
      )
      .order("initialized_at");
    console.log("\n--- subsequences campaigns (instantly_bypass_config) ---");
    if (configError) {
      console.log(`ERR  ${configError.message}`);
    } else if (!configs?.length) {
      console.log("     (none initialized yet)");
    } else {
      for (const row of configs) {
        console.log(
          `     ${row.campaign_name ?? "?"} | ${row.campaign_id} | init=${row.initialized_at ?? "null"} | webhook=${row.webhook_auto_send_enabled} | pipeline=${row.pipeline_auto_advance_enabled}`,
        );
      }
    }
  }

  console.log("\n=== Summary ===");
  if (allRegistered && allHealthy) {
    console.log("All 3 crons registered and responding OK.");
  } else {
    if (!allRegistered) {
      console.log("- Missing cron-job.org job(s). Run:");
      console.log("    pnpm configure-booking-cron");
      console.log("    pnpm configure-instantly-bypass-cron");
      console.log("    pnpm configure-instantly-pipeline-cron");
    }
    if (!allHealthy) {
      console.log("- One or more endpoints failed. Check Vercel deploy + CRON_SECRET match.");
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
