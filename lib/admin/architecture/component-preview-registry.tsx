"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { OnboardingFormFields } from "@/components/dashboard/onboarding-form-fields";
import { FormStepPreview } from "@/components/funnels/presets/form-step";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getComponentsRegistry } from "@/lib/admin/architecture/components-registry";
import type { ComponentEntry } from "@/lib/admin/architecture/types";
import type { DashboardData } from "@/lib/dashboard/types";

export type PreviewKind = "live" | "stub" | "unavailable";

export const MOCK_DASHBOARD_DATA: DashboardData = {
  slug: "preview-demo",
  email: "demo@agence.fr",
  firstName: "Marie",
  company: "Studio Demo",
  statut: "PAID",
  productStatut: "IN_DELIVERANCE",
  scheduledAt: null,
  dashboardLink: "/dashboard/preview-demo",
  timeline: [],
  onboardingCompleted: false,
  tieDownAccepted: false,
  form: {
    specialites: ["SEO", "Paid"],
    zone: "IDF",
    capacite: 2,
    budgetMinPonctuel: 1500,
    budgetMinMensuel: 2000,
  },
  faq: [],
  isPaid: true,
  dashboardMode: "dashboard_state",
};

const LIVE_PREVIEW_IDS = new Set(["dashboard-onboarding-form"]);

const STUB_PREVIEW_IDS = new Set([
  "fiche-form",
  "funnel-editor",
  "mockup-editor",
  "faq-editor",
  "pricing-editor",
  "legal-doc",
  "agence-carousel",
  "sequence-editor",
  "mkt-home",
  "mkt-entreprise",
  "mkt-faq",
  "mkt-cvg",
  "int-home",
  "int-funnels",
  "int-components",
  "int-database",
  "onboarding-client-form",
]);

function isTsxComponent(entry: ComponentEntry) {
  return entry.kind === "component" && entry.route.endsWith(".tsx");
}

export function getPreviewableComponents(): ComponentEntry[] {
  return getComponentsRegistry().filter(
    (entry) => entry.status === "built" && isTsxComponent(entry),
  );
}

export function getFormComponents(): ComponentEntry[] {
  return getComponentsRegistry().filter((entry) => {
    if (entry.kind !== "component") return false;
    if (entry.id === "dashboard-onboarding-form" || entry.id === "fiche-form") {
      return true;
    }
    if (entry.id === "onboarding-client-form") return true;
    if (entry.domain === "onboarding_funnel" && entry.id.includes("form")) {
      return true;
    }
    return entry.name.toLowerCase().includes("form");
  });
}

export function getPreviewKind(entry: ComponentEntry): PreviewKind {
  if (LIVE_PREVIEW_IDS.has(entry.id)) return "live";
  if (entry.status === "built" && isTsxComponent(entry) && STUB_PREVIEW_IDS.has(entry.id)) {
    return "stub";
  }
  if (entry.status === "built" && isTsxComponent(entry)) return "stub";
  return "unavailable";
}

export function hasPreview(entry: ComponentEntry): boolean {
  return getPreviewKind(entry) !== "unavailable";
}

function EditorStubPreview({
  title,
  description,
  fields,
}: {
  title: string;
  description: string;
  fields: string[];
}) {
  return (
    <div className="flex flex-col gap-4 p-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-3 opacity-60">
        {fields.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <Label className="text-xs">{field}</Label>
            {field.toLowerCase().includes("markdown") ||
            field.toLowerCase().includes("contenu") ? (
              <Textarea disabled placeholder={field} className="min-h-20 resize-none" />
            ) : (
              <Input disabled placeholder={field} />
            )}
          </div>
        ))}
      </div>
      <Badge variant="secondary" className="w-fit">
        Stub — éditeur admin
      </Badge>
    </div>
  );
}

const PAGE_HREF_BY_ID: Partial<Record<string, string>> = {
  "mkt-home": "/",
  "mkt-entreprise": "/entreprise",
  "mkt-faq": "/faq",
  "mkt-cvg": "/cvg",
  "int-home": "/internal",
  "int-funnels": "/internal/funnels",
  "int-components": "/internal/components",
  "int-database": "/internal/database",
};

