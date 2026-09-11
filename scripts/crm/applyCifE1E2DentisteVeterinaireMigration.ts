import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261031120000_cif_e1_e2_dentiste_veterinaire.sql"]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
