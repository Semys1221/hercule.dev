import { notFound } from "next/navigation";

import { FunnelSidebarNav } from "@/components/internal/funnels/sidebar-nav";
import { isAudience } from "@/lib/admin/navigation";

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

  return (
    <div className="flex min-h-screen">
      <FunnelSidebarNav audience={audience} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
