import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261101120000_cif_e1_expertise_placement_avoirs.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
