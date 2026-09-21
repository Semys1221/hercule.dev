import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261025120000_comptable_remove_site_links.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
