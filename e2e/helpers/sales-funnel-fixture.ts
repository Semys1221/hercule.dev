import type { Page } from "@playwright/test";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { Audience } from "@/lib/admin/navigation";

import { cleanupSalesSession } from "./cockpit-fixture";
import { getAgenceIdBySlug, TEST_AGENCE_SLUG } from "./supabase-assertions";

export { cleanupSalesSession };

export async function enableSalesDeveloperMode(
  page: Page,
  audience: Audience = "agence",
): Promise<void> {
  await page.addInitScript((aud) => {
    window.localStorage.setItem(`hercule:sales-funnel:developer-mode:${aud}`, "true");
    window.localStorage.setItem(`hercule:sales-funnel:pitch-sidebar:${aud}`, "true");
  }, audience);
}

export async function assertAgenceMeetingBooked(slug: string = TEST_AGENCE_SLUG): Promise<void> {
  const client = createLinkTrackingClient();
  const { data, error } = await client.from("agence").select("statut").eq("slug", slug).maybeSingle();
  if (error || !data) {
    throw new Error(`agence not found for ${slug}: ${error?.message ?? "missing"}`);
  }
  if ((data.statut as string) !== "MEETING_BOOKED") {
    throw new Error(`Expected statut MEETING_BOOKED for ${slug}, got ${data.statut}`);
  }
}

export async function assertSalesCallPersisted(slug: string = TEST_AGENCE_SLUG): Promise<void> {
  const agenceId = await getAgenceIdBySlug(slug);
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("sales_calls")
    .select("id, notes")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`sales_calls row missing for ${slug}: ${error?.message ?? "not found"}`);
  }

  const notes = data.notes as { qualification?: unknown; closing?: unknown } | null;
  if (!notes?.qualification) {
    throw new Error(`sales_calls qualification not persisted for ${slug}`);
  }
  if (!notes?.closing) {
    throw new Error(`sales_calls closing not persisted for ${slug}`);
  }
}
