import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919193000_comptable_e1_restaurants_turnover.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
