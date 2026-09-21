import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260920153000_comptable_cif_ias_e2_oct02_attributions.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
