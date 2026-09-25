import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20270424140000_drop_deprecated_niche_tables.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
