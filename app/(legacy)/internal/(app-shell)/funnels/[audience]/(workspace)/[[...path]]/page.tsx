import { notFound, redirect } from "next/navigation";

import { FunnelHub } from "@/components/legacy/internal/funnels/hub";
import { FunnelLeafContent } from "@/components/legacy/internal/funnels/leaf-content";
import { SalesHubLanding } from "@/components/legacy/internal/funnels/sales/sales-hub-landing";
import { segmentsFromNavPath } from "@/components/legacy/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/legacy/internal/funnels/ui/internal-page-header";
import { emailSequenceHref, emailsHubHref } from "@/lib/legacy/admin/email-sequences/registry";
import { parseWorkspacePath } from "@/lib/legacy/admin/funnels/routing";
import { productPageTitle, CLIENTS_LIST_HREF } from "@/lib/legacy/admin/funnels/ui-copy";
import {
  AUDIENCE_LABELS,
  clientsHubHref,
  getChildren,
  hubTitle,
  isAudience,
  isHub,
  pathToHref,
  sessionHubHref,
} from "@/lib/legacy/admin/navigation";

export default async function FunnelWorkspacePage({
  params,
}: Readonly<{
  params: Promise<{ audience: string; path?: string[] }>;
}>) {
  const { audience, path = [] } = await params;
  if (!isAudience(audience)) {
    notFound();
  }

  if (path[0] === "dashboard") {
    redirect(clientsHubHref(audience));
  }
  if (path[0] === "delivery") {
    redirect(CLIENTS_LIST_HREF);
  }
  if (path[0] === "onboarding") {
    redirect(sessionHubHref(audience));
  }

  const parsed = parseWorkspacePath(audience, path);
  const label = AUDIENCE_LABELS[audience];

  if (parsed.kind === "legacy_email_redirect") {
    redirect(emailSequenceHref(audience, parsed.sequenceSlug));
  }

  if (parsed.kind === "email_sequence_editor") {
    redirect(emailSequenceHref(audience, parsed.sequenceSlug));
  }

  if (parsed.kind === "emails_hub") {
    redirect(emailsHubHref(audience));
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

  const isClientsHub =
    parsed.kind === "leaf" && parsed.leafKey === "clients_hub";
  const mainClassName = isClientsHub
    ? "mx-auto max-w-[1400px] px-6 py-8"
    : "mx-auto max-w-5xl px-6 py-8";

  return (
    <main className={mainClassName}>
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
        />
      )}
    </main>
  );
}
