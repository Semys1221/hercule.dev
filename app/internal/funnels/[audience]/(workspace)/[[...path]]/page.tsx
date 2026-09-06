import { notFound, redirect } from "next/navigation";

import { EmailSequenceEditor } from "@/components/internal/funnels/email-sequence-editor";
import { EmailSequencesTable } from "@/components/internal/funnels/email-sequences-table";
import { FunnelHub } from "@/components/internal/funnels/hub";
import { FunnelLeafContent } from "@/components/internal/funnels/leaf-content";
import { SalesHubLanding } from "@/components/internal/funnels/sales/sales-hub-landing";
import { segmentsFromNavPath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { emailSequenceHref } from "@/lib/admin/email-sequences/registry";
import { parseWorkspacePath } from "@/lib/admin/funnels/routing";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";
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

  if (parsed.kind === "legacy_email_redirect") {
    redirect(emailSequenceHref(audience, parsed.sequenceSlug));
  }

  if (parsed.kind === "emails_hub") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromNavPath(parsed.navPath)}
        />
        <EmailSequencesTable audience={audience} />
      </main>
    );
  }

  if (parsed.kind === "email_sequence_editor") {
    const crumbPath = [...parsed.navPath, parsed.sequenceSlug];
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromNavPath(crumbPath)}
        />
        <EmailSequenceEditor audience={audience} sequenceSlug={parsed.sequenceSlug} />
      </main>
    );
  }

  if (parsed.kind === "hub" && parsed.navPath[1] === "sales") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromNavPath(parsed.navPath)}
        />
        <SalesHubLanding audience={audience} />
      </main>
    );
  }

  if (parsed.kind === "hub") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
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
        title={productPageTitle(label)}
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
