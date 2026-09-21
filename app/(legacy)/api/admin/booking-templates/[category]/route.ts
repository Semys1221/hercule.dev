import { NextResponse } from "next/server";
import { z } from "zod";

import {
  followUpRequiresEmptySubject,
} from "@/lib/legacy/booking-communication/sequence-pattern";
import {
  listEnabledVariableTokens,
  validateSequenceCopy,
} from "@/lib/legacy/admin/niches/sequence-variables";
import { syncBookingSequenceToFile } from "@/lib/legacy/legal-documentation/sync-sequences";
import {
  getBookingEmailTemplates,
  upsertBookingEmailTemplates,
} from "@/lib/legacy/booking-communication/template-store";
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/legacy/booking-communication/types";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

const categorySchema = z.enum(["agence", "comptable", "entreprise", "cif"]);

const emailTypeSchema = z.enum(BOOKING_EMAIL_TYPE_VALUES);

const templateSchema = z
  .object({
    email_type: emailTypeSchema,
    subject: z.string(),
    body: z.string().min(1),
  })
  .superRefine((template, ctx) => {
    if (followUpRequiresEmptySubject(template.email_type)) {
      if (template.subject.trim().length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Follow-up emails must have an empty subject",
          path: ["subject"],
        });
      }
      return;
    }
    if (!template.subject.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Root email subject is required",
        path: ["subject"],
      });
    }
  });

const putBodySchema = z.object({
  templates: z.array(templateSchema).min(1),
  sequence_slug: z.string().min(1).optional(),
  sequence_niche: z.enum(["agence", "comptable", "entreprise", "cif"]).optional(),
  sequence_step_meta: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        delay: z.string(),
      }),
    )
    .optional(),
});

function parseCategory(value: string): LeadCategory | null {
  const parsed = categorySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string }> },
) {
  const { category: rawCategory } = await context.params;
  const category = parseCategory(rawCategory);
  if (!category) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const templates = await getBookingEmailTemplates(category);
    return NextResponse.json({ category, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ category: string }> },
) {
  const { category: rawCategory } = await context.params;
  const category = parseCategory(rawCategory);
  if (!category) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const body = (await request.json()) as unknown;
  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const enabledTokens = await listEnabledVariableTokens(category);
    const validation = validateSequenceCopy(
      enabledTokens,
      parsed.data.templates.map((template) => ({
        subject: template.subject,
        body: template.body,
      })),
    );
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: `Variables inconnues : ${validation.unknown.map((key) => `{{${key}}}`).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const templatesPayload = parsed.data.templates as Array<{
      email_type: BookingEmailType;
      subject: string;
      body: string;
    }>;

    if (
      parsed.data.sequence_slug &&
      parsed.data.sequence_niche &&
      parsed.data.sequence_step_meta?.length
    ) {
      syncBookingSequenceToFile({
        niche: parsed.data.sequence_niche,
        slug: parsed.data.sequence_slug,
        emailTypes: templatesPayload.map((row) => row.email_type),
        stepMeta: parsed.data.sequence_step_meta,
        templates: templatesPayload,
      });
    }

    await upsertBookingEmailTemplates(category, templatesPayload);
    const templates = await getBookingEmailTemplates(category);
    return NextResponse.json({ ok: true, category, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
