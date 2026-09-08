"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  Globe,
  Home,
  Mail,
  Scale,
  TrendingUp,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { HerculeMark } from "@/components/hercule-mark";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import {
  MODULES,
  bookingsHref,
  clientsHubHref,
  emailsHref,
  legalHref,
  nicheFromPathname,
  sessionHubHref,
  type LegalDocSegment,
  type Niche,
} from "@/lib/admin/navigation";
import { readStoredNiche } from "@/lib/admin/niche-storage";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const GLOBAL_NAV = [
  { href: "/internal/funnels", label: "Accueil", icon: Home, exact: false },
  { href: "/internal/modalites", label: "Modalités", icon: ClipboardCheck, exact: false },
  { href: "/", label: "Site public", icon: Globe, exact: true },
] as const;

const PARCOURS_MODULES: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  href: (niche: Niche) => string;
  children?: Array<{ id: LegalDocSegment; label: string }>;
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
    id: "legal",
    label: MODULES.legal.label,
    icon: Scale,
    href: legalHref,
    children: [
      { id: "cgv", label: "CGV" },
      { id: "mentions", label: "Mentions légales" },
      { id: "confidentialite", label: "Confidentialité" },
      { id: "faq", label: "FAQ" },
      { id: "pricing", label: "Pricing" },
    ],
  },
  {
    id: "emails",
    label: MODULES.emails.label,
    icon: Mail,
    href: emailsHref,
  },
];

function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }
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

  useEffect(() => {
    setNiche(resolveSidebarNiche(pathname));
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={ADMIN_ROOT_LABEL}>
              <HerculeMark variant="dual" className="size-5 shrink-0 text-foreground" />
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
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {GLOBAL_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(pathname, item.href, item.exact)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Parcours</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 pb-3">
              <NicheSwitcher className="w-full justify-start" />
            </div>
            <SidebarMenu>
              {PARCOURS_MODULES.map((module) => {
                const href = module.href(niche);
                const Icon = module.icon;
                const hasChildren = Boolean(module.children?.length);

                if (!hasChildren) {
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
                }

                const branchOpen = isPathActive(pathname, href);

                return (
                  <Collapsible
                    key={module.id}
                    defaultOpen={branchOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={module.label}>
                          <Icon className="size-4" />
                          <span>{module.label}</span>
                          <ChevronDown
                            className={cn(
                              "ml-auto size-4 transition-transform duration-200",
                              "group-data-[state=open]/collapsible:rotate-180",
                            )}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {module.children!.map((child) => {
                            const childHref = legalHref(niche, child.id);
                            return (
                              <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isPathActive(pathname, childHref)}
                                >
                                  <Link href={childHref}>{child.label}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
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
