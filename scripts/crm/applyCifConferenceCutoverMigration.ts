import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917130000_cif_conference_cutover.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