function PageStubPreview({ entry }: { entry: ComponentEntry }) {
  const href = PAGE_HREF_BY_ID[entry.id] ?? null;

  return (
    <div className="flex flex-col gap-3 p-2">
      <p className="text-sm font-medium">{entry.name}</p>
      <p className="text-sm text-muted-foreground">
        Surface {entry.domain.replace("_", " ")} — aperçu statique.
      </p>
      <code className="block rounded-md border bg-background px-3 py-2 text-xs">
        {entry.route}
      </code>
      {href ? (
        <Link
          href={href}
          className="text-sm text-primary underline underline-offset-2"
          target="_blank"
        >
          Ouvrir la page
        </Link>
      ) : null}
      <Badge variant="secondary" className="w-fit">
        Stub — page
      </Badge>
    </div>
  );
}

function renderStubPreview(entry: ComponentEntry): ReactNode {
  switch (entry.id) {
    case "dashboard-onboarding-form":
      return (
        <OnboardingFormFields
          mode="preview"
          data={MOCK_DASHBOARD_DATA}
          idPrefix="preview-of"
        />
      );
    case "fiche-form":
      return (
        <EditorStubPreview
          title="Fiche onboarding admin"
          description="Formulaire agence / entreprise — création lead + slug."
          fields={[
            "Email",
            "Prénom",
            "Société",
            "Besoin",
            "Spécialités",
            "Budget",
            "Zone",
          ]}
        />
      );
    case "funnel-editor":
      return (
        <EditorStubPreview
          title="Funnel editor"
          description="Édition des étapes, layouts et presets funnel."
          fields={["Titre étape", "Preset", "Layout", "Composants"]}
        />
      );
    case "mockup-editor":
      return (
        <EditorStubPreview
          title="Mockup editor"
          description="Édition des demandes carousel agence."
          fields={["Titre", "Visibilité", "Origine", "Teaser"]}
        />
      );
    case "faq-editor":
      return (
        <EditorStubPreview
          title="FAQ editor"
          description="Édition markdown FAQ par audience."
          fields={["Question", "Réponse markdown"]}
        />
      );
    case "pricing-editor":
      return (
        <EditorStubPreview
          title="Pricing editor"
          description="Édition markdown tarifs."
          fields={["Contenu markdown pricing"]}
        />
      );
    case "legal-doc":
      return (
        <EditorStubPreview
          title="Legal doc editor"
          description="CGV, mentions légales, confidentialité."
          fields={["Contenu markdown legal"]}
        />
      );
    case "agence-carousel":
      return (
        <div className="flex flex-col gap-3 p-2">
          <p className="text-sm font-medium">Carousel demandes agence</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Demande A", "Demande B", "Demande C"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-dashed bg-background p-4 text-center text-xs text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
          <Badge variant="secondary" className="w-fit">
            Stub — carousel
          </Badge>
        </div>
      );
    case "sequence-editor":
      return (
        <EditorStubPreview
          title="Sequence dropdown"
          description="Éditeur séquences email (booking, bypass, reply agent)."
          fields={["Step label", "Delay", "Template", "Variables"]}
        />
      );
    case "onboarding-client-form":
      return (
        <FormStepPreview
          fields={[
            { label: "Spécialités", required: true },
            { label: "Zone", required: true },
            { label: "Capacité", required: false },
          ]}
        />
      );
    case "mkt-home":
    case "mkt-entreprise":
    case "mkt-faq":
    case "mkt-cvg":
    case "int-home":
    case "int-funnels":
    case "int-components":
    case "int-database":
      return <PageStubPreview entry={entry} />;
    default:
      return (
        <div className="flex flex-col gap-2 p-2">
          <p className="text-sm font-medium">{entry.name}</p>
          <code className="block rounded-md border bg-background px-3 py-2 text-xs">
            {entry.route}
          </code>
          <Badge variant="secondary" className="w-fit">
            Stub
          </Badge>
        </div>
      );
  }
}

export function renderPreview(entry: ComponentEntry): ReactNode {
  const kind = getPreviewKind(entry);

  if (kind === "live") {
    if (entry.id === "dashboard-onboarding-form") {
      return (
        <OnboardingFormFields
          mode="preview"
          data={MOCK_DASHBOARD_DATA}
          idPrefix="preview-of"
        />
      );
    }
  }

  if (kind === "stub") {
    return renderStubPreview(entry);
  }

  return null;
}

export function getPreviewLabel(entry: ComponentEntry): string {
  const kind = getPreviewKind(entry);
  if (kind === "live") return "Live";
  if (kind === "stub") return "Stub";
  return "—";
}
