/**
 * Send free_trial_1 now and schedule free_trial_2 at J+2 for each recipient.
 *
 *   pnpm launch-free-trial-pitch
 *   pnpm launch-free-trial-pitch -- email@example.com
 */

import { ensureComptablePitchLead } from "@/lib/legacy/free-trial-sequence/ensure-pitch-lead";
import { startFreeTrialSequence } from "@/lib/legacy/free-trial-sequence/orchestrator";

const DEFAULT_RECIPIENTS = [
  "frank.adebiaye@cabinet-adebiaye.com",
  "ludovic.demimuid@eeconseils.fr",
  "leonardo@cabinet-entrepreneurs.fr",
  "contact@return-invest.com",
] as const;

function parseRecipients(): string[] {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  if (args.length === 0) {
    return [...DEFAULT_RECIPIENTS];
  }
  return args.map((e) => e.trim().toLowerCase()).filter(Boolean);
}

async function main(): Promise<void> {
  const recipients = parseRecipients();
  const startsAt = new Date();

  console.log(`Launching free-trial pitch for ${recipients.length} recipient(s)…\n`);

  for (const email of recipients) {
    try {
      const { lead, created } = await ensureComptablePitchLead({ email });
      const result = await startFreeTrialSequence({
        leadId: lead.id,
        startsAt,
      });

      const followUpAt = new Date(startsAt.getTime() + 2 * 24 * 60 * 60 * 1000);

      console.log(
        [
          email,
          `lead=${lead.id}`,
          created ? "created" : "existing",
          result.pitchSent ? "E1=sent" : `E1=FAIL(${result.pitchError ?? "?"})`,
          `E2@J+2=${followUpAt.toISOString()}`,
          `jobs=${result.scheduledJobs}`,
        ].join(" | "),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${email} | ERROR ${message}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
