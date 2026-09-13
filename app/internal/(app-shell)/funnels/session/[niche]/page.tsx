import { notFound } from "next/navigation";

import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { SalesHubLanding } from "@/components/internal/funnels/sales/sales-hub-landing";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { isNiche, MODULES, NICHE_LABELS } from "@/lib/admin/navigation";

export default async function SessionNichePage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "dca28f" },
    body: JSON.stringify({
      sessionId: "dca28f",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "session/[niche]/page.tsx:render",
      message: "Session page rendering hub",
      data: { niche, isValidNiche: isNiche(niche) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!isNiche(niche)) {
    notFound();
  }

  const label = NICHE_LABELS[niche];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <InternalPageHeader
        title={MODULES.sales.label}
        description={`Hub admin et session client pour ${label}.`}
        segments={segmentsFromModulePath("session", niche)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <SalesHubLanding audience={niche} />
    </main>
  );
}
