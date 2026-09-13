import { redirect } from "next/navigation";

import { isNiche, sessionHubHref } from "@/lib/admin/navigation";

export default async function LegacySessionPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    redirect("/internal");
  }
  redirect(sessionHubHref(niche));
}
