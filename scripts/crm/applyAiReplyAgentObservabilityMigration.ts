import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917140000_ai_reply_agent_observability.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
