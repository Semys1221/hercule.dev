import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919120000_comptable_e1_btp.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
