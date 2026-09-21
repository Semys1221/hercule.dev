import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260919194500_comptable_e1_restaurants_rentabilite.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
