"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
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
  nicheFromPathname,
  sessionHubHref,
  type Niche,
} from "@/lib/admin/navigation";
import { readStoredNiche } from "@/lib/admin/niche-storage";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";
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
  const [niche, setNiche] = useState<Niche>(() => resolveSidebarNiche(pathname));
  const brandMarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNiche(resolveSidebarNiche(pathname));
  }, [pathname]);

  useEffect(() => {
    const root = brandMarkRef.current;
    const svg = root?.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const paths = [...svg.querySelectorAll("path")].map((path, index) => ({
      index,
      fill: getComputedStyle(path).fill,
      className: path.getAttribute("class"),
    }));
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bfa321" },
      body: JSON.stringify({
        sessionId: "bfa321",
        runId: "post-fix",
        hypothesisId: "H1-H3",
        location: "sidebar-nav.tsx:brandMark",
        message: "sidebar brand mark metrics",
        data: {
          svgWidth: rect.width,
          svgHeight: rect.height,
          svgClasses: svg.className,
          containerWidth: root?.getBoundingClientRect().width,
          paths,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

/** @deprecated Use InternalAppSidebar */
export const FunnelAppSidebar = InternalAppSidebar;

/** @deprecated Use InternalAppSidebar */
export const FunnelSidebarNav = InternalAppSidebar;
