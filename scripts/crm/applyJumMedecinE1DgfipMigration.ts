import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260920120000_jum_medecin_e1_dgfip.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
