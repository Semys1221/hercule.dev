export type Surface = "internal" | "marketing" | "dashboard" | "excluded" | "other";

export type SurfaceFilter = Surface | "all";

export type Effort = "quick" | "standard" | "deep";

export type LeverageLevel = "HIGH" | "MEDIUM" | "LOW";

export type Severity = "error" | "warning" | "info";

export type AuditFinding = {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  rule: string;
  plugin: string;
  severity: Severity;
  category: string;
  title: string;
  message: string;
  help?: string;
  surface: Surface;
  source: "react-doctor" | "react-doctor-design" | "hercule-static";
  leverage: LeverageLevel;
  leverageScore: number;
  skillHint?: string;
  exemplar?: string;
  canonicalFixUrl?: string;
  fixGroupId?: string;
};

export type SurfaceInventory = {
  internal: string[];
  marketing: string[];
  dashboard: string[];
  other: string[];
  excluded: string[];
};

export type AuditScores = {
  full: number | null;
  design: number | null;
};

export type AuditCache = {
  schemaVersion: 1;
  commit: string;
  createdAt: string;
  surfaceFilter: SurfaceFilter;
  scores: AuditScores;
  inventory: SurfaceInventory;
  findings: AuditFinding[];
  doctorReportPaths: {
    full: string;
    design: string;
  };
};

export type AuditReport = {
  commit: string;
  scores: AuditScores;
  surfaceFilter: SurfaceFilter;
  scannedAt?: string;
  totalFindings: number;
  totalInCache?: number;
  byCategory: Record<string, number>;
  bySurface: Record<string, number>;
  byLeverage: Record<LeverageLevel, number>;
  findings: AuditFinding[];
};

export type AgentManifest = {
  schemaVersion: 1;
  commit: string;
  createdAt: string;
  effort: Effort;
  surface: SurfaceFilter;
  scores: AuditScores;
  skillsToAttach: string[];
  mcpWorkflow: string[];
  topFindings: AuditFinding[];
  plansWritten: string[];
  verifyCommands: string[];
  visualRoutes: string[];
  agentPrompt: string;
};

export type CliOptions = {
  command: string;
  surface: SurfaceFilter;
  effort: Effort;
  top: number;
  json: boolean;
  out?: string;
  runVerify: boolean;
};
