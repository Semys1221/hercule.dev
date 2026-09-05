import { DefaultSplitLayout } from "@/components/funnels/layouts/default-split";
import { FaqWidgetStack } from "@/components/funnels/widgets/faq-widget-stack";
import { PricingWidget } from "@/components/funnels/widgets/pricing-widget";
import { FormStepPreview } from "@/components/funnels/presets/form-step";
import { QuestionStepPreview } from "@/components/funnels/presets/question-step";
import { PreviewFrame } from "@/components/internal/funnels/builder/preview-frame";
import type { LayoutCatalogEntry } from "@/lib/admin/funnels/catalog-types";
import type { StepComponents, StepPreset } from "@/lib/admin/funnels/schema";
import type { FaqAudience } from "@/lib/site/faq-types";

type LayoutPreviewProps = {
  layout: LayoutCatalogEntry;
};

export function LayoutPreview({ layout }: LayoutPreviewProps) {
  return (
    <PreviewFrame label={layout.label}>
      <DefaultSplitLayout title="Exemple d'étape" stepLabel="Étape 1 sur 3" progress={33}>
        <p className="text-sm text-muted-foreground">
          Contenu centré dans la carte, style projet par défaut.
        </p>
      </DefaultSplitLayout>
    </PreviewFrame>
  );
}

type PresetPreviewProps = {
  preset: StepPreset;
  prompt?: string;
  answers?: string[];
  fieldLabels?: string[];
  audience?: FaqAudience;
  components?: StepComponents;
};

function StepWidgetsPreview({
  audience,
  components,
}: {
  audience: FaqAudience;
  components?: StepComponents;
}) {
  if (!components?.faq?.length && !components?.pricing) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {components.faq && components.faq.length > 0 && (
        <FaqWidgetStack audience={audience} configs={components.faq} compact />
      )}
      {components.pricing && (
        <PricingWidget audience={audience} config={components.pricing} compact />
      )}
    </div>
  );
}

export function PresetPreview({
  preset,
  prompt,
  answers,
  fieldLabels,
  audience = "agence",
  components,
}: PresetPreviewProps) {
  if (preset === "other") {
    return (
      <PreviewFrame label="Custom component">
        <DefaultSplitLayout title="Composant custom" stepLabel="Étape 2 sur 4" progress={50}>
          <p className="text-sm text-muted-foreground">
            Brief décrit dans le ticket JSON — implémenté par Cursor.
          </p>
          <StepWidgetsPreview audience={audience} components={components} />
        </DefaultSplitLayout>
      </PreviewFrame>
    );
  }

  const inner =
    preset === "question" ? (
      <QuestionStepPreview prompt={prompt} answers={answers} />
    ) : (
      <FormStepPreview
        fields={fieldLabels?.map((label) => ({ label, required: label === "Prénom" || label === "Email" }))}
      />
    );

  return (
    <PreviewFrame label={preset}>
      <DefaultSplitLayout title="Aperçu preset" stepLabel="Étape 1 sur 3" progress={33}>
        {inner}
        <StepWidgetsPreview audience={audience} components={components} />
      </DefaultSplitLayout>
    </PreviewFrame>
  );
}
