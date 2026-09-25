import { applyMigrationFiles } from "./migrationUtils";

applyMigrationFiles([
  "20270324120000_comptable_delivery_from_jum.sql",
  "20270924120000_comptable_delivery_booking_qualification.sql",
]).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
