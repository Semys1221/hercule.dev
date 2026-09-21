import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles(["20261213160000_agence_web_2_e1_pipeline_images.sql"]).catch((err) => {
  console.error(err);
  process.exit(1);
});
