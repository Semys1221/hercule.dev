"use client";

import { memo } from "react";

import { PitchSlideCapture } from "./pitch-slide-capture";
import { PitchSlideCgv } from "./pitch-slide-cgv";
import { PitchSlideDashboard } from "./pitch-slide-dashboard";
import { PitchSlideDecisionMakers } from "./pitch-slide-decision-makers";
import { PitchSlideDifferentiation } from "./pitch-slide-differentiation";
import { PitchSlideFaqClose } from "./pitch-slide-faq-close";
import { PitchSlideFoundation } from "./pitch-slide-foundation";
import { PitchSlideGuarantee } from "./pitch-slide-guarantee";
import { PitchSlidePartner } from "./pitch-slide-partner";
import { PitchSlidePillars } from "./pitch-slide-pillars";
import type { PitchSlideContentProps } from "./pitch-slide-props";
import { PitchSlideRoiCalculatorLazy } from "./pitch-slide-roi-calculator.lazy";
import { PitchSlideTransition } from "./pitch-slide-transition";

export const PitchSlideContent = memo(function PitchSlideContent(props: PitchSlideContentProps) {
  const { slide } = props;

  switch (slide.type) {
    case "transition":
      return <PitchSlideTransition {...props} />;
    case "decision_makers":
      return <PitchSlideDecisionMakers {...props} />;
    case "acknowledgment":
      return <PitchSlideDifferentiation {...props} />;
    case "guarantee_hero":
      return <PitchSlideGuarantee {...props} />;
    case "cgv":
      return <PitchSlideCgv {...props} />;
    case "pillars_overview":
      return <PitchSlidePillars {...props} />;
    case "capture_buyin":
      return <PitchSlideCapture {...props} />;
    case "engine_buyin":
      return <PitchSlideFoundation {...props} />;
    case "partner_buyin":
      return <PitchSlidePartner {...props} />;
    case "roi_contract":
      return <PitchSlideRoiCalculatorLazy {...props} />;
    case "faq_close":
      return <PitchSlideFaqClose {...props} />;
    case "dashboard_link":
      return <PitchSlideDashboard {...props} />;
    default:
      return null;
  }
});
