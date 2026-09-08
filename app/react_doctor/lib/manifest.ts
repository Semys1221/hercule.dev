import type { AgentManifest, AuditCache, AuditFinding, Effort, SurfaceFilter } from "../types.js";
import { MCP_WORKFLOW, VERIFY_COMMANDS, VISUAL_ROUTES } from "./constants.js";
import { filterByEffort, sortByLeverage } from "./leverage.js";
import { skillsForFindings } from "./skills.js";
import { filterBySurface, resolveEffectiveSurface } from "./surfaces.js";

function visualRoutesForSurface(surface: SurfaceFilter, cacheSurface: SurfaceFilter): string[] {
  const effective = surface === "all" ? cacheSurface : surface;
  if (effective === "all") {
    return [
      ...VISUAL_ROUTES.internal,
      ...VISUAL_ROUTES.marketing,
      ...VISUAL_ROUTES.dashboard,
    ];
  }
  if (effective === "excluded" || effective === "other") return [];
  return VISUAL_ROUTES[effective] ?? [];
}

function buildAgentPrompt(
  cache: AuditCache,
  topFindings: AuditFinding[],
  plansWritten: string[],
): string {
  const planList = plansWritten.length
    ? plansWritten.map((p) => `- ${p}`).join("\n")
    : "- (run `pnpm frontend-audit plan` first)";

  return `Retroactive frontend audit for Hercule.dev (commit ${cache.commit}).

1. Read every skill in skillsToAttach — especially hercule-ui and surface-specific skills.
2. Use plugin-shadcn-shadcn MCP before editing any UI (search → examples → audit checklist).
3. Execute plans in order (read-only audit already done; you apply fixes):
${planList}
4. Run verifyCommands in order. Do not skip pnpm doctor (proactive regression gate).

Top ${topFindings.length} findings by leverage are in topFindings. Fix one plan at a time.`;
}

export function buildManifest(
  cache: AuditCache,
  effort: Effort,
  surface: SurfaceFilter,
  top: number,
  plansWritten: string[] = [],
): AgentManifest {
  const effectiveSurface = resolveEffectiveSurface(cache.surfaceFilter, surface);
  const scoped = filterBySurface(cache.findings, effectiveSurface);
  const topFindings = sortByLeverage(filterByEffort(scoped, effort)).slice(0, top);

  return {
    schemaVersion: 1,
    commit: cache.commit,
    createdAt: new Date().toISOString(),
    effort,
    surface: effectiveSurface,
    scores: cache.scores,
    skillsToAttach: skillsForFindings(topFindings),
    mcpWorkflow: MCP_WORKFLOW,
    topFindings,
    plansWritten,
    verifyCommands: [
      ...VERIFY_COMMANDS,
      ...(visualRoutesForSurface(effectiveSurface, cache.surfaceFilter).length
        ? ["pnpm e2e:visual"]
        : []),
    ],
    visualRoutes: visualRoutesForSurface(effectiveSurface, cache.surfaceFilter),
    agentPrompt: buildAgentPrompt(cache, topFindings, plansWritten),
  };
}
