import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260920150000_comptable_cif_ias_e1_oct02_attributions.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
