import { applyMigrationFiles } from "./migrationUtils";

const MIGRATION = "20261301000000_client_inbox_gmail.sql";

applyMigrationFiles([MIGRATION]).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
