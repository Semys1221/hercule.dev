import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261026120000_comptable_e1_eligibility_minimum_2.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
