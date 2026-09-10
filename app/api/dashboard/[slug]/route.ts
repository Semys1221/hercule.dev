import { NextResponse } from "next/server";

import {
  getAgencePaymentSchedule,
  hasSucceededPayment,
  hasSucceededPaymentComptable,
  getComptablePaymentDetails,
} from "@/lib/dashboard/payments";
import { loadDeliveryContext } from "@/lib/dashboard/load-delivery-context";
import { isFormSparse, resolvePreviewForm } from "@/lib/dashboard/resolve-preview-form";
import { ensureSalesTestSessionLead } from "@/lib/admin/funnels/ensure-sales-test-session";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import {
  createOnboardingClient,
  prefillAgenceFormFromQualification,
} from "@/lib/admin/onboarding/supabase";
import { isLegacyComptableEntrepriseLead } from "@/lib/dashboard/legacy-comptable-entreprise";
import {
  completeBuyerOnboarding,
  waiveRetractionNow,
} from "@/lib/dashboard/onboarding-complete";
import { buildDashboardRetractionFields } from "@/lib/dashboard/retraction-fields";
import type {
  DashboardFaqAudience,
  DashboardFaqItem,
  DashboardFormData,
} from "@/lib/dashboard/types";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import {
  createSalesCallsClient,
  findLatestSalesCallByAgenceId,
} from "@/lib/sales-calls/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

function tieDownAcceptedFromProfile(profile: Record<string, unknown> | null): boolean {
  const closing = (profile?.dashboard ?? {}) as Record<string, unknown>;
  return Boolean(closing.tie_down_accepted);
}

function timelineFromProfile(profile: Record<string, unknown> | null) {
  const display = profile?.display as Record<string, unknown> | undefined;
  const timeline = display?.timeline;
  if (Array.isArray(timeline)) {
    return timeline;
  }
  return [
    { id: "confirmed", label: "Profil confirmé", status: "done" },
    { id: "setup", label: "Mise en place", status: "pending" },
    { id: "preparation", label: "Mise en relation", status: "pending" },
    { id: "delivery", label: "Première demande attribuée", status: "pending" },
  ];
}

