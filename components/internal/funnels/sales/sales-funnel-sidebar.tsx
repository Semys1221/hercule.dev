"use client";

import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Handshake,
  History,
  LogOut,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import { HerculeMark } from "@/components/hercule-mark";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import {
  SALES_CLOSING_SECTIONS,
  SALES_CLOSING_SECTION_ICONS,
  type SalesClosingSectionId,
} from "./sales-closing-sections";
import { SalesFunnelProgress } from "./sales-funnel-progress";
import {
  SALES_FUNNEL_SECTIONS,
  type SalesFunnelSectionId,
} from "./sales-funnel-sections";

const SECTION_ICONS: Record<SalesFunnelSectionId, LucideIcon> = {
  "rendez-vous": Calendar,
  introduction: Sparkles,
  "presentation-societe": Building2,
  capacite: Briefcase,
  historique: History,
  standards: ClipboardList,
  conditions: Handshake,
};

// Matches DEFAULT_MEETING_NAME in sales-funnel-module.tsx
const PLACEHOLDER_NAME = "No meetings";

type SidebarContentPhase = "qualification" | "pitch";

export type MeetingInfo = {
  leadName: string | null;
  company: string | null;
  scheduledAt: string | null;
};

type SalesFunnelSidebarProps = {
  name: string;
  progress: number;
  progressLabel: string;
  phase: "qualification" | "closing";
  contentPhase: SidebarContentPhase;
  contentAnimation: "idle" | "exit" | "enter";
  activeSectionId: SalesFunnelSectionId | SalesClosingSectionId;
  completedSectionIds: Array<SalesFunnelSectionId | SalesClosingSectionId>;
  exitHref: string;
  settingsHref: string;
  canEnterClosing: boolean;
  pitchSidebarEnabled: boolean;
  meetingInfo?: MeetingInfo | null;
  onEnterClosing: () => void;
  onSectionChange: (sectionId: SalesFunnelSectionId | SalesClosingSectionId) => void;
};

export function SalesFunnelSidebar({
  name,
  progress,
  progressLabel,
  phase,
  contentPhase,
  contentAnimation,
  activeSectionId,
  completedSectionIds,
  exitHref,
  settingsHref,
  canEnterClosing,
  pitchSidebarEnabled,
  meetingInfo,
  onEnterClosing,
  onSectionChange,
}: SalesFunnelSidebarProps) {
  const sections =
    contentPhase === "pitch" ? SALES_CLOSING_SECTIONS : SALES_FUNNEL_SECTIONS;
  const isPlaceholder = name === PLACEHOLDER_NAME || !meetingInfo;
  const phaseLabel = phase === "closing" ? "Pitch commercial" : "Sales funnel";

  return (
    <Sidebar variant="sidebar" collapsible="none" className="h-svh shrink-0 border-r border-border">

      {/* ── Header ── */}
      <SidebarHeader className="gap-0 pb-3 pt-3">
        {/* Row 1: brand + gear */}
        <div className="flex items-center justify-between px-3 py-1">
          <div className="flex items-center gap-2">
            <HerculeMark variant="dual" className="size-6 shrink-0 text-white" />
            <span className="text-sm font-semibold tracking-tight">{phaseLabel}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href={settingsHref} aria-label="Réglages du funnel sales">
              <Settings className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Row 2: meeting name badge */}
        <div className="flex items-center gap-1.5 px-3 py-0.5">
          <Calendar className="size-3 shrink-0 text-muted-foreground/50" />
          {isPlaceholder ? (
            <span className="text-xs italic text-muted-foreground/40">
              Aucun RDV sélectionné
            </span>
          ) : (
            <span className="truncate text-xs text-muted-foreground">{name}</span>
          )}
        </div>
      </SidebarHeader>

      {/* ── Navigation + Context card ── */}
      <SidebarContent className="overflow-hidden">
        {/* Separator between header and nav */}
        <Separator className="mb-2" />

        <div
          key={contentPhase}
          className={cn(
            "duration-300",
            contentAnimation === "exit" &&
              "animate-out fade-out-0 slide-out-to-bottom-2 fill-mode-forwards",
            contentAnimation === "enter" &&
              "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-forwards",
          )}
        >
          {/* ── Nav section ── */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-widest text-foreground/50">
              {contentPhase === "pitch" ? "Pitch" : "Étapes"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sections.map((section) => {
                  const Icon =
                    contentPhase === "pitch"
                      ? SALES_CLOSING_SECTION_ICONS[section.id as SalesClosingSectionId]
                      : SECTION_ICONS[section.id as SalesFunnelSectionId];
                  const isComplete =
                    section.id !== "rendez-vous" &&
                    completedSectionIds.includes(section.id);
                  return (
                    <SidebarMenuItem key={section.id}>
                      <SidebarMenuButton
                        isActive={activeSectionId === section.id}
                        tooltip={section.label}
                        onClick={() => onSectionChange(section.id)}
                      >
                        <Icon />
                        <span className="flex-1 truncate">{section.label}</span>
                        {isComplete ? (
                          <Check className="size-4 shrink-0 text-primary" aria-hidden />
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── Meeting context card ── */}
          <div className="px-2 pt-1">
            <div
              className={cn(
                "rounded-md border border-border bg-card p-3",
                !meetingInfo && "border-dashed opacity-60",
              )}
            >
              {meetingInfo ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium text-foreground">
                      {meetingInfo.leadName ?? "—"}
                    </span>
                  </div>
                  {meetingInfo.company ? (
                    <p className="truncate pl-[18px] text-[11px] text-muted-foreground">
                      {meetingInfo.company}
                    </p>
                  ) : null}
                  {meetingInfo.scheduledAt ? (
                    <p className="truncate pl-[18px] text-[11px] text-muted-foreground">
                      {new Date(meetingInfo.scheduledAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                  Sélectionnez un RDV pour afficher les infos du prospect.
                </p>
              )}
            </div>
          </div>
        </div>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="flex flex-col gap-1.5 p-2">
        <Separator className="mb-0.5" />

        {/* Row 1: progress ring + label + optional CTA */}
        <div className="flex items-center gap-2 px-1">
          <SalesFunnelProgress
            value={progress}
            label={progressLabel}
            showLabel
          />
          {phase === "qualification" && canEnterClosing && !pitchSidebarEnabled ? (
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              onClick={onEnterClosing}
            >
              Passer au closing
            </Button>
          ) : null}
        </div>

        {/* Row 2: Exit as ghost button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={exitHref}>
            <LogOut className="size-4" />
            Quitter la session
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
