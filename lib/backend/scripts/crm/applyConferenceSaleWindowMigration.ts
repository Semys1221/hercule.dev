import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyViaManagementApi,
  isBenignAlreadyExists,
  loadEnvFiles,
} from "./migrationUtils";

const FILE =
  "20261223120000_conference_sale_window_client_appointments.sql";

async function main() {
  loadEnvFiles();
  const sqlPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../lib/backend/supabase/migrations",
    FILE,
  );
  const query = readFileSync(sqlPath, "utf8");
  console.log(`Applying ${FILE}...`);
  try {
    await applyViaManagementApi(query);
  } catch (err) {
    if (!isBenignAlreadyExists(err)) {
      throw err;
    }
    console.log("Migration objects already present.");
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
