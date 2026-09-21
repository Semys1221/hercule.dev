/**
 * Backfill email_sequence_recipients from existing pipeline and booking jobs.
 *
 *   pnpm exec tsx --env-file=.env ./scripts/crm/backfillEmailSequenceRecipients.ts
 *   pnpm exec tsx --env-file=.env ./scripts/crm/backfillEmailSequenceRecipients.ts -- --dry-run
 */

import { backfillAllNiches } from "@/lib/legacy/admin/management/recipients/sync";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const results = await backfillAllNiches(dryRun);

  for (const [niche, result] of Object.entries(results)) {
    console.log(
      `${niche}: inserted=${result.inserted} updated=${result.updated} skipped=${result.skipped}${dryRun ? " (dry-run)" : ""}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
