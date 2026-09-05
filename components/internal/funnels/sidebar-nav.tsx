"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AUDIENCE_LABELS,
  MODULES,
  pathToHref,
  type Audience,
  type NavNode,
} from "@/lib/admin/navigation";

type FunnelSidebarNavProps = {
  audience: Audience;
};

function NavLink({
  href,
  label,
  active,
  depth = 0,
}: {
  href: string;
  label: string;
  active: boolean;
  depth?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
        active && "bg-muted font-medium text-foreground",
        depth > 0 && "text-muted-foreground",
      )}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      {label}
    </Link>
  );
}

function renderTree(
  pathname: string,
  basePath: string[],
  nodes: Record<string, NavNode>,
  depth = 0,
): React.ReactNode {
  return Object.entries(nodes).map(([nodeId, node]) => {
    const path = [...basePath, nodeId];
    const href = pathToHref(path);
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const hasChildren = node.children && Object.keys(node.children).length > 0;

    return (
      <div key={href} className="space-y-1">
        <NavLink href={href} label={node.label} active={active} depth={depth} />
        {hasChildren
          ? renderTree(pathname, path, node.children!, depth + 1)
          : null}
      </div>
    );
  });
}

export function FunnelSidebarNav({ audience }: FunnelSidebarNavProps) {
  const pathname = usePathname();
  const audienceHref = pathToHref([audience]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-background">
      <div className="border-b p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Funnel Builder
        </p>
        <p className="mt-1 font-medium">{AUDIENCE_LABELS[audience]}</p>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          <NavLink
            href={audienceHref}
            label="Modules"
            active={pathname === audienceHref}
          />
          {renderTree(pathname, [audience], MODULES, 1)}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <Button asChild variant="outline" className="w-full">
          <Link href="/internal/funnels">Accueil</Link>
        </Button>
      </div>
    </aside>
  );
}
