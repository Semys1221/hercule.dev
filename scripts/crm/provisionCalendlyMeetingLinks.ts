/** Backfill Calendly meeting action links for booked leads in Supabase. */

import {
  fetchMeetingActionLinksFromCalendly,
  persistMeetingActionLinksForLead,
} from "@/lib/booking-communication/meeting-links";
import {
  createLinkTrackingClient,
  listLeadsWithUnsyncedMeetingLinks,
} from "@/lib/link-tracking/supabase";
import type { LeadLookup } from "@/lib/link-tracking/types";

function parseArgs(argv: string[]): { apply: boolean; all: boolean; limit: number } {
  const apply = argv.includes("--apply");
  const all = argv.includes("--all");
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;
  return { apply, all, limit: Number.isFinite(limit) ? limit : 50 };
}

async function listTargets(all: boolean, limit: number): Promise<LeadLookup[]> {
  const client = createLinkTrackingClient();
  if (!all) {
    return listLeadsWithUnsyncedMeetingLinks(client, limit);
  }

  const results: LeadLookup[] = [];
  for (const category of ["agence", "entreprise"] as const) {
    const { data, error } = await client
      .from(category)
      .select("*")
      .in("statut", ["MEETING_BOOKED", "CONFIRMED", "BOOKED"])
      .not("calendly_invitee_uri", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      results.push({ category, lead: row as LeadLookup["lead"] });
    }
  }

  return results.slice(0, limit);
}

async function main() {
  const { apply, all, limit } = parseArgs(process.argv.slice(2));
  const mode = apply ? "apply" : "dry-run";
  const scope = all ? "all booked leads" : "unsynced leads only";
  console.log(`provision-calendly-meeting-links (${mode}, ${scope}, limit=${limit})`);

  const targets = await listTargets(all, limit);
  if (targets.length === 0) {
    console.log("No leads to process.");
    return;
  }

  let wouldSync = 0;
  let synced = 0;
  let failed = 0;

  for (const lookup of targets) {
    try {
      const links = await fetchMeetingActionLinksFromCalendly(lookup.lead);
      if (!links) {
        console.log(`FAIL ${lookup.lead.email}: missing cancel/reschedule`);
        failed += 1;
        if (apply) {
          await persistMeetingActionLinksForLead(lookup, {}, {
            syncError: "missing_cancel_or_reschedule",
          });
        }
        continue;
      }

      wouldSync += 1;
      console.log(
        `OK ${lookup.lead.email}: join=${Boolean(links.joinUrl)} reschedule=${Boolean(links.rescheduleUrl)} cancel=${Boolean(links.cancelUrl)}`,
      );

      if (apply) {
        await persistMeetingActionLinksForLead(lookup, links);
        synced += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`FAIL ${lookup.lead.email}: ${message}`);
      failed += 1;
      if (apply) {
        try {
          await persistMeetingActionLinksForLead(lookup, {}, { syncError: message });
        } catch {
          // best effort
        }
      }
    }
  }

  console.log("---");
  if (apply) {
    console.log(`synced=${synced} failed=${failed} total=${targets.length}`);
  } else {
    console.log(`would_sync=${wouldSync} failed=${failed} total=${targets.length}`);
    console.log("Run with --apply to persist.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
