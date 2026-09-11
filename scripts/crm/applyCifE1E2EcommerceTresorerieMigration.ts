import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261030120000_cif_e1_e2_ecommerce_tresorerie.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
