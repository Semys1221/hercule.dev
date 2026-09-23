"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HerculeMark } from "@/components/hercule-mark";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/conference", label: "Conférence" },
  { href: "/admin/communication", label: "Communication" },
] as const;

const COMMUNICATION_CRUMBS: { prefix: string; label: string }[] = [
  { prefix: "/admin/communication/sequences", label: "Séquences" },
  { prefix: "/admin/communication/notifications", label: "Notifications" },
  { prefix: "/admin/communication/clients", label: "Inbox" },
];

function communicationLeafLabel(pathname: string): string | null {
  const match = COMMUNICATION_CRUMBS.find((item) => pathname.startsWith(item.prefix));
  return match?.label ?? null;
}

export function EnginAdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clientDetailMatch = pathname.match(/^\/admin\/clients\/([^/]+)$/);
  const clientId = clientDetailMatch?.[1];
  const isCommunication = pathname.startsWith("/admin/communication");
  const communicationLeaf = isCommunication ? communicationLeafLabel(pathname) : null;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen flex-col gap-6 px-6 py-10",
        isCommunication ? "max-w-[1600px]" : "max-w-7xl",
      )}
    >
      <header className="flex shrink-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <HerculeMark className="size-8 text-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight">Engin</h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Engin">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin" || Boolean(clientId)
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {clientId ? (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Clients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Fiche client</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}
        {communicationLeaf ? (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/communication/sequences">Communication</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{communicationLeaf}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", isCommunication && "min-h-[calc(100vh-14rem)]")}>
        {children}
      </div>
    </div>
  );
}
