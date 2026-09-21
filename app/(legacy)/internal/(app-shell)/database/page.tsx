import { redirect } from "next/navigation";

import { databaseHref } from "@/lib/legacy/admin/navigation";

export default function LegacyDatabasePage() {
  redirect(databaseHref());
}
