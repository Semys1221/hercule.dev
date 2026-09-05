import { notFound } from "next/navigation";

import { FunnelAppSidebar } from "@/components/internal/funnels/sidebar-nav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <FunnelAppSidebar audience={audience} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
