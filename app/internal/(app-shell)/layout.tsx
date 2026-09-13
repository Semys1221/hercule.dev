import { InternalAppSidebar } from "@/components/internal/funnels/sidebar-nav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function InternalAppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider className="overflow-x-hidden">
      <InternalAppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
