import { Separator } from "@/components/ui/separator";

import { PropositionDecCaseMetrics } from "./proposition-dec-case-metrics";
import { PropositionDecCaseStudy } from "./proposition-dec-case-study";
import { PropositionDecCta } from "./proposition-dec-cta";
import { PropositionDecFaq } from "./proposition-dec-faq";
import { PropositionDecGrowthChart } from "./proposition-dec-growth-chart";
import { PropositionDecHero } from "./proposition-dec-hero";
import { PropositionDecMechanism } from "./proposition-dec-mechanism";
import { PropositionDecOffer } from "./proposition-dec-offer";
import { PropositionDecSocialProof } from "./proposition-dec-social-proof";
import { PropositionTrialSummary } from "./proposition-trial-summary";
import { PropositionTrialTimeline } from "./proposition-trial-timeline";

export function PropositionDecPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-16 px-6 py-16">
      <PropositionDecHero />
      <PropositionDecMechanism />
      <Separator className="max-w-md" />
      <PropositionDecOffer />
      <PropositionDecGrowthChart />
      <PropositionDecCaseStudy />
      <PropositionDecCaseMetrics />
      <Separator className="max-w-md" />
      <PropositionTrialSummary />
      <PropositionTrialTimeline />
      <PropositionDecCta />
      <PropositionDecSocialProof />
      <PropositionDecFaq />
    </main>
  );
}
