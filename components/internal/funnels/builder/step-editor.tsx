"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CursorImpactField } from "@/components/internal/funnels/builder/cursor-impact-field";
import { PresetPreview } from "@/components/internal/funnels/builder/preview-registry";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import { buildStepContext } from "@/lib/admin/funnels/context";
import type { FunnelCatalog } from "@/lib/admin/funnels/catalog";
import {
  defaultFormFields,
  type FunnelDocument,
  type FunnelScope,
  type FunnelStep,
  type StepPreset,
} from "@/lib/admin/funnels/schema";

const stepEditorSchema = z
  .object({
    preset: z.enum(["question", "form", "other"]),
    cursorImpact: z.enum(["light", "medium", "high"]),
    command: z.string().optional(),
    prompt: z.string().optional(),
    answers: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    fields: z
      .array(
        z.object({
          id: z.enum([
            "firstName",
            "lastName",
            "email",
            "phone",
            "company",
            "role",
            "message",
          ]),
          enabled: z.boolean(),
          required: z.boolean(),
        }),
      )
      .optional(),
    intent: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.preset === "question") {
      if (!values.prompt?.trim()) {
        ctx.addIssue({ code: "custom", message: "Question requise", path: ["prompt"] });
      }
      if (!values.answers || values.answers.filter((a) => a.label.trim()).length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Au moins une réponse",
          path: ["answers"],
        });
      }
    }
    if (values.preset === "other" && !values.intent?.trim()) {
      ctx.addIssue({ code: "custom", message: "Description requise", path: ["intent"] });
    }
  });

type StepEditorValues = z.infer<typeof stepEditorSchema>;

type StepEditorProps = {
  scope: FunnelScope;
  funnel: FunnelDocument;
  catalog: FunnelCatalog;
  step: FunnelStep;
  stepIndex: number;
  onSaved: (funnel: FunnelDocument) => void;
  onSelectStep: (stepId: string) => void;
};

function defaultValuesForStep(step: FunnelStep): StepEditorValues {
  return {
    preset: step.preset ?? "question",
    cursorImpact: step.cursorImpact ?? "medium",
    command: step.command ?? "",
    prompt: step.question?.prompt ?? "",
    answers:
      step.question?.answers ??
      [
        { id: "ans_1", label: "" },
        { id: "ans_2", label: "" },
      ],
    fields: step.form?.fields ?? defaultFormFields(),
    intent: step.other?.intent ?? "",
  };
}

function buildCommand(values: StepEditorValues, step: FunnelStep): string {
  if (values.preset === "question") {
    return [
      `Step: ${step.name}`,
      `Question: ${values.prompt ?? ""}`,
      `Answers: ${(values.answers ?? []).map((a) => a.label).filter(Boolean).join(" | ")}`,
    ].join("\n");
  }
  if (values.preset === "form") {
    const enabled = (values.fields ?? []).filter((field) => field.enabled);
    return [
      `Step: ${step.name}`,
      `Form fields: ${enabled.map((field) => `${field.id}${field.required ? "*" : ""}`).join(", ")}`,
    ].join("\n");
  }
  return values.intent ?? "";
}

