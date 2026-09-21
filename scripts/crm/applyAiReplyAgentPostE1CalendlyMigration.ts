import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20260921120000_ai_reply_agent_post_e1_calendly_status.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
