import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261118120000_jum_niche.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
