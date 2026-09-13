import { redirect } from "next/navigation";

import { bookingsSequencesHref, isNiche } from "@/lib/admin/navigation";

export default async function LegalNicheRedirectPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string; doc?: string[] }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    redirect("/internal/funnels/bookings/agence?tab=sequences");
  }
  redirect(bookingsSequencesHref(niche));
}
