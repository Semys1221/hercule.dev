import { redirect } from "next/navigation";

import { bookingsSequencesHref, isNiche } from "@/lib/admin/navigation";

export default async function EmailsNicheRedirectPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ niche: string; slug?: string[] }>;
  searchParams: Promise<{ sequence?: string }>;
}>) {
  const { niche, slug = [] } = await params;
  const { sequence: sequenceFromQuery } = await searchParams;
  const resolvedNiche = isNiche(niche) ? niche : "agence";
  const sequenceSlug = sequenceFromQuery ?? slug[0];
  const base = bookingsSequencesHref(resolvedNiche);
  if (sequenceSlug) {
    redirect(`${base}&sequence=${encodeURIComponent(sequenceSlug)}`);
  }
  redirect(base);
}
