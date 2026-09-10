import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261024120000_comptable_e1_copy_demande_link.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
