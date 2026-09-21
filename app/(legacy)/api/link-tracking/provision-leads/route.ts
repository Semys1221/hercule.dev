import { NextResponse } from "next/server";
import { z } from "zod";

import { isNiche } from "@/lib/legacy/admin/navigation";
import {
  resolveInstantlyCampaignId,
  resolveInstantlyListId,
} from "@/lib/legacy/admin/niches/outreach-config";
import {
  normalizeProvisionEmails,
  provisionLeadsByEmails,
} from "@/lib/legacy/link-tracking/provision-by-emails";
import { resolveCategoryForCampaign } from "@/lib/legacy/link-tracking/provision-campaign-lead";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

const bodySchema = z.object({
  emails: z.array(z.string()).min(1).max(100),
  niche: z.string().optional(),
  listId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});

function verifyProvisionLeadsSecret(request: Request): boolean {
  const linkTracking = process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() || "";
  const cron = process.env.CRON_SECRET?.trim() || "";
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  // Accept either secret — VPS scrapers typically send CRON_SECRET while
  // production may prefer LINK_TRACKING_WEBHOOK_SECRET.
  const matchedLink = Boolean(linkTracking) && token === linkTracking;
  const matchedCron = Boolean(cron) && token === cron;
  const ok = Boolean(token) && (matchedLink || matchedCron);
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "45f10f",
    },
    body: JSON.stringify({
      sessionId: "45f10f",
      runId: "provision-server-or-auth",
      hypothesisId: "A",
      location: "app/api/link-tracking/provision-leads/route.ts:verify",
      message: "provision_auth_check",
      data: {
        ok,
        matchedLink,
        matchedCron,
        hasLinkTracking: Boolean(linkTracking),
        hasCron: Boolean(cron),
        authPresent: auth.startsWith("Bearer "),
        authLen: token.length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  console.info("[provision-leads-debug]", {
    ok,
    matchedLink,
    matchedCron,
    authLen: token.length,
  });
  // #endregion
  return ok;
}

export { verifyProvisionLeadsSecret };

export async function POST(request: Request) {
  if (!verifyProvisionLeadsSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const campaignIdInput = parsed.data.campaignId?.trim() || "";
  const nicheRaw = parsed.data.niche?.trim();

  let category: LeadCategory;
  if (nicheRaw) {
    if (!isNiche(nicheRaw)) {
      return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
    }
    category = nicheRaw as LeadCategory;
  } else if (campaignIdInput) {
    const resolved = await resolveCategoryForCampaign(campaignIdInput);
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "Could not resolve niche from campaignId. Pass niche explicitly or configure niche_outreach_config.",
        },
        { status: 400 },
      );
    }
    category = resolved;
  } else {
    category = "cif";
  }

  const campaignId =
    campaignIdInput || (await resolveInstantlyCampaignId(category));
  const listId =
    parsed.data.listId?.trim() || (await resolveInstantlyListId(category));

  if (!campaignId) {
    return NextResponse.json(
      { error: "No Instantly campaign configured for this niche." },
      { status: 400 },
    );
  }
  if (!listId) {
    return NextResponse.json(
      { error: "No Instantly list configured for this niche." },
      { status: 400 },
    );
  }

  const emails = normalizeProvisionEmails(parsed.data.emails);
  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid emails provided." }, { status: 400 });
  }

  try {
    const result = await provisionLeadsByEmails({
      emails,
      listId,
      campaignId,
      category,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provision failed";
    console.error("[link-tracking/provision-leads]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
