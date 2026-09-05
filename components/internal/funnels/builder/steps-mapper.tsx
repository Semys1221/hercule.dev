"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type { FunnelDocument, FunnelScope, FunnelStep } from "@/lib/admin/funnels/schema";

const stepMapSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nom requis"),
        description: z.string().min(1, "Description requise"),
      }),
    )
    .min(1, "Ajoutez au moins une étape"),
});

type StepMapValues = z.infer<typeof stepMapSchema>;

type StepsMapperProps = {
  scope: FunnelScope;
  funnel: FunnelDocument;
  onSaved: (funnel: FunnelDocument) => void;
  onContinue: (firstStepId: string) => void;
};

function makeStepId(): string {
  return `step_${crypto.randomUUID().slice(0, 8)}`;
}

export function StepsMapper({ scope, funnel, onSaved, onContinue }: StepsMapperProps) {
  const form = useForm<StepMapValues>({
    resolver: zodResolver(stepMapSchema),
    defaultValues: {
      steps:
        funnel.steps.length > 0
          ? funnel.steps.map((step) => ({
              id: step.id,
              name: step.name,
              description: step.description,
            }))
          : [{ id: makeStepId(), name: "", description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  async function onSubmit(values: StepMapValues) {
    const mergedSteps: FunnelStep[] = values.steps.map((row, index) => {
      const existing = funnel.steps.find((step) => step.id === row.id);
      return {
        id: row.id,
        order: index,
        name: row.name,
        description: row.description,
        preset: existing?.preset ?? null,
        cursorImpact: existing?.cursorImpact ?? "medium",
        command: existing?.command,
        context: existing?.context,
        question: existing?.question,
        form: existing?.form,
        other: existing?.other,
      };
    });

    const response = await fetch(funnelApiUrl(`/${funnel.slug}`, scope), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: mergedSteps }),
    });
    const body = (await response.json()) as {
      funnel?: FunnelDocument;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.error ?? "Erreur de sauvegarde");
    }
    if (body.funnel) {
      onSaved(body.funnel);
      onContinue(body.funnel.steps[0]?.id ?? values.steps[0].id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mapper les étapes</h2>
        <p className="text-sm text-muted-foreground">
          Définissez le parcours global. Le contenu détaillé vient ensuite.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Étape {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                >
                  −
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
              <FormField
                control={form.control}
                name={`steps.${index}.name`}
                render={({ field: nameField }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...nameField} placeholder="Qualification" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`steps.${index}.description`}
                render={({ field: descriptionField }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...descriptionField}
                        rows={2}
                        placeholder="Objectif de l'étape dans le parcours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: makeStepId(), name: "", description: "" })}
          >
            + Ajouter une étape
          </Button>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Enregistrer et éditer les étapes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
