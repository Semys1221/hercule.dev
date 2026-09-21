import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260922120000_h48_confirm_contiendront_copy.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
