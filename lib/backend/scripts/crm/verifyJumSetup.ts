/**
 * JUM niche setup verification — writes NDJSON to .cursor/debug-ff9898.log
 *
 * Usage: pnpm verify-jum-setup
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { JUM_VERTICALS } from "@/lib/legacy/admin/niches/jum-verticals";
import { resolveInstantlyCampaignId } from "@/lib/legacy/admin/niches/outreach-config";
import { resolveInterestedEmail1TemplateKey } from "@/lib/legacy/instantly-bypass/jum-segment";
import {
  buildInstantlyCustomVariables,
  buildJumLeadUrls,
} from "@/lib/legacy/link-tracking/urls";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";

const LOG_PATH = join(process.cwd(), ".cursor/debug-ff9898.log");
const SESSION_ID = "ff9898";

type CheckResult = {
  id: string;
  ok: boolean;
  detail: string;
};

function log(
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>,
  runId = "verify",
): void {
  const line = JSON.stringify({
    sessionId: SESSION_ID,
    runId,
    hypothesisId,
    location: "scripts/crm/verifyJumSetup.ts",
    message,
    data,
    timestamp: Date.now(),
  });
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: line,
  }).catch(() => {});
  // #endregion
  try {
    const { appendFileSync } = require("node:fs") as typeof import("node:fs");
    appendFileSync(LOG_PATH, `${line}\n`);
  } catch {
    // ignore
  }
}

function checkFiles(): CheckResult[] {
  const required = [
    "lib/backend/supabase/migrations/20261118120000_jum_niche.sql",
    "app/reservation/[slug]/page.tsx",
    "public/confirm-reservation-jum.html",
    "lib/backend/streamlit_reply_agent/prompts/jum_buyer.md",
    "app/(legacy)/content/tech/ai-reply-knowledge-jum.md",
    "app/(marketing)/content/faq/jum.json",
    "lib/backend/scripts/crm/provision_jum.py",
    "lib/backend/streamlit_scraper/configs/jum_advisory_config.py",
  ];
  return required.map((rel) => ({
    id: `file:${rel}`,
    ok: existsSync(join(process.cwd(), rel)),
    detail: existsSync(join(process.cwd(), rel)) ? "present" : "missing",
  }));
}

async function checkConfig(): Promise<CheckResult[]> {
  const envCampaign = process.env.INSTANTLY_CAMPAIGN_ID_JUM?.trim() ?? "";
  const dbCampaign = (await resolveInstantlyCampaignId("jum"))?.trim() ?? "";
  const placeholder =
    dbCampaign === "00000000-0000-0000-0000-000000000000" || !dbCampaign;

  const verticalChecks = JUM_VERTICALS.map((vertical) => ({
    id: `vertical:${vertical.key}`,
    ok: Boolean(vertical.listId && vertical.campaignId),
    detail: `${vertical.label} list=${vertical.listId.slice(0, 8)}… campaign=${vertical.campaignId.slice(0, 8)}… segment=${vertical.segment}`,
  }));

  return [
    ...verticalChecks,
    {
      id: "config:db_campaign",
      ok: !placeholder || Boolean(envCampaign),
      detail: placeholder
        ? envCampaign
          ? `niche_outreach_config placeholder; env fallback=${envCampaign.slice(0, 8)}…`
          : "optional DB row unset — verticals config is source of truth"
        : `niche_outreach_config campaign=${dbCampaign.slice(0, 8)}…`,
    },
  ];
}

function checkUrlLogic(): CheckResult[] {
  const slug = "verify-jum";
  const email = "verify@example.com";
  const urls = buildJumLeadUrls(slug, email);
  const vars = buildInstantlyCustomVariables(slug, email, "NOTBOOKED", "jum", {
    jumSegment: "restaurant",
  });
  const ok =
    urls.reservation_jum_link.includes("/reservation/") &&
    urls.confirmation_jum_link.includes("confirm-reservation-jum.html") &&
    vars.jum_segment === "restaurant" &&
    isLeadCategory("jum");

  return [
    {
      id: "logic:urls",
      ok,
      detail: ok ? "URL builders + Instantly vars OK" : "URL builder failure",
    },
  ];
}

function checkSegmentResolver(): CheckResult[] {
  const cases: Array<{ segment: string; expected: string }> = [
    { segment: "restaurant", expected: "interested_email1_restaurant" },
    { segment: "b2b", expected: "interested_email1_b2b" },
    { segment: "dentiste", expected: "interested_email1_dentiste" },
    { segment: "medecin", expected: "interested_email1_medecin" },
    { segment: "kine", expected: "interested_email1_kine" },
    { segment: "avocat", expected: "interested_email1_avocat" },
    { segment: "architecte", expected: "interested_email1_architecte" },
    { segment: "veterinaire", expected: "interested_email1_veterinaire" },
    { segment: "unknown", expected: "interested_email1" },
  ];
  const results: CheckResult[] = [];
  for (const { segment, expected } of cases) {
    const key = resolveInterestedEmail1TemplateKey(
      { custom_variables: { jum_segment: segment } },
      undefined,
    );
    results.push({
      id: `segment:${segment}`,
      ok: key === expected,
      detail: `got ${key}, want ${expected}`,
    });
  }
  return results;
}

function checkVercelRewrites(): CheckResult {
  const vercel = readFileSync(join(process.cwd(), "vercel.json"), "utf-8");
  const ok =
    vercel.includes("/reservation/:slug") &&
    vercel.includes("confirm-reservation-jum.html/:slug");
  return {
    id: "vercel:rewrites",
    ok,
    detail: ok ? "canonical reservation + JUM confirm rewrite present" : "missing reservation redirects",
  };
}

async function main(): Promise<void> {
  const all: CheckResult[] = [
    ...checkFiles(),
    ...checkUrlLogic(),
    ...checkSegmentResolver(),
    checkVercelRewrites(),
    ...(await checkConfig()),
  ];

  const failed = all.filter((row) => !row.ok);
  log("H1", "verify_jum_setup_summary", {
    total: all.length,
    passed: all.length - failed.length,
    failed: failed.map((row) => row.id),
  });

  for (const row of all) {
    log(row.ok ? "H2" : "H3", `check_${row.id}`, {
      ok: row.ok,
      detail: row.detail,
    });
  }

  console.log(JSON.stringify({ ok: failed.length === 0, checks: all }, null, 2));
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log("H4", "verify_jum_setup_error", {
    error: err instanceof Error ? err.message : String(err),
  });
  console.error(err);
  process.exit(1);
});
