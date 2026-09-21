import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919190000_comptable_e1_restaurants.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
