import { notFound } from "next/navigation";

import { ClientsShell } from "@/components/internal/clients/clients-shell";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  ACCOUNTS_MODULE_CAPTION,
  ACCOUNTS_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { isNiche, NICHE_LABELS } from "@/lib/admin/navigation";

export default async function ComptesPage({
  params,
}: Readonly<{
  params: Promise<{ niche: string }>;
}>) {
  const { niche } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  const label = NICHE_LABELS[niche];

  return (
    <InternalPageShell>
      <InternalPageHeader
        title={ACCOUNTS_MODULE_LABEL}
        description={`${ACCOUNTS_MODULE_CAPTION} — ${label}.`}
        segments={segmentsFromModulePath("clients", niche)}
      />
      <ClientsShell niche={niche} />
    </InternalPageShell>
  );
}
