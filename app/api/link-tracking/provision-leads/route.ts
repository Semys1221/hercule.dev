import { NextResponse } from "next/server";
import { z } from "zod";

import { isNiche } from "@/lib/admin/navigation";
import {
  resolveInstantlyCampaignId,
  resolveInstantlyListId,
} from "@/lib/admin/niches/outreach-config";
import {
  normalizeProvisionEmails,
  provisionLeadsByEmails,
} from "@/lib/link-tracking/provision-by-emails";
import type { LeadCategory } from "@/lib/link-tracking/types";

const bodySchema = z.object({
  emails: z.array(z.string()).min(1).max(100),
  niche: z.string().optional(),
  listId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});

function verifyProvisionLeadsSecret(request: Request): boolean {
  const expected =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
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

  const nicheRaw = parsed.data.niche?.trim() || "cif";
  if (!isNiche(nicheRaw)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const category = nicheRaw as LeadCategory;
  const campaignId =
    parsed.data.campaignId?.trim() ||
    (await resolveInstantlyCampaignId(category));
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
