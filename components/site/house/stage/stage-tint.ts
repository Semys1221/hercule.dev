export type StageTabId = "comptable" | "cif" | "assurance" | "agence" | "entreprise"

export type StageTint = {
  dot: string
  soft: string
  text: string
  fill: string
  beamStart: string
  beamEnd: string
}

export const STAGE_TINT: Record<StageTabId, StageTint> = {
  comptable: {
    dot: "bg-blue-500",
    soft: "bg-blue-500/10",
    text: "text-blue-600",
    fill: "#2563eb",
    beamStart: "#93c5fd",
    beamEnd: "#2563eb",
  },
  cif: {
    dot: "bg-violet-500",
    soft: "bg-violet-500/10",
    text: "text-violet-600",
    fill: "#7c3aed",
    beamStart: "#c4b5fd",
    beamEnd: "#7c3aed",
  },
  assurance: {
    dot: "bg-amber-500",
    soft: "bg-amber-500/10",
    text: "text-amber-600",
    fill: "#d97706",
    beamStart: "#fcd34d",
    beamEnd: "#d97706",
  },
  agence: {
    dot: "bg-emerald-500",
    soft: "bg-emerald-500/10",
    text: "text-emerald-600",
    fill: "#059669",
    beamStart: "#6ee7b7",
    beamEnd: "#059669",
  },
  entreprise: {
    dot: "bg-cyan-500",
    soft: "bg-cyan-500/10",
    text: "text-cyan-600",
    fill: "#0891b2",
    beamStart: "#67e8f9",
    beamEnd: "#0891b2",
  },
}

export function isStageTabId(id: string): id is StageTabId {
  return id in STAGE_TINT
}
