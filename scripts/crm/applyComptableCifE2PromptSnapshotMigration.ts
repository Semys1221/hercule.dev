import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260920154000_comptable_cif_e2_prompt_snapshot.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
