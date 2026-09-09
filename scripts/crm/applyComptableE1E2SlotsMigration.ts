import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261023120000_comptable_e1_e2_slots.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
