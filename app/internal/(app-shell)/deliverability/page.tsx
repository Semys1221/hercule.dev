import { redirect } from "next/navigation";

import { deliverabilityHref } from "@/lib/admin/navigation";

export default function LegacyDeliverabilityPage() {
  redirect(deliverabilityHref());
}
