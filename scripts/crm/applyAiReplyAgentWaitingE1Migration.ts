import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260918143000_ai_reply_agent_waiting_e1.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