function unavailableDashboardResponse(
  lead: LinkTrackingLead,
  audience: DashboardFaqAudience,
) {
  return {
    slug: lead.slug,
    email: lead.email,
    firstName: lead.first_name,
    company: lead.company,
    statut: lead.statut,
    productStatut: "CANCELLED",
    scheduledAt: lead.scheduled_at,
    dashboardLink: dashboardLinkFor(lead),
    timeline: [],
    onboardingCompleted: Boolean(lead.onboarding_completed_at),
    tieDownAccepted: false,
    form: {},
    faq: [],
    isPaid: false,
    audience,
    dashboardMode: "unavailable" as const,
    deliveryPlan: null,
    enterpriseBrief: null,
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    let lookup = await ensureSalesTestSessionLead(client, normalizedSlug);
    if (!lookup) {
      lookup = await findLeadByLink(client, normalizedSlug);
    }
    if (!lookup) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // ── Comptable dashboard (comptable table) ───────────────────────────────
    if (lookup.category === "comptable") {
      const lead = lookup.lead;
      if (lead.product_statut === "CANCELLED") {
        return NextResponse.json(unavailableDashboardResponse(lead, "comptable"));
      }
      const profile = (lead.profile ?? {}) as Record<string, unknown>;
      const profileForm = (profile.form ?? {}) as DashboardFormData;
      const isPaid = await hasSucceededPaymentComptable(client, lead.id, "comptable");
      const paymentDetails = isPaid
        ? await getComptablePaymentDetails(client, lead.id, "comptable")
        : null;
      const isOnboarded = Boolean(lead.onboarding_completed_at);
      const productStatut = lead.product_statut ?? "NONE";
      const { retraction, milestones } = buildDashboardRetractionFields({
        category: "comptable",
        lead,
      });

      const dashboardMode = !isPaid
        ? "comptable_pending"
        : !isOnboarded
          ? "comptable_onboarding"
          : "comptable_active";

      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "c71c85",
        },
        body: JSON.stringify({
          sessionId: "c71c85",
          runId: "pre-fix",
          hypothesisId: "B,C",
          location: "app/api/dashboard/[slug]/route.ts:comptable",
          message: "comptable dashboard GET form state",
          data: {
            slug: lead.slug,
            dashboardMode,
            isPaid,
            isOnboarded,
            profileForm,
            isFormSparse: isFormSparse(profileForm),
            resolvesQualification: false,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      return NextResponse.json({
        slug: lead.slug,
        email: lead.email,
        firstName: lead.first_name,
        company: lead.company,
        statut: lead.statut,
        productStatut,
        scheduledAt: lead.scheduled_at,
        dashboardLink: dashboardLinkFor(lead),
        timeline: milestones,
        milestones,
        onboardingCompleted: isOnboarded,
        tieDownAccepted: tieDownAcceptedFromProfile(profile),
        form: profileForm,
        faq: [],
        isPaid,
        audience: "comptable",
        dashboardMode,
        deliveryPlan: null,
        enterpriseBrief: null,
        retraction,
        comptable: {
          offerType: paymentDetails?.offerType ?? null,
          succeededAt: paymentDetails?.succeededAt ?? null,
        },
      });
    }

    // ── Entreprise dashboard (free buyers) or legacy comptable on entreprise table ───
    if (lookup.category === "entreprise") {
      const lead = lookup.lead;
      const profile = (lead.profile ?? {}) as Record<string, unknown>;

      if (isLegacyComptableEntrepriseLead(lead)) {
        if (lead.product_statut === "CANCELLED") {
          return NextResponse.json(unavailableDashboardResponse(lead, "comptable"));
        }
        const isPaid = await hasSucceededPaymentComptable(client, lead.id, "entreprise");
        const paymentDetails = isPaid
          ? await getComptablePaymentDetails(client, lead.id, "entreprise")
          : null;
        const isOnboarded = Boolean(lead.onboarding_completed_at);
        const productStatut = lead.product_statut ?? "NONE";
        const { retraction, milestones } = buildDashboardRetractionFields({
          category: "comptable",
          lead,
        });

        const dashboardMode = !isPaid
          ? "comptable_pending"
          : !isOnboarded
            ? "comptable_onboarding"
            : "comptable_active";

        return NextResponse.json({
          slug: lead.slug,
          email: lead.email,
          firstName: lead.first_name,
          company: lead.company,
          statut: lead.statut,
          productStatut,
          scheduledAt: lead.scheduled_at,
          dashboardLink: dashboardLinkFor(lead),
          timeline: milestones,
          milestones,
          onboardingCompleted: isOnboarded,
          tieDownAccepted: tieDownAcceptedFromProfile(profile),
          form: (profile.form ?? {}) as DashboardFormData,
          faq: [],
          isPaid,
          audience: "comptable",
          dashboardMode,
          deliveryPlan: null,
          enterpriseBrief: null,
          retraction,
          comptable: {
            offerType: paymentDetails?.offerType ?? null,
            succeededAt: paymentDetails?.succeededAt ?? null,
          },
        });
      }

      return NextResponse.json({
        slug: lead.slug,
        email: lead.email,
        firstName: lead.first_name,
        company: lead.company,
        statut: lead.statut,
        productStatut: "NONE",
        scheduledAt: lead.scheduled_at,
        dashboardLink: dashboardLinkFor(lead),
        timeline: timelineFromProfile(profile),
        onboardingCompleted: false,
        tieDownAccepted: tieDownAcceptedFromProfile(profile),
        form: {},
        faq: [],
        isPaid: false,
        audience: "entreprise",
        dashboardMode: "entreprise_preview",
        deliveryPlan: null,
        enterpriseBrief: null,
      });
    }

    // ── Agence dashboard ─────────────────────────────────────────────────────
    if (lookup.category !== "agence") {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    const lead = lookup.lead;
    if (lead.product_statut === "CANCELLED") {
      return NextResponse.json(unavailableDashboardResponse(lead, "agence"));
    }

    const profile = (lead.profile ?? {}) as Record<string, unknown>;
    const profileForm = (profile.form ?? {}) as DashboardFormData;
    const closing = (profile.dashboard ?? {}) as Record<string, unknown>;
    const isPaid = await hasSucceededPayment(client, lead.id);
    const isOnboarded = Boolean(lead.onboarding_completed_at);

    const dashboardMode = !isPaid
      ? "onboarding_preview"
      : !isOnboarded
        ? "dashboard_state"
        : "dashboard_active";

    let resolvedForm = profileForm;
    if (dashboardMode === "onboarding_preview") {
      const salesClient = createSalesCallsClient();
      const salesCall = await findLatestSalesCallByAgenceId(salesClient, lead.id);
      const qualification = salesCall?.notes?.qualification as
        | Partial<SalesQualificationValues>
        | undefined;

      if (qualification && typeof qualification === "object") {
        resolvedForm = resolvePreviewForm(profileForm, qualification);

        if (isFormSparse(profileForm)) {
          const formPatch = resolvePreviewForm({}, qualification);
          if (!isFormSparse(formPatch)) {
            const onboardingClient = createOnboardingClient();
            prefillAgenceFormFromQualification(onboardingClient, lead.id, formPatch).catch(
              (err: unknown) => {
                console.error(
                  "[dashboard/slug] prefillAgenceForm failed:",
                  err instanceof Error ? err.message : err,
                );
              },
            );
          }
        }
      }
    }

    const rawFaq = Array.isArray(profile.faq) ? profile.faq : [];
    const faq = rawFaq.filter(
      (item): item is DashboardFaqItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as DashboardFaqItem).q === "string" &&
        typeof (item as DashboardFaqItem).a === "string",
    );

    const { deliveryPlan, enterpriseBrief } = await loadDeliveryContext(
      client,
      lead.id,
      isPaid,
    );

    const deliveryComplete = Boolean(
      deliveryPlan &&
        deliveryPlan.attributionsTotal > 0 &&
        deliveryPlan.attributionsUsed >= deliveryPlan.attributionsTotal,
    );
    const paymentSchedule = isPaid
      ? await getAgencePaymentSchedule(client, lead.id, deliveryComplete)
      : null;

    const productStatut = lead.product_statut ?? "NONE";
    const { retraction, milestones } = isOnboarded
      ? buildDashboardRetractionFields({
          category: "agence",
          lead,
          isFastCheckout: paymentSchedule?.isFastCheckout ?? false,
        })
      : { retraction: null, milestones: [] as ReturnType<typeof buildDashboardRetractionFields>["milestones"] };

    const timeline =
      milestones.length > 0 ? milestones : timelineFromProfile(profile);

    return NextResponse.json({
      slug: lead.slug,
      email: lead.email,
      firstName: lead.first_name,
      company: lead.company,
      statut: lead.statut,
      productStatut,
      scheduledAt: lead.scheduled_at,
      dashboardLink: dashboardLinkFor(lead),
      timeline,
      milestones,
      onboardingCompleted: isOnboarded,
      tieDownAccepted: Boolean(closing.tie_down_accepted),
      form: resolvedForm,
      faq,
      isPaid,
      audience: "agence",
      dashboardMode,
      deliveryPlan,
      enterpriseBrief,
      offerType: paymentSchedule?.offerType ?? null,
      paymentSchedule,
      retraction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard fetch failed";
    console.error("[dashboard/slug]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, normalizedSlug);
    if (!lookup) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    const lead = lookup.lead;
    const category = lookup.category;

    const isComptableBuyer =
      category === "comptable" ||
      (category === "entreprise" && isLegacyComptableEntrepriseLead(lead));

    if (isComptableBuyer) {
      const table = category === "comptable" ? "comptable" : "entreprise";
      const paymentCategory = category === "comptable" ? "comptable" : "entreprise";

      if (body.waiveRetraction === true && !body.completeOnboarding) {
        const waiver = await waiveRetractionNow({
          client,
          category: "comptable",
          leadId: lead.id,
          slug: normalizedSlug,
          currentStatus: lead.retraction_status,
          onboardingCompletedAt: lead.onboarding_completed_at,
        });
        if (!waiver.ok) {
          return NextResponse.json(
            { error: waiver.error },
            { status: waiver.status ?? 400 },
          );
        }
        return NextResponse.json({ ok: true });
      }

      if (body.completeOnboarding === true) {
        const isPaid = await hasSucceededPaymentComptable(client, lead.id, paymentCategory);
        if (!isPaid) {
          return NextResponse.json(
            { error: "Payment required to complete onboarding" },
            { status: 403 },
          );
        }

        const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
        const dashboardMeta = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };

        if (body.cgvVersion && typeof body.cgvVersion === "string") {
          dashboardMeta.cvg_version = body.cgvVersion;
          dashboardMeta.cvg_accepted_at = new Date().toISOString();
        }

        profile.dashboard = dashboardMeta;

        await completeBuyerOnboarding({
          client,
          category: "comptable",
          leadId: lead.id,
          slug: normalizedSlug,
          profile,
          waiveRetraction: body.waiveRetraction === true,
        });

        return NextResponse.json({ ok: true });
      }

      if (body.tieDownAccepted === true) {
        const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
        const dashboardMeta = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };
        dashboardMeta.tie_down_accepted = true;
        dashboardMeta.tie_down_accepted_at = new Date().toISOString();
        profile.dashboard = dashboardMeta;

        const { error } = await client.from(table).update({ profile }).eq("id", lead.id);
        if (error) {
          throw new Error(error.message);
        }

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: "Unsupported update" }, { status: 400 });
    }

    if (category === "entreprise") {
      if (body.tieDownAccepted !== true) {
        return NextResponse.json({ error: "Unsupported update" }, { status: 400 });
      }

      const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
      const dashboardMeta = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };
      dashboardMeta.tie_down_accepted = true;
      dashboardMeta.tie_down_accepted_at = new Date().toISOString();
      profile.dashboard = dashboardMeta;

      const { error } = await client.from("entreprise").update({ profile }).eq("id", lead.id);
      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ ok: true });
    }

    if (category !== "agence") {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    if (body.waiveRetraction === true && !body.completeOnboarding) {
      const waiver = await waiveRetractionNow({
        client,
        category: "agence",
        leadId: lead.id,
        slug: normalizedSlug,
        currentStatus: lead.retraction_status,
        onboardingCompletedAt: lead.onboarding_completed_at,
      });
      if (!waiver.ok) {
        return NextResponse.json({ error: waiver.error }, { status: waiver.status ?? 400 });
      }
      return NextResponse.json({ ok: true });
    }

    const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
    const dashboardMeta = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };

    if (body.form && typeof body.form === "object") {
      profile.form = {
        ...((profile.form ?? {}) as Record<string, unknown>),
        ...(body.form as Record<string, unknown>),
      };
    }

    if (body.tieDownAccepted === true) {
      dashboardMeta.tie_down_accepted = true;
      dashboardMeta.tie_down_accepted_at = new Date().toISOString();
    }

    if (body.cgvVersion && typeof body.cgvVersion === "string") {
      dashboardMeta.cvg_version = body.cgvVersion;
      dashboardMeta.cvg_accepted_at = new Date().toISOString();
    }

    profile.dashboard = dashboardMeta;

    if (body.completeOnboarding === true) {
      const isPaid = await hasSucceededPayment(client, lead.id);
      if (!isPaid) {
        return NextResponse.json(
          { error: "Payment required to complete onboarding" },
          { status: 403 },
        );
      }

      await completeBuyerOnboarding({
        client,
        category: "agence",
        leadId: lead.id,
        slug: normalizedSlug,
        profile,
        waiveRetraction: body.waiveRetraction === true,
      });

      return NextResponse.json({ ok: true });
    }

    const { error } = await client.from("agence").update({ profile }).eq("id", lead.id);
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard update failed";
    console.error("[dashboard/slug]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
