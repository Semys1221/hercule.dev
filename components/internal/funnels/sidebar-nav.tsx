"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Rocket,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  pathToHref,
  type Audience,
  type NavNode,
} from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

type FunnelAppSidebarProps = {
  audience: Audience;
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  sales: TrendingUp,
  onboarding: Rocket,
  dashboard: LayoutDashboard,
  legal: Scale,
  emails: Mail,
};

function isPathActive(pathname: string, href: string): boolean {
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

export function FunnelAppSidebar({ audience }: FunnelAppSidebarProps) {
  const pathname = usePathname();
  const audienceHref = pathToHref([audience]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Funnel Builder">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutGrid className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Funnel Builder</span>
                <span className="truncate text-xs text-muted-foreground">
                  {AUDIENCE_LABELS[audience]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {Object.entries(MODULES).map(([moduleId, module]) => {
          const path = [audience, moduleId];
          const href = pathToHref(path);
          const Icon = MODULE_ICONS[moduleId] ?? LayoutGrid;
          const hasChildren =
            module.children && Object.keys(module.children).length > 0;

          if (!hasChildren) {
            return (
              <SidebarGroup key={moduleId}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
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
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          const branchOpen = isPathInBranch(pathname, path);

          return (
            <Collapsible
              key={moduleId}
              defaultOpen={branchOpen}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger
                    className="flex w-full cursor-pointer items-center gap-2 [&>svg]:size-4"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{module.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200",
                        "group-data-[state=open]/collapsible:rotate-180",
                      )}
                    />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {renderNavNodes(pathname, path, module.children!)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Accueil">
              <Link href="/internal/funnels">
                <Home className="size-4" />
                <span>Accueil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/** @deprecated Use FunnelAppSidebar */
export const FunnelSidebarNav = FunnelAppSidebar;
