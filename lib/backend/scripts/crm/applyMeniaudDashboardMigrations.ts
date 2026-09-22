/**
 * Apply Supabase migrations required for Meniaud client dashboard:
 * - payments.stripe_subscription_id
 * - clients.first_lead_at + calendly_scheduling_url + RR columns
 *
 * Usage: pnpm apply-meniaud-dashboard-migrations
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyViaManagementApi,
  isBenignAlreadyExists,
  loadEnvFiles,
} from "./migrationUtils";

const MIGRATIONS = [
  "20261016120000_payments_stripe_subscription_id.sql",
  "20261224120000_clients_round_robin.sql",
];

async function applyFile(filename: string) {
  const sqlPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../lib/backend/supabase/migrations",
    filename,
  );
  const query = readFileSync(sqlPath, "utf8");
  console.log(`Applying ${filename}...`);
  try {
    await applyViaManagementApi(query);
  } catch (err) {
    if (!isBenignAlreadyExists(err)) {
      throw err;
    }
    console.log(`  ${filename}: objects already present.`);
  }
}

async function main() {
  loadEnvFiles();
  for (const file of MIGRATIONS) {
    await applyFile(file);
  }
  console.log("Meniaud dashboard migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
