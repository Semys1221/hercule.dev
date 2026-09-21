"use client";

import { memo } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HerculeMark } from "@/components/hercule-mark";
import { buildBleedTrack, interpolateBleed } from "@/lib/legacy/admin/funnels/sales-bleed-track";

import { TeamImageFrame } from "../team-image-frame";
import { getPitchAudienceLabel, getPitchMirrorTemplate } from "../sales-pitch-wizard-slides";
import { PitchSurfacePanel } from "./pitch-surface-panel";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PITCH_TEAM = [
  {
    name: "Evan",
    role: "Direction technique",
    initials: "EV",
    highlights: ["Mandat d'auditeur principal", "Critères de performance", "Admission dossier"],
  },
  {
    name: "Béatrice",
    role: "Qualification TPE",
    initials: "BE",
    highlights: ["Premier filtre", "Relation partenaires", "Interface dirigeants"],
  },
  {
    name: "Thomas",
    role: "Produit & ops",
    initials: "TH",
    highlights: ["Plateforme produit", "Opérations techniques", "Automatisation"],
  },
] as const;

export const PitchSlideCompany = memo(function PitchSlideCompany({
  audience,
  values,
  immersive,
}: PitchSlideBaseProps) {
  const bleed = buildBleedTrack(values, audience);
  const mirror = interpolateBleed(getPitchMirrorTemplate(audience), bleed);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <HerculeMark variant="dual" className="size-10 shrink-0 text-white" />
        <div>
          <p className="text-lg font-medium">{getPitchAudienceLabel(audience)}</p>
          <p className="text-sm text-muted-foreground">Infrastructure exclusive de zone</p>
        </div>
      </div>

      <TeamImageFrame />

      <PitchSurfacePanel immersive={immersive} className="border-primary/20">
        <p className="text-sm font-medium text-foreground">{mirror}</p>
      </PitchSurfacePanel>

      <div className="flex flex-wrap justify-center gap-4">
        {PITCH_TEAM.map((member) => (
          <HoverCard key={member.name} openDelay={120}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-center gap-2 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/30"
              >
                <Avatar className="size-14 border border-border">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {member.highlights.map((item) => (
                  <li key={item} className="text-foreground">· {item}</li>
                ))}
              </ul>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
});
