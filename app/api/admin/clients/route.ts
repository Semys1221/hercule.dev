import { NextResponse } from "next/server";

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
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") ?? "agence") as LeadCategory;
  const all = searchParams.get("all") === "true";

  try {
    const client = createLinkTrackingClient();

    if (category === "entreprise") {
      const { data: leads, error: leadsError } = await client
        .from("entreprise")
        .select(
          "id, email, first_name, company, slug, product_statut, onboarding_completed_at, profile",
        )
        .order("created_at", { ascending: false });

      if (leadsError) {
        throw new Error(`entreprise query failed: ${leadsError.message}`);
      }

      const clients: ClientRow[] = (leads ?? []).map((lead) => {
        const profile = (lead.profile ?? {}) as Record<string, unknown>;
        const form = (profile.form ?? {}) as DashboardFormData;
        return {
          id: lead.id as string,
          category: "entreprise",
          email: lead.email as string,
          firstName: (lead.first_name as string | null) ?? null,
          company: (lead.company as string | null) ?? null,
          slug: lead.slug as string,
          productStatut: (lead.product_statut as string | null) ?? "NONE",
          dashboardLink: null,
          onboardingCompletedAt: (lead.onboarding_completed_at as string | null) ?? "",
          form,
        };
      });

      return NextResponse.json({ clients });
    }

    let query = client
      .from("agence")
      .select(
        "id, email, first_name, company, slug, product_statut, dashboard_link, onboarding_completed_at, profile",
      );

    if (!all) {
      query = query.not("onboarding_completed_at", "is", null);
    }

    const { data: leads, error: leadsError } = await query.order(
      all ? "created_at" : "onboarding_completed_at",
      { ascending: false },
    );

    if (leadsError) {
      throw new Error(`agence query failed: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    const clients: ClientRow[] = leads.map((lead) => {
      const profile = (lead.profile ?? {}) as Record<string, unknown>;
      const form = (profile.form ?? {}) as DashboardFormData;

      return {
        id: lead.id as string,
        category: "agence",
        email: lead.email as string,
        firstName: (lead.first_name as string | null) ?? null,
        company: (lead.company as string | null) ?? null,
        slug: lead.slug as string,
        productStatut: (lead.product_statut as string | null) ?? "NONE",
        dashboardLink: (lead.dashboard_link as string | null) ?? null,
        onboardingCompletedAt: (lead.onboarding_completed_at as string | null) ?? "",
        form,
      };
    });

    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "clients fetch failed";
    console.error("[admin/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
