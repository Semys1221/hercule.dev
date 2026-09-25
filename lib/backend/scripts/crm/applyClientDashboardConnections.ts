/**
 * Set dashboard connection flags on clients by slug (ops one-off).
 *
 * Usage:
 *   pnpm apply-client-dashboard-connections           # dry-run
 *   pnpm apply-client-dashboard-connections --apply   # write
 */

import {
  CALENDAR_CONNECTED_PROFILE_KEY,
} from "@/lib/clients/dashboard-connections";
import { createClientsClient, findClientBySlug } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

type SlugPatch = {
  slug: string;
  calendarConnected?: boolean;
  videoConference?: "microsoft_teams_pro" | "zoom_pro" | "google_meet_pro";
};

const PATCHES: SlugPatch[] = [
  {
    slug: "QxzohL",
    calendarConnected: true,
    videoConference: "microsoft_teams_pro",
  },
  {
    slug: "BZ04BR",
    calendarConnected: true,
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createClientsClient();

  for (const patch of PATCHES) {
    const row = await findClientBySlug(supabase, patch.slug);
    if (!row) {
      console.error(`[skip] slug ${patch.slug} not found`);
      continue;
    }

    const profile: Record<string, unknown> = { ...(row.profile ?? {}) };
    if (patch.calendarConnected !== undefined) {
      profile[CALENDAR_CONNECTED_PROFILE_KEY] = patch.calendarConnected;
    }
    if (patch.videoConference) {
      profile.video_conference = patch.videoConference;
    }

    console.log(
      `${apply ? "APPLY" : "DRY"} ${patch.slug} (${row.email}):`,
      JSON.stringify({
        calendar: profile[CALENDAR_CONNECTED_PROFILE_KEY],
        video_conference: profile.video_conference,
      }),
    );

    if (!apply) continue;

    const { data, error } = await supabase
      .from("clients")
      .update({ profile })
      .eq("id", row.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? `Failed to update ${patch.slug}`);
    }
    console.log(`  ok id=${(data as ClientRow).id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
