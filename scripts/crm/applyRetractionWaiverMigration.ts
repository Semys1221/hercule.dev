import { applyMigrationFiles } from "./migrationUtils";

const MIGRATION = "20260909150000_retraction_waiver.sql";

applyMigrationFiles([MIGRATION]).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
