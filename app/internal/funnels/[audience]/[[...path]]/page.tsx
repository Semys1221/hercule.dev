import { notFound } from "next/navigation";

import { FunnelHub } from "@/components/internal/funnels/hub";
import { FunnelLeafContent } from "@/components/internal/funnels/leaf-content";
import {
  AUDIENCE_LABELS,
  breadcrumb,
  getChildren,
  hubTitle,
  isAudience,
  isHub,
  leafKey,
  normalizePath,
} from "@/lib/admin/navigation";

export default async function FunnelWorkspacePage({
  params,
}: Readonly<{
  params: Promise<{ audience: string; path?: string[] }>;
}>) {
  const { audience, path = [] } = await params;
  if (!isAudience(audience)) {
    notFound();
  }

  const fullPath = normalizePath([audience, ...path]);
  const label = AUDIENCE_LABELS[audience];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Funnels — {label}</h1>
        <p className="text-sm text-muted-foreground">{breadcrumb(fullPath)}</p>
      </div>

      {isHub(fullPath) ? (
        <FunnelHub
          title={hubTitle(fullPath)}
          path={fullPath}
          childrenNodes={getChildren(fullPath)}
        />
      ) : (
        <FunnelLeafContent audience={audience} leafKey={leafKey(fullPath) ?? ""} />
      )}
    </main>
  );
}
