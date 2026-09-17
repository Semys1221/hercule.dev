import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917150000_cif_conference_link_backfill.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
