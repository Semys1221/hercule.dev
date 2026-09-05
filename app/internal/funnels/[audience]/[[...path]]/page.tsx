import { notFound } from "next/navigation";

import { FunnelHub } from "@/components/internal/funnels/hub";
import { FunnelLeafContent } from "@/components/internal/funnels/leaf-content";
import { segmentsFromNavPath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { parseWorkspacePath } from "@/lib/admin/funnels/routing";
import {
  AUDIENCE_LABELS,
  getChildren,
  hubTitle,
  isAudience,
  isHub,
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

  const parsed = parseWorkspacePath(audience, path);
  const label = AUDIENCE_LABELS[audience];

  if (parsed.kind === "hub") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={`Funnels — ${label}`}
          segments={segmentsFromNavPath(parsed.navPath)}
        />
        <FunnelHub
          title={hubTitle(parsed.navPath)}
          path={parsed.navPath}
          childrenNodes={getChildren(parsed.navPath)}
        />
      </main>
    );
  }

  const crumbPath =
    parsed.kind === "funnel_editor"
      ? [...parsed.navPath, parsed.funnelSlug]
      : parsed.navPath;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <InternalPageHeader
        title={`Funnels — ${label}`}
        segments={segmentsFromNavPath(crumbPath)}
      />

      {isHub(parsed.navPath) ? (
        <FunnelHub
          title={hubTitle(parsed.navPath)}
          path={parsed.navPath}
          childrenNodes={getChildren(parsed.navPath)}
        />
      ) : (
        <FunnelLeafContent
          audience={audience}
          leafKey={parsed.leafKey}
          navPath={parsed.navPath}
          funnelSlug={parsed.kind === "funnel_editor" ? parsed.funnelSlug : null}
        />
      )}
    </main>
  );
}
