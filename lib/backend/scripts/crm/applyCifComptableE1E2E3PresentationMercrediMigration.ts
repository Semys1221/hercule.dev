import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917170000_cif_comptable_e1_e2_e3_presentation_mercredi.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
