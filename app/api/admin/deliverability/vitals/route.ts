import { NextResponse } from "next/server";
import { z } from "zod";

import {
  invalidateDeliverabilityCache,
  setCachedSnapshot,
} from "@/lib/admin/deliverability/cache";
import {
  listAllInstantlyAccounts,
  testAccountVitals,
} from "@/lib/admin/deliverability/instantly-accounts";
import { buildDeliverabilitySnapshot } from "@/lib/admin/deliverability/snapshot";
import { getDeliverabilitySettings } from "@/lib/admin/deliverability/settings";
import { getInstantlyApiKey } from "@/lib/instantly";

const bodySchema = z.object({
  emails: z.array(z.string().email()).optional(),
});

export async function POST(request: Request) {
  let apiKey: string;
  try {
    apiKey = getInstantlyApiKey();
  } catch {
    return NextResponse.json(
      { error: "INSTANTLY_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let emails: string[] | undefined;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.parse(json);
    emails = parsed.emails;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const settings = await getDeliverabilitySettings();
    const excluded = new Set(settings.excluded_emails.map((email) => email.toLowerCase()));

    let targetEmails = emails;
    if (!targetEmails || targetEmails.length === 0) {
      const accounts = await listAllInstantlyAccounts(apiKey);
      targetEmails = accounts
        .map((account) => account.email.trim())
        .filter((email) => !excluded.has(email.toLowerCase()));
    }

    const vitalsByDomain = await testAccountVitals(apiKey, targetEmails);
    invalidateDeliverabilityCache();

    const snapshot = await buildDeliverabilitySnapshot({
      apiKey,
      settings,
      includeVitals: true,
    });

    setCachedSnapshot(snapshot, true);

    return NextResponse.json({
      ok: true,
      vitalsCheckedAt: snapshot.vitalsCheckedAt,
      domainsChecked: vitalsByDomain.size,
      snapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vitals check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
