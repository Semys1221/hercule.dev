import { applyMigrationFiles } from "./migrationUtils";

const MIGRATIONS = [
  "20270424120000_drop_marketing_demandes.sql",
  "20270424120100_decommission_agence_stack.sql",
  "20270424120200_rls_calendly_temporary.sql",
];

applyMigrationFiles(MIGRATIONS).catch((err) => {
  console.error(err);
  process.exit(1);
});
