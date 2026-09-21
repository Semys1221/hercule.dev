import { notFound } from "next/navigation";

import { isAudience } from "@/lib/legacy/admin/navigation";

export default async function AudienceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ audience: string }>;
}>) {
  const { audience } = await params;
  if (!isAudience(audience)) {
    notFound();
  }

  return children;
}
