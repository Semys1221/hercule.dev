import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { pathToHref, type NavNode } from "@/lib/admin/navigation";

type FunnelHubProps = {
  title: string;
  path: string[];
  childrenNodes: Record<string, NavNode>;
};

export function FunnelHub({ title, path, childrenNodes }: FunnelHubProps) {
  const items = Object.entries(childrenNodes);

  if (items.length === 0) {
    return (
      <FunnelPlaceholder title="Section vide" detail="Aucune section disponible." />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([nodeId, node]) => (
          <Card key={nodeId}>
            <CardHeader>
              <CardTitle>{node.label}</CardTitle>
              {node.caption ? <CardDescription>{node.caption}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={pathToHref([...path, nodeId])}>Ouvrir {node.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
