"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Database,
  Globe,
  Home,
  LayoutGrid,
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
import {
  AUDIENCE_LABELS,
  MODULES,
  isAudience,
  pathToHref,
  type Audience,
  type NavNode,
} from "@/lib/admin/navigation";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";
import { cn } from "@/lib/utils";

const GLOBAL_NAV = [
  { href: "/internal/funnels", label: "Accueil", icon: Home, exact: false },
  { href: "/internal/modalites", label: "Modalités", icon: ClipboardCheck, exact: false },
  { href: "/internal/components", label: "Composants", icon: Boxes, exact: false },
  { href: "/internal/database", label: "Database", icon: Database, exact: false },
  { href: "/", label: "Site public", icon: Globe, exact: true },
] as const;

const MODULE_ICONS: Record<string, LucideIcon> = {
  sales: TrendingUp,
  bookings: CalendarCheck,
  clients: Users2,
  legal: Scale,
  emails: Mail,
};

function audienceFromPathname(pathname: string): Audience {
  const funnelMatch = pathname.match(/^\/internal\/funnels\/(agence|entreprise)/);
  if (funnelMatch && isAudience(funnelMatch[1])) {
    return funnelMatch[1];
  }
  const cockpitMatch = pathname.match(/^\/internal\/clients\/(agence|entreprise)/);
  if (cockpitMatch && isAudience(cockpitMatch[1])) {
    return cockpitMatch[1];
  }
  return "agence";
}

function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isPathInBranch(pathname: string, path: string[]): boolean {
  const href = pathToHref(path);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLeafItem({
  href,
  label,
  pathname,
  tooltip,
}: {
  href: string;
  label: string;
  pathname: string;
  tooltip?: string;
}) {
  const active = isPathActive(pathname, href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={tooltip ?? label}>
        <Link href={href}>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavSubLeafItem({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isPathActive(pathname, href);
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active}>
        <Link href={href}>{label}</Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function renderNavNodes(
  pathname: string,
  basePath: string[],
  nodes: Record<string, NavNode>,
): React.ReactNode {
  return Object.entries(nodes).map(([nodeId, node]) => {
    const path = [...basePath, nodeId];
    const href = pathToHref(path);
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    if (!hasChildren) {
      return (
        <NavLeafItem
          key={href}
          href={href}
          label={node.label}
          pathname={pathname}
        />
      );
    }

    const branchOpen = isPathInBranch(pathname, path);

    return (
      <SidebarMenuItem key={href}>
        <Collapsible defaultOpen={branchOpen} className="group/nested">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={node.label}>
              <span>{node.label}</span>
              <ChevronRight
                className={cn(
                  "ml-auto transition-transform duration-200",
                  "group-data-[state=open]/nested:rotate-90",
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {Object.entries(node.children!).map(([childId, child]) => {
                const childPath = [...path, childId];
                const childHref = pathToHref(childPath);
                const childHasChildren =
                  child.children && Object.keys(child.children).length > 0;

                if (!childHasChildren) {
                  return (
                    <NavSubLeafItem
                      key={childHref}
                      href={childHref}
                      label={child.label}
                      pathname={pathname}
                    />
                  );
                }

                const childBranchOpen = isPathInBranch(pathname, childPath);

                return (
                  <SidebarMenuSubItem key={childHref}>
                    <Collapsible
                      defaultOpen={childBranchOpen}
                      className="group/subnested"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton>
                          <span>{child.label}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto size-3 transition-transform duration-200",
                              "group-data-[state=open]/subnested:rotate-90",
                            )}
                          />
                        </SidebarMenuSubButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {Object.entries(child.children!).map(
                            ([grandchildId, grandchild]) => {
                              const grandchildPath = [...childPath, grandchildId];
                              const grandchildHref = pathToHref(grandchildPath);
                              return (
                                <NavSubLeafItem
                                  key={grandchildHref}
                                  href={grandchildHref}
                                  label={grandchild.label}
                                  pathname={pathname}
                                />
                              );
                            },
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  });
}

export function InternalAppSidebar() {
  const pathname = usePathname();
  const audience = audienceFromPathname(pathname);
  const audienceHref = pathToHref([audience]);

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
          <SidebarGroupLabel>
            Parcours · {AUDIENCE_LABELS[audience]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === audienceHref}
                  tooltip="Modules"
                >
                  <Link href={audienceHref}>
                    <LayoutGrid className="size-4" />
                    <span>Modules</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {Object.entries(MODULES).map(([moduleId, module]) => {
                const path = [audience, moduleId];
                const href = pathToHref(path);
                const Icon = MODULE_ICONS[moduleId] ?? LayoutGrid;
                const hasChildren =
                  module.children && Object.keys(module.children).length > 0;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={moduleId}>
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

                const branchOpen = isPathInBranch(pathname, path);

                return (
                  <Collapsible
                    key={moduleId}
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
                          {renderNavNodes(pathname, path, module.children!)}
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