export function StepEditor({
  scope,
  funnel,
  catalog,
  step,
  stepIndex,
  onSaved,
  onSelectStep,
}: StepEditorProps) {
  const form = useForm<StepEditorValues>({
    resolver: zodResolver(stepEditorSchema),
    defaultValues: defaultValuesForStep(step),
  });

  useEffect(() => {
    form.reset(defaultValuesForStep(step));
  }, [step, form]);

  const preset = form.watch("preset");
  const prompt = form.watch("prompt");
  const answers = form.watch("answers");
  const fields = form.watch("fields");

  const { fields: answerFields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  const fieldLabels = useMemo(() => {
    return (fields ?? [])
      .filter((field) => field.enabled)
      .map((field) => catalog.formFieldCatalog.find((item) => item.id === field.id)?.label ?? field.id);
  }, [fields, catalog.formFieldCatalog]);

  async function onSubmit(values: StepEditorValues) {
    const context = buildStepContext({
      scope,
      layoutId: funnel.layoutId,
      steps: funnel.steps,
      currentStepId: step.id,
    });

    const cleanedAnswers = (values.answers ?? [])
      .filter((answer) => answer.label.trim())
      .map((answer, index) => ({
        id: answer.id || `ans_${index + 1}`,
        label: answer.label.trim(),
      }));

    const updatedStep: FunnelStep = {
      ...step,
      preset: values.preset,
      cursorImpact: values.cursorImpact,
      command: buildCommand(values, step),
      context,
      question:
        values.preset === "question"
          ? {
              prompt: values.prompt?.trim() ?? "",
              answers: cleanedAnswers,
              selection: "multiple",
            }
          : undefined,
      form:
        values.preset === "form"
          ? {
              fields: values.fields ?? defaultFormFields(),
            }
          : undefined,
      other:
        values.preset === "other"
          ? {
              intent: values.intent?.trim() ?? "",
            }
          : undefined,
    };

    const steps = funnel.steps.map((item) => (item.id === step.id ? updatedStep : item));

    const response = await fetch(funnelApiUrl(`/${funnel.slug}`, scope), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    const body = (await response.json()) as {
      funnel?: FunnelDocument;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.error ?? "Erreur de sauvegarde");
    }

    if (values.preset === "other") {
      await fetch("/api/admin/funnels/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: scope.audience,
          kind: scope.kind,
          stage: scope.stage,
          funnelSlug: funnel.slug,
          ticketKind: "component",
          componentPath: null,
          command: [
            `Step: ${step.name}`,
            `Description: ${step.description}`,
            values.intent?.trim() ?? "",
          ].join("\n"),
          cursorImpact: values.cursorImpact,
        }),
      });
    }

    if (body.funnel) {
      onSaved(body.funnel);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Étape {stepIndex + 1} — {step.name}
          </h2>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
        <Select value={step.id} onValueChange={onSelectStep}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Choisir une étape" />
          </SelectTrigger>
          <SelectContent>
            {funnel.steps.map((item, index) => (
              <SelectItem key={item.id} value={item.id}>
                {index + 1}. {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="preset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preset</FormLabel>
                  <Select value={field.value} onValueChange={(value) => field.onChange(value as StepPreset)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {catalog.presets.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {preset === "question" ? (
              <>
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Réponses (max 6)</FormLabel>
                  {answerFields.map((answerField, index) => (
                    <FormField
                      key={answerField.id}
                      control={form.control}
                      name={`answers.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder={`Réponse ${index + 1}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={answerFields.length >= 6}
                      onClick={() => append({ id: `ans_${answerFields.length + 1}`, label: "" })}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={answerFields.length <= 1}
                      onClick={() => remove(answerFields.length - 1)}
                    >
                      −
                    </Button>
                  </div>
                </div>
              </>
            ) : null}

            {preset === "form" ? (
              <div className="space-y-3 rounded-lg border p-4">
                <FormLabel>Champs du formulaire</FormLabel>
                {(fields ?? []).map((fieldConfig, index) => (
                  <div key={fieldConfig.id} className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={fieldConfig.enabled}
                        onCheckedChange={(checked) => {
                          const next = [...(fields ?? [])];
                          next[index] = {
                            ...next[index],
                            enabled: checked === true,
                          };
                          form.setValue("fields", next);
                        }}
                      />
                      {catalog.formFieldCatalog.find((item) => item.id === fieldConfig.id)?.label}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Requis
                      <Checkbox
                        checked={fieldConfig.required}
                        disabled={!fieldConfig.enabled}
                        onCheckedChange={(checked) => {
                          const next = [...(fields ?? [])];
                          next[index] = {
                            ...next[index],
                            required: checked === true,
                          };
                          form.setValue("fields", next);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            ) : null}

            {preset === "other" ? (
              <FormField
                control={form.control}
                name="intent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description du composant</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="cursorImpact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cursor impact</FormLabel>
                  <FormControl>
                    <CursorImpactField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              Enregistrer l&apos;étape
            </Button>
          </div>

          <PresetPreview
            preset={preset}
            prompt={prompt}
            answers={(answers ?? []).map((answer) => answer.label).filter(Boolean)}
            fieldLabels={fieldLabels}
          />
        </form>
      </Form>
    </div>
  );
}
