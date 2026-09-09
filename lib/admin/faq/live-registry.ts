import type { FaqAudience, FaqDocument } from "@/lib/site/faq-types";

export type FaqLiveInstanceKind = "master" | "funnel_component" | "dashboard";

export type FaqLiveInstance = {
  id: string;
  name: string;
  title: string;
  location: string;
  audience: FaqAudience;
  kind: FaqLiveInstanceKind;
  questionCount?: number;
  sourcePath?: string;
};

export const FAQ_LIVE_KIND_LABELS: Record<FaqLiveInstanceKind, string> = {
  master: "Master",
  funnel_component: "Funnel",
  dashboard: "Dashboard",
};

export const FAQ_LIVE_INSTANCES: FaqLiveInstance[] = [
  {
    id: "master-agence",
    name: "FAQ publique agence",
    title: "Questions fréquentes — site public",
    location: "/faq",
    audience: "agence",
    kind: "master",
    sourcePath: "content/faq/agence.json",
  },
  {
    id: "master-entreprise",
    name: "FAQ master entreprise",
    title: "Questions fréquentes — audience entreprise",
    location: "/internal/funnels/entreprise/legal/faq",
    audience: "entreprise",
    kind: "master",
    sourcePath: "content/faq/entreprise.json",
  },
  {
    id: "master-comptable",
    name: "FAQ master comptable",
    title: "Questions fréquentes — audience comptable",
    location: "/internal/funnels/comptable/legal/faq",
    audience: "comptable",
    kind: "master",
    sourcePath: "content/faq/comptable.json",
  },
  {
    id: "funnel-faq-widget-comptable",
    name: "Widget FAQ funnel agence",
    title: "Blocs FAQ des étapes funnel agence",
    location: "components/funnels/widgets/faq-widget.tsx",
    audience: "agence",
    kind: "funnel_component",
    sourcePath: "components/funnels/widgets/faq-widget.tsx",
  },
  {
    id: "funnel-faq-widget-entreprise",
    name: "Widget FAQ funnel entreprise",
    title: "Blocs FAQ des étapes funnel entreprise",
    location: "components/funnels/widgets/faq-widget.tsx",
    audience: "entreprise",
    kind: "funnel_component",
    sourcePath: "components/funnels/widgets/faq-widget.tsx",
  },
  {
    id: "dashboard-step-faq",
    name: "Dashboard — StepFaq",
    title: "FAQ onboarding dashboard",
    location: "/dashboard/[slug]",
    audience: "agence",
    kind: "dashboard",
    questionCount: 8,
    sourcePath: "components/dashboard/steps/step-faq.tsx",
  },
  {
    id: "dashboard-step-faqtiedown-agence",
    name: "Dashboard — StepFaqTieDown (agence)",
    title: "FAQ + confirmation d'intention",
    location: "/dashboard/[slug]",
    audience: "agence",
    kind: "dashboard",
    questionCount: 8,
    sourcePath: "components/dashboard/steps/step-faq-tie-down.tsx",
  },
  {
    id: "dashboard-step-faqtiedown-comptable",
    name: "Dashboard — StepFaqTieDown (comptable)",
    title: "FAQ + confirmation d'intention cabinet",
    location: "/dashboard/[slug]",
    audience: "comptable",
    kind: "dashboard",
    questionCount: 8,
    sourcePath: "lib/dashboard/onboarding-faq.ts",
  },
  {
    id: "dashboard-step-faqtiedown-entreprise",
    name: "Dashboard — StepFaqTieDown (entreprise)",
    title: "FAQ confiance entreprise",
    location: "/dashboard/[slug]",
    audience: "entreprise",
    kind: "dashboard",
    questionCount: 6,
    sourcePath: "lib/dashboard/onboarding-faq.ts",
  },
];

export function getQuestionCountForInstance(
  instance: FaqLiveInstance,
  documents: Partial<Record<FaqAudience, FaqDocument>>,
): number {
  if (typeof instance.questionCount === "number") {
    return instance.questionCount;
  }
  return documents[instance.audience]?.entries.length ?? 0;
}

export function getLiveInstancesForAudience(
  audience: FaqAudience | "tous",
): FaqLiveInstance[] {
  if (audience === "tous") {
    return FAQ_LIVE_INSTANCES;
  }
  return FAQ_LIVE_INSTANCES.filter((instance) => instance.audience === audience);
}
