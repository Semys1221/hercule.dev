import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20270424130000_unified_leads_spec.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
