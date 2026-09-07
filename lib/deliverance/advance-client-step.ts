import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineStep } from "@/lib/dashboard/types";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

import type { DeliveranceAction } from "./orchestrator";
import { timelineForMilestone, timelineForSearchStarted } from "./timeline-steps";

function timelineFromProfile(profile: Record<string, unknown> | null): TimelineStep[] {
  const display = profile?.display as Record<string, unknown> | undefined;
  const timeline = display?.timeline;
  if (!Array.isArray(timeline)) {
    return [];
  }
  return timeline as TimelineStep[];
}

async function persistAgenceTimeline(
  client: SupabaseClient,
  agenceId: string,
  timeline: TimelineStep[],
): Promise<void> {
  const { data: row, error: fetchError } = await client
    .from("agence")
    .select("profile")
    .eq("id", agenceId)
    .maybeSingle();

  if (fetchError || !row) {
    throw new Error(fetchError?.message ?? "agence_not_found");
  }

  const profile = { ...((row.profile ?? {}) as Record<string, unknown>) };
  const display = { ...((profile.display ?? {}) as Record<string, unknown>) };
  display.timeline = timeline;
  profile.display = display;

  const { error } = await client.from("agence").update({ profile }).eq("id", agenceId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function applyDeliveranceTimelineForAgence(params: {
  agenceId: string;
  action: DeliveranceAction;
  client?: SupabaseClient;
}): Promise<void> {
  if (params.action === "waitlist") {
    return;
  }

  const client = params.client ?? createLinkTrackingClient();
  const { data: row, error } = await client
    .from("agence")
    .select("profile")
    .eq("id", params.agenceId)
    .maybeSingle();

  if (error || !row) {
    throw new Error(error?.message ?? "agence_not_found");
  }

  const current = timelineFromProfile((row.profile ?? {}) as Record<string, unknown>);
  const timeline =
    params.action === "search_started"
      ? timelineForSearchStarted(current)
      : timelineForMilestone(current);

  await persistAgenceTimeline(client, params.agenceId, timeline);
}
