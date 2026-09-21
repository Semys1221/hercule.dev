import { applyMigrationFiles } from "./migrationUtils";

const MIGRATIONS = [
  "20260905100000_booking_email_templates.sql",
  "20260906100000_lead_statut_clicked_cancelled.sql",
  "20260906100001_booking_email_h20_cancel.sql",
];

applyMigrationFiles(MIGRATIONS).catch((err) => {
  console.error(err);
  process.exit(1);
});
