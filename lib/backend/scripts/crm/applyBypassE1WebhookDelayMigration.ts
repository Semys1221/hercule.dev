import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260925183000_bypass_e1_webhook_delay_ms.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
