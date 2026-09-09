import { applyMigrationFiles } from "./migrationUtils";

const MIGRATION = "20260909120000_deliverability_settings.sql";

applyMigrationFiles([MIGRATION]).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
