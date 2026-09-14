"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { getWizardObjectifsQuestions } from "@/components/internal/funnels/sales/sales-questions-objectifs-wizard";
import { getPitchSlides } from "@/components/internal/funnels/sales/sales-pitch-wizard-slides";
import {
  getDashboardRecoverySteps,
  getDashboardWizardSteps,
} from "@/lib/admin/funnels/sales-dashboard-wizard";
import {
  getMappingFlow,
  getMappingFlowSegments,
  getMappingNodeDetail,
  type MappingFlowId,
  type MappingFlowSegment,
} from "@/lib/admin/funnels/sales-mapping-tree";
import type { Audience } from "@/lib/admin/navigation";

import { SalesMappingNodeCard } from "./sales-mapping-node-card";
import { SalesMappingNodeDetail } from "./sales-mapping-node-detail";

type SalesMappingFlowProps = {
  flowId: MappingFlowId;
  audience: Audience;
};

function Connector() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className="h-6 w-px bg-border" />
    </div>
  );
}

function renderSegments(
  segments: MappingFlowSegment[],
  flowId: MappingFlowId,
  audience: Audience,
  flow: ReturnType<typeof getMappingFlow>,
  typeLabels: Record<string, string>,
  selectedNodeId: string | null,
  onSelect: (nodeId: string) => void,
): ReactNode {
  return segments.map((segment, index) => {
    if (segment.kind === "step") {
      const node = flow.nodes[segment.id];
      if (!node) {
        return null;
      }

      return (
        <div key={`${segment.id}-${index}`}>
          {index > 0 ? <Connector /> : null}
          <SalesMappingNodeCard
            node={node}
            typeLabel={typeLabels[segment.id]}
            selected={selectedNodeId === segment.id}
            onSelect={() => onSelect(segment.id)}
          />
        </div>
      );
    }

    return (
      <div key={`split-${index}`} className="space-y-2">
        <Connector />
        <div className="grid gap-3 md:grid-cols-2">
          {segment.branches.map((branch) => (
            <div
              key={branch.label}
              className="space-y-2 rounded-lg border border-dashed border-border p-3"
            >
              <Badge variant="outline" className="max-w-full whitespace-normal text-left">
                {branch.label}
              </Badge>
              {branch.segments.length > 0 ? (
                renderSegments(
                  branch.segments,
                  flowId,
                  audience,
                  flow,
                  typeLabels,
                  selectedNodeId,
                  onSelect,
                )
              ) : (
                <p className="px-1 text-xs italic text-muted-foreground">Étape ignorée</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  });
}

export function SalesMappingFlow({ flowId, audience }: SalesMappingFlowProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const flow = useMemo(() => getMappingFlow(flowId, audience), [flowId, audience]);
  const segments = useMemo(() => getMappingFlowSegments(flowId), [flowId]);

  const typeLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    if (flowId === "discovery") {
      for (const question of getWizardObjectifsQuestions(audience)) {
        labels[question.id] = question.type;
      }
    } else if (flowId === "pitch") {
      for (const slide of getPitchSlides(audience)) {
        labels[slide.id] = slide.type.replace(/_/g, " ");
      }
      labels.pitch_gate = "gate";
    } else {
      for (const step of getDashboardWizardSteps()) {
        labels[step.id] = step.type.replace(/_/g, " ");
      }
      for (const step of getDashboardRecoverySteps()) {
        labels[step.id] = step.type.replace(/_/g, " ");
      }
      labels.dashboard_gate = "gate";
    }
    return labels;
  }, [audience, flowId]);

  const selectedDetail = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    return getMappingNodeDetail(flowId, selectedNodeId, audience);
  }, [audience, flowId, selectedNodeId]);

  function handleSelect(nodeId: string) {
    setSelectedNodeId(nodeId);
    setDetailOpen(true);
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {renderSegments(
          segments,
          flowId,
          audience,
          flow,
          typeLabels,
          selectedNodeId,
          handleSelect,
        )}
      </div>

      <SalesMappingNodeDetail
        detail={selectedDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
