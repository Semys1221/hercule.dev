import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20270324120000_comptable_delivery_from_jum.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
