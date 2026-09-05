"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

type FunnelLegalDocProps = {
  label: string;
  markdown: string;
};

export function FunnelLegalDoc({ label, markdown }: FunnelLegalDocProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-6">
      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Édition markdown — P2" }}
        preview={{ enabled: true }}
        promote={{ enabled: false, reason: "Non applicable" }}
        delete={{
          enabled: false,
          reason: "Non applicable",
          confirmTitle: `Supprimer « ${label} » ?`,
          confirmDescription: "Non applicable",
        }}
        onPreview={() => setPreviewOpen(true)}
      />

      <p className="text-sm text-muted-foreground">
        Aperçu lecture seule. L&apos;édition écrira dans <code>doc/tech-stack/</code> et
        synchronisera le site (P2).
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>Aperçu plein écran</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto prose prose-neutral max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
