"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  LayoutDashboard,
  Network,
  TrendingUp,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { HerculeMark } from "@/components/hercule-mark";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  MODULES,
  bookingsHref,
  clientsHubHref,
  managementHref,
  nicheFromPathname,
  saasClientsHref,
  saasInboxQueueHref,
  saasPoolHref,
  saasRouterHref,
  sessionHubHref,
  type Niche,
} from "@/lib/legacy/admin/navigation";
import { readStoredNiche } from "@/lib/legacy/admin/niche-storage";
import { ADMIN_ROOT_LABEL } from "@/lib/legacy/admin/funnels/ui-copy";
import { useEffect, useRef, useState } from "react";

const PARCOURS_MODULES: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  href: (niche: Niche) => string;
}> = [
  {
    id: "session",
    label: MODULES.sales.label,
    icon: TrendingUp,
    href: sessionHubHref,
  },
  {
    id: "bookings",
    label: MODULES.bookings.label,
    icon: CalendarCheck,
    href: bookingsHref,
  },
  {
    id: "clients",
    label: MODULES.clients.label,
    icon: Users2,
    href: clientsHubHref,
  },
  {
    id: "management",
    label: MODULES.management.label,
    icon: LayoutDashboard,
    href: managementHref,
  },
];

const SAAS_MODULES: Array<{
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { id: "saas-clients", label: "Clients", href: saasClientsHref(), icon: Users2 },
  {
    id: "saas-inbox",
    label: "Inbox queue",
    href: saasInboxQueueHref(),
    icon: LayoutDashboard,
  },
  { id: "saas-pool", label: "Pool", href: saasPoolHref(), icon: Network },
  { id: "saas-router", label: "Router", href: saasRouterHref(), icon: TrendingUp },
];

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveSidebarNiche(pathname: string): Niche {
  const fromPath = nicheFromPathname(pathname);
  if (fromPath !== "agence" || pathname.includes("/agence")) {
    return fromPath;
  }
  return readStoredNiche() ?? fromPath;
}

export function InternalAppSidebar() {
  const pathname = usePathname();
  const [niche, setNiche] = useState<Niche>(() => {
    const fromPath = nicheFromPathname(pathname);
    const storedNiche = readStoredNiche();
    const resolved = resolveSidebarNiche(pathname);
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "68fd40" },
      body: JSON.stringify({
        sessionId: "68fd40",
        runId: "pre-fix",
        hypothesisId: "H1-H3",
        location: "sidebar-nav.tsx:useState-init",
        message: "sidebar niche init",
        data: {
          pathname,
          fromPath,
          storedNiche,
          resolved,
          isServer: typeof window === "undefined",
          pathIncludesAgence: pathname.includes("/agence"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return resolved;
  });
  const brandMarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromPath = nicheFromPathname(pathname);
    const storedNiche = readStoredNiche();
    const resolved = resolveSidebarNiche(pathname);
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "68fd40" },
      body: JSON.stringify({
        sessionId: "68fd40",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "sidebar-nav.tsx:useEffect-pathname",
        message: "sidebar niche effect",
        data: { pathname, fromPath, storedNiche, resolved, currentNiche: niche },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setNiche(resolved);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={ADMIN_ROOT_LABEL}>
              <div
                ref={brandMarkRef}
                className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card"
              >
                <HerculeMark variant="mono" className="size-4 text-foreground" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Hercule</span>
                <span className="truncate text-xs text-muted-foreground">{ADMIN_ROOT_LABEL}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PARCOURS_MODULES.map((module) => {
                const href = module.href(niche);
                // #region agent log
                if (module.id === "session") {
                  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "68fd40" },
                    body: JSON.stringify({
                      sessionId: "68fd40",
                      runId: "pre-fix",
                      hypothesisId: "H1",
                      location: "sidebar-nav.tsx:render",
                      message: "sidebar href render",
                      data: { pathname, niche, href, isServer: typeof window === "undefined" },
                      timestamp: Date.now(),
                    }),
                  }).catch(() => {});
                }
                // #endregion
                const Icon = module.icon;
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isPathActive(pathname, href)}
                      tooltip={module.label}
                    >
                      <Link href={href}>
                        <Icon className="size-4" />
                        <span>{module.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>SaaS autonome</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SAAS_MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isPathActive(pathname, module.href)}
                      tooltip={module.label}
                    >
                      <Link href={module.href}>
                        <Icon className="size-4" />
                        <span>{module.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

/** @deprecated Use InternalAppSidebar */
export const FunnelAppSidebar = InternalAppSidebar;

/** @deprecated Use InternalAppSidebar */
export const FunnelSidebarNav = InternalAppSidebar;
