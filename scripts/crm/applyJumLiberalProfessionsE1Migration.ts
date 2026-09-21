import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260920140000_jum_liberal_professions_e1.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
