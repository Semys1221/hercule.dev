"use client";

import { memo } from "react";

import type { PitchWizardStepId } from "@/lib/admin/funnels/sales-pitch-wizard";

import type { PitchSlideContentProps } from "./pitch-slide-props";
import { PitchSlideActivation } from "./pitch-slide-activation";
import { PitchSlideCapture } from "./pitch-slide-capture";
import { PitchSlideCgv } from "./pitch-slide-cgv";
import { PitchSlideCompany } from "./pitch-slide-company";
import { PitchSlideComparison } from "./pitch-slide-comparison";
import { PitchSlideDashboard } from "./pitch-slide-dashboard";
import { PitchSlideDecisionMakers } from "./pitch-slide-decision-makers";
import { PitchSlideDifferentiation } from "./pitch-slide-differentiation";
import { PitchSlideFaqClose } from "./pitch-slide-faq-close";
import { PitchSlideFoundation } from "./pitch-slide-foundation";
import {
  PitchSlidePartnerContent,
  PitchSlidePartnerFuture,
} from "./pitch-slide-partner";
import { PitchSlidePillars } from "./pitch-slide-pillars";
import { PitchSlidePricing } from "./pitch-slide-pricing";
import { PitchSlideProductOrigin } from "./pitch-slide-product-origin";
import { PitchSlideRoiCalculatorLazy } from "./pitch-slide-roi-calculator.lazy";
import { PitchSlideTransition } from "./pitch-slide-transition";

function renderPillarContent(slideId: PitchWizardStepId, props: PitchSlideContentProps) {
  if (slideId === "p5") {
    return <PitchSlideCapture {...props} />;
  }
  if (slideId === "p9") {
    return <PitchSlidePartnerContent {...props} />;
  }
  return null;
}

export const PitchSlideContent = memo(function PitchSlideContent(props: PitchSlideContentProps) {
  const { slide } = props;

  switch (slide.type) {
    case "transition":
      return <PitchSlideTransition {...props} />;
    case "company":
      return <PitchSlideCompany {...props} />;
    case "product_origin":
      return <PitchSlideProductOrigin {...props} />;
    case "decision_makers":
      return <PitchSlideDecisionMakers {...props} />;
    case "acknowledgment":
      return <PitchSlideDifferentiation {...props} />;
    case "cgv":
      return <PitchSlideCgv {...props} />;
    case "pillars_overview":
      return <PitchSlidePillars {...props} />;
    case "pillar_content":
      return renderPillarContent(slide.id, props);
    case "comparison_buyin":
      return <PitchSlideComparison {...props} />;
    case "foundation_buyin":
      return <PitchSlideFoundation {...props} />;
    case "activation_buyin":
      return <PitchSlideActivation {...props} />;
    case "partner_future":
      return <PitchSlidePartnerFuture {...props} />;
    case "roi_contract":
      return <PitchSlideRoiCalculatorLazy {...props} />;
    case "faq_close":
      return <PitchSlideFaqClose {...props} />;
    case "dashboard_link":
      return <PitchSlideDashboard {...props} />;
    case "pricing_close":
      return <PitchSlidePricing {...props} />;
    default:
      return null;
  }
});
