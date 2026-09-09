import { NextResponse } from "next/server";
import { z } from "zod";

import {
  followUpRequiresEmptySubject,
} from "@/lib/booking-communication/sequence-pattern";
import {
  listEnabledVariableTokens,
  validateSequenceCopy,
} from "@/lib/admin/niches/sequence-variables";
import {
  getBookingEmailTemplates,
  upsertBookingEmailTemplates,
} from "@/lib/booking-communication/template-store";
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/booking-communication/types";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

const categorySchema = z.enum(["agence", "entreprise"]);

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

    await upsertBookingEmailTemplates(
      category,
      parsed.data.templates as Array<{
        email_type: BookingEmailType;
        subject: string;
        body: string;
      }>,
    );
    const templates = await getBookingEmailTemplates(category);
    return NextResponse.json({ ok: true, category, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
