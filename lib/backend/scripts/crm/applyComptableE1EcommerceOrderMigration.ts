import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261027120000_comptable_e1_ecommerce_order.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
