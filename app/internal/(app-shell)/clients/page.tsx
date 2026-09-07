import { redirect } from "next/navigation";

import { CLIENTS_LIST_HREF } from "@/lib/admin/funnels/ui-copy";

export default function ClientsPage() {
  redirect(CLIENTS_LIST_HREF);
}
