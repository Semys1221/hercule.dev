/**
 * Backfill email_sequence_recipients from existing pipeline and booking jobs.
 *
 *   pnpm exec tsx --env-file=.env ./scripts/crm/backfillEmailSequenceRecipients.ts
 *   pnpm exec tsx --env-file=.env ./scripts/crm/backfillEmailSequenceRecipients.ts -- --dry-run
 */

import { backfillRecipientsForNiche } from "@/lib/admin/management/recipients/sync";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const niches = ["comptable", "cif"] as const;

  for (const niche of niches) {
    const result = await backfillRecipientsForNiche(niche, dryRun);
    console.log(`${niche}: inserted=${result.inserted} skipped=${result.skipped}${dryRun ? " (dry-run)" : ""}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
