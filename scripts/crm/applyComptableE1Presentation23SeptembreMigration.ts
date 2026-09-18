import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles([
  "20260918150000_comptable_e1_presentation_23_septembre.sql",
]).catch((err) => {
  console.error(err);
  process.exit(1);
});
