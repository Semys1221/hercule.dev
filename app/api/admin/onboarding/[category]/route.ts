import { NextResponse } from "next/server";
import { z } from "zod";

import { isAudience } from "@/lib/admin/navigation";
import {
  createOnboardingFiche,
  DuplicateEmailError,
  OnboardingInsertError,
} from "@/lib/admin/onboarding";

const agenceSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  company: z.string().min(1),
  besoin: z.string().min(1),
  specialites: z.array(z.string()).optional().default([]),
  taille_equipe: z.string().optional().default(""),
  budget: z.string().optional().default(""),
  droit_retractation: z.boolean().optional().default(false),
});

const entrepriseSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  company: z.string().min(1),
  besoin: z.string().min(1),
  budget: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  taille: z.string().optional().default(""),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ category: string }> },
) {
  const { category } = await context.params;
  if (!isAudience(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed =
    category === "agence"
      ? agenceSchema.safeParse(raw)
      : entrepriseSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const formFields: Record<string, unknown> = {
    besoin: data.besoin.trim(),
    company: data.company.trim(),
  };

  if (category === "agence") {
    const agenceData = data as z.infer<typeof agenceSchema>;
    formFields.specialites = agenceData.specialites;
    formFields.taille_equipe = agenceData.taille_equipe.trim();
    formFields.budget = agenceData.budget.trim();
    formFields.droit_retractation = agenceData.droit_retractation;
  } else {
    const entrepriseData = data as z.infer<typeof entrepriseSchema>;
    formFields.budget = entrepriseData.budget.trim();
    formFields.zone = entrepriseData.zone.trim();
    formFields.taille = entrepriseData.taille.trim();
  }

  try {
    const row = await createOnboardingFiche({
      category,
      email: data.email,
      firstName: data.first_name,
      company: data.company,
      formFields,
    });
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof OnboardingInsertError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
