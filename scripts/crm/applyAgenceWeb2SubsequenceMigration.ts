import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261213150000_agence_web_2_subsequence.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
