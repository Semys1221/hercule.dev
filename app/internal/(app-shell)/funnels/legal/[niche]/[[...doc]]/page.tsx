import { notFound } from "next/navigation";

import Link from "next/link";

import { FaqManagementShell } from "@/components/internal/funnels/faq-management-shell";
import { FunnelLegalDoc } from "@/components/internal/funnels/legal-doc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";
import { PricingEditor } from "@/components/internal/funnels/pricing-editor";
import { segmentsFromModulePath } from "@/components/internal/funnels/ui/breadcrumb-segments";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { getLegalMarkdownForLeaf } from "@/lib/admin/legal-preview";
import {
  isLegalDocSegment,
  isNiche,
  legalHref,
  MODULES,
  NICHE_LABELS,
  type LegalDocSegment,
} from "@/lib/admin/navigation";
import { productPageTitle } from "@/lib/admin/funnels/ui-copy";

const LEGAL_LEAF_BY_DOC: Record<LegalDocSegment, string> = {
  cgv: "legal_cgv",
  mentions: "legal_mentions",
  confidentialite: "legal_confidentialite",
  faq: "legal_faq",
  pricing: "legal_pricing",
};

export default async function LegalNichePage({
  params,
}: Readonly<{
  params: Promise<{ niche: string; doc?: string[] }>;
}>) {
  const { niche, doc = [] } = await params;
  if (!isNiche(niche)) {
    notFound();
  }

  const label = NICHE_LABELS[niche];
  const docSegment = doc[0];

  if (!docSegment) {
    const children = MODULES.legal.children ?? {};
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromModulePath("legal", niche)}
        />
        <div className="mb-6">
          <NicheSwitcher />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Choisissez un document</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(children).map(([docId, node]) => (
              <Card key={docId}>
                <CardHeader>
                  <CardTitle>{node.label}</CardTitle>
                  {node.caption ? <CardDescription>{node.caption}</CardDescription> : null}
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={legalHref(niche, docId as LegalDocSegment)}>
                      Ouvrir {node.label}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!isLegalDocSegment(docSegment)) {
    notFound();
  }

  const leafKey = LEGAL_LEAF_BY_DOC[docSegment];

  if (docSegment === "faq") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromModulePath("legal", niche, docSegment)}
        />
        <div className="mb-6">
          <NicheSwitcher />
        </div>
        <FaqManagementShell audience={niche} />
      </main>
    );
  }

  if (docSegment === "pricing") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InternalPageHeader
          title={productPageTitle(label)}
          segments={segmentsFromModulePath("legal", niche, docSegment)}
        />
        <div className="mb-6">
          <NicheSwitcher />
        </div>
        <PricingEditor audience={niche} />
      </main>
    );
  }

  const legal = getLegalMarkdownForLeaf(niche, leafKey);
  if (!legal) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <InternalPageHeader
        title={productPageTitle(label)}
        segments={segmentsFromModulePath("legal", niche, docSegment)}
      />
      <div className="mb-6">
        <NicheSwitcher />
      </div>
      <FunnelLegalDoc
        audience={niche}
        docType={legal.docType}
        label={legal.label}
      />
    </main>
  );
}
