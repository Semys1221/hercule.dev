import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919130000_comptable_e2_shorten.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
