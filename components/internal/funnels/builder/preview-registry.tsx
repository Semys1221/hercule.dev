import { DefaultSplitLayout } from "@/components/funnels/layouts/default-split";
import { FormStepPreview } from "@/components/funnels/presets/form-step";
import { QuestionStepPreview } from "@/components/funnels/presets/question-step";
import { PreviewFrame } from "@/components/internal/funnels/builder/preview-frame";
import type { LayoutCatalogEntry } from "@/lib/admin/funnels/catalog";
import type { StepPreset } from "@/lib/admin/funnels/schema";

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
};

export function PresetPreview({
  preset,
  prompt,
  answers,
  fieldLabels,
}: PresetPreviewProps) {
  if (preset === "other") {
    return (
      <PreviewFrame label="Custom component">
        <DefaultSplitLayout title="Composant custom" stepLabel="Étape 2 sur 4" progress={50}>
          <p className="text-sm text-muted-foreground">
            Brief décrit dans le ticket JSON — implémenté par Cursor.
          </p>
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
      </DefaultSplitLayout>
    </PreviewFrame>
  );
}
