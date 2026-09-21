import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917180000_comptable_e1_remove_eligibility_2.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
