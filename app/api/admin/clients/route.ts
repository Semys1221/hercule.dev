import { NextResponse } from "next/server";

import { filterOnboardedRows } from "@/lib/admin/clients/onboarding-gate";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { DashboardFormData } from "@/lib/dashboard/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

export type ClientRow = {
  id: string;
  category: LeadCategory;
  email: string;
  firstName: string | null;
  company: string | null;
  slug: string;
  productStatut: string;
  dashboardLink: string | null;
  onboardingCompletedAt: string;
  form: DashboardFormData;
  retractionStatus: string;
  retractionEndsAt: string | null;
  retractionWaivedAt: string | null;
};

const CATEGORY_VALUES: LeadCategory[] = ["agence", "comptable", "entreprise"];

const SELECT_FIELDS: Record<LeadCategory, string> = {
  agence:
    "id, email, first_name, company, slug, product_statut, dashboard_link, onboarding_completed_at, retraction_status, retraction_ends_at, retraction_waived_at, profile",
  comptable:
    "id, email, first_name, company, slug, product_statut, dashboard_link, onboarding_completed_at, retraction_status, retraction_ends_at, retraction_waived_at, profile",
  entreprise:
    "id, email, first_name, company, slug, product_statut, onboarding_completed_at, profile",
};

function parseCategory(value: string | null): LeadCategory | null {
  if (!value) {
    return "agence";
  }
  return CATEGORY_VALUES.includes(value as LeadCategory)
    ? (value as LeadCategory)
    : null;
}

function mapLeadRow(category: LeadCategory, lead: Record<string, unknown>): ClientRow {
  const profile = (lead.profile ?? {}) as Record<string, unknown>;
  const form = (profile.form ?? {}) as DashboardFormData;

  return {
    id: lead.id as string,
    category,
    email: lead.email as string,
    firstName: (lead.first_name as string | null) ?? null,
    company: (lead.company as string | null) ?? null,
    slug: lead.slug as string,
    productStatut: (lead.product_statut as string | null) ?? "NONE",
    dashboardLink: (lead.dashboard_link as string | null) ?? null,
    onboardingCompletedAt: (lead.onboarding_completed_at as string | null) ?? "",
    form,
    retractionStatus: (lead.retraction_status as string | null) ?? "n_a",
    retractionEndsAt: (lead.retraction_ends_at as string | null) ?? null,
    retractionWaivedAt: (lead.retraction_waived_at as string | null) ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = parseCategory(searchParams.get("category"));
  const all = searchParams.get("all") === "true";

  if (!category) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();

    let query = client.from(category).select(SELECT_FIELDS[category]);

    if (!all) {
      query = query.not("onboarding_completed_at", "is", null);
    }

    const { data: leads, error: leadsError } = await query.order(
      all ? "created_at" : "onboarding_completed_at",
      { ascending: false },
    );

    if (leadsError) {
      throw new Error(`${category} query failed: ${leadsError.message}`);
    }

    const rows = (leads ?? []) as Record<string, unknown>[];
    const filtered = filterOnboardedRows(
      rows.map((lead) => ({
        ...lead,
        onboarding_completed_at: (lead.onboarding_completed_at as string | null) ?? null,
      })),
      all,
    );

    const clients: ClientRow[] = filtered.map((lead) => mapLeadRow(category, lead));

    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "clients fetch failed";
    console.error("[admin/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
