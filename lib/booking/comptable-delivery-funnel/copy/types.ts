import type { FunnelRouteSegment, FunnelStepId } from "../schema";

export type ChoiceOption = { value: string; label: string };

export type EducationBlock = { title: string; body: string };

export type StepCopy =
  | {
      stepId: FunnelStepId;
      kind: "intro";
      title: string;
      body: string;
    }
  | {
      stepId: FunnelStepId;
      kind: "single_choice";
      title: string;
      question: string;
      options: ChoiceOption[];
    }
  | {
      stepId: FunnelStepId;
      kind: "education";
      title: string;
      lead: string;
      paragraphs: string[];
      blocks: EducationBlock[];
      closing: string;
    }
  | {
      stepId: FunnelStepId;
      kind: "free_text";
      title: string;
      question: string;
      placeholder: string;
    }
  | {
      stepId: FunnelStepId;
      kind: "calendly";
      title: string;
      paragraphs: string[];
      cta: string;
    }
  | {
      stepId: FunnelStepId;
      kind: "confirmation";
      title: string;
      body: string;
    }
  | {
      stepId: FunnelStepId;
      kind: "checklist";
      title: string;
      body: string;
      items: string[];
      closing: string;
    };

export type VerticalCopyBundle = {
  routeSegment: FunnelRouteSegment;
  brandLabel: string;
  heroCaption: string;
  imagePath: string;
  steps: Record<FunnelStepId, StepCopy>;
};
