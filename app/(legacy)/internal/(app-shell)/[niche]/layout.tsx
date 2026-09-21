import { notFound } from "next/navigation";

import { isNiche } from "@/lib/legacy/admin/navigation";

export default async function NicheLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  return children;
}
