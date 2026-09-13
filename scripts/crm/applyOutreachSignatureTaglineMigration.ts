import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261213140000_outreach_signature_tagline.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
