import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260924100000_campaign_orchestrator_runs.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
