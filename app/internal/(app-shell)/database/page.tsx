import { redirect } from "next/navigation";

import { databaseHref } from "@/lib/admin/navigation";

export default function LegacyDatabasePage() {
  redirect(databaseHref());
}
