import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260911140000_comptable_e1_e2_urgency.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
