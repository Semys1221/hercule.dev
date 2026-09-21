import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919210000_jum_dentiste_e1_dgfip.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
