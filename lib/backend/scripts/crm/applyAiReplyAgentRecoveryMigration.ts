import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260917160000_ai_reply_agent_recovery.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
