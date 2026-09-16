/** Dev-only helpers for the agence Revente pipeline wizard (internal session). */

export const PIPELINE_DEV_QUERY_FLAG = "dev";
export const PIPELINE_DEV_SKIP_QUERY_FLAG = "dev_skip";

export function isPipelineDevModeAllowed(
  hostname: string,
  search: string | URLSearchParams,
): boolean {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;

  if (
    params.get(PIPELINE_DEV_QUERY_FLAG) === "1" ||
    params.get("pipeline_dev") === "1"
  ) {
    return true;
  }

  const host = hostname.trim().toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  );
}

export function shouldAutoSkipPipelineWizard(
  hostname: string,
  search: string | URLSearchParams,
): boolean {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  return (
    isPipelineDevModeAllowed(hostname, params) &&
    params.get(PIPELINE_DEV_SKIP_QUERY_FLAG) === "1"
  );
}

export function buildPipelineDevQualification(
  partial: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    company_name: "Agence Dev",
    email: "dev@hercule.dev",
    buyer_fit_long_term_growth: true,
    buyer_fit_loves_client_exchange: true,
    buyer_fit_monthly_results: true,
    services: "SEO, paid ads, refonte site",
    client_results_paid_3m: 8,
    client_results_organic_6m: 12,
    has_strategy: false,
    strategy_detail: "",
    objective: "Tester le pipeline et signer 2 grands comptes",
    pipeline_liked: "RDV qualifiés, profils finance, créneaux déjà bookés",
    engagement: "monthly_growth",
    roi_call_model: "1_call",
    roi_rdv_per_month: 20,
    roi_meeting_duration: "30min",
    roi_personality_artisan: false,
    roi_personality_agence_tech: false,
    roi_personality_finance: true,
    roi_closing_rate: 20,
    roi_basket_eur: 1500,
    roi_matches_objective: "yes",
    capacity_days_per_month: 5,
    closing_rate_min: 20,
    high_closing_service: "",
    high_closing_timeline: undefined,
    calendly_login: "",
    zoom_login: "",
    ...partial,
  };
}
