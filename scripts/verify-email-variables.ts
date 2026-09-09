import { isNiche, type Niche } from "@/lib/admin/navigation";
import { verifyEmailVariablesForNiche } from "@/lib/admin/niches/verify-email-variables";

function parseNicheArg(): Niche {
  const index = process.argv.indexOf("--niche");
  const value = index >= 0 ? process.argv[index + 1]?.trim() : process.argv[2]?.trim();
  if (!value || !isNiche(value)) {
    console.error("Usage: tsx scripts/verify-email-variables.ts --niche agence|comptable|entreprise");
    process.exit(2);
  }
  return value;
}

async function main() {
  const niche = parseNicheArg();
  const result = await verifyEmailVariablesForNiche(niche);

  console.log(`Niche: ${result.niche}`);
  console.log(`Campaign: ${result.campaignId ?? "non liée"}`);
  console.log(`Rows: ${result.rows.length}`);
  console.log(`Mismatches: ${result.mismatches.length}`);
  console.log(`Cross-niche warnings: ${result.crossNicheWarnings.length}`);

  for (const row of result.rows.filter((entry) => entry.usedInLiveCopy)) {
    console.log(
      `${row.token} — Supabase ${row.supabaseLabel}, Instantly ${row.instantlyLabel} — ${row.status}`,
    );
  }

  if (result.mismatches.length > 0) {
    for (const mismatch of result.mismatches.slice(0, 10)) {
      console.log(
        `  ${mismatch.email}: supabase=[${mismatch.missingSupabase.join(", ")}] instantly=[${mismatch.missingInstantly.join(", ")}]`,
      );
    }
  }

  if (result.hasErrors) {
    process.exit(1);
  }

  console.log("verify-email-variables: OK");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
