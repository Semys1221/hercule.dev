---
name: hercule-forms
description: >-
  Hercule.dev form patterns — react-hook-form, Zod, shadcn Field/FieldGroup,
  internal admin forms, validation, and API submit. Use when building or editing
  forms under components/internal, app/dashboard, or app/internal.
---

# Hercule Forms

Form conventions for Hercule Next.js surfaces. Read [hercule-ui](../hercule-ui/SKILL.md) for tokens and attach the **react-hook-form** skill for RHF + Zod primitives.

## Stack

| Piece | Value |
|-------|-------|
| State | `react-hook-form` + `zodResolver` |
| Schema | Zod in colocated `schema.ts` or inline `z.object` |
| Layout | shadcn `FieldGroup` + `Field` + `FieldLabel` + `FieldError` |
| Primitives | `Input`, `Textarea`, `Checkbox`, `Select`, `ToggleGroup` from `@/components/ui/*` |
| Feedback | `InternalStatusAlert`, `toast()` from `sonner` / `@/hooks/use-toast` |

## Preferred pattern (new forms)

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email(),
  company: z.string().min(1),
});

export function ExampleForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", company: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
```

## Internal admin shell

Wrap multi-section forms in full `Card` structure:

- `CardHeader` / `CardTitle` / `CardDescription`
- `CardContent` with `flex flex-col gap-4` (not `space-y-*`)
- Optional `InternalResourceToolbar` above the card for preview JSON / promote actions

Reference: [`components/internal/funnels/fiche-form.tsx`](../../components/internal/funnels/fiche-form.tsx) — toolbar + Card + conditional audience fields. **Migrate** legacy `Label`/`space-y` blocks to `FieldGroup` when touching the file.

## Option sets (2–7 choices)

Use `ToggleGroup` + `ToggleGroupItem`, not manual active `Button` state.

## Checkboxes

`Checkbox` + `Label` with shared `htmlFor` / `id`, or `Field` wrapper with `data-invalid` on validation errors.

## Server submit

```tsx
const response = await fetch("/api/admin/...", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(values),
});
const body = (await response.json()) as { error?: string };
if (!response.ok) throw new Error(body.error ?? "Erreur");
```

Surface errors with `InternalStatusAlert variant="error"` or `toast({ variant: "destructive", ... })`.

## Accessibility

- Every control has a visible or `sr-only` label.
- `aria-invalid` on the control when invalid; `data-invalid` on `Field`.
- Dialog forms: `DialogTitle` required (`sr-only` if hidden).

## Quality gate

```bash
pnpm doctor
```

shadcn MCP: search `form` / `field` examples before inventing layout.

## Cross-links

- [hercule-ui](../hercule-ui/SKILL.md) — tokens, motion
- [hercule-nextjs-internal](../hercule-nextjs-internal/SKILL.md) — `/api/admin/*` routes
- [hercule-tables](../hercule-tables/SKILL.md) — list views after form create
