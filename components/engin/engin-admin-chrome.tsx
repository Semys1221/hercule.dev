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

export function EnginAdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clientDetailMatch = pathname.match(/^\/admin\/clients\/([^/]+)$/);
  const clientId = clientDetailMatch?.[1];

  if (typeof window === "undefined") {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "cfad7b",
      },
      body: JSON.stringify({
        sessionId: "cfad7b",
        runId: "hydrate",
        hypothesisId: "D",
        location: "engin-admin-chrome.tsx:ssr",
        message: "admin chrome ssr",
        data: { pathname, hasClientBreadcrumb: Boolean(clientId) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <HerculeMark className="size-8 text-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight">Engin</h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
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
      </header>
      {children}
    </div>
  );
}
