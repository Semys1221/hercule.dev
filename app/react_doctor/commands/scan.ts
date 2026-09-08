import { writeFileSync } from "node:fs";

import type { CliOptions } from "../types.js";
import { writeCache, ensureCacheDir } from "../lib/cache.js";
import { dedupeFindings, runReactDoctorScan } from "../lib/doctor.js";
import { runHerculeStaticChecks, collectTsxFiles } from "../lib/hercule-checks.js";
import { gitShortHead } from "../lib/git.js";
import { enrichFindingLeverage } from "../lib/leverage.js";
import { skillHintForRule, exemplarForFinding, canonicalFixUrl } from "../lib/skills.js";
import { buildInventory, filterBySurface } from "../lib/surfaces.js";
import type { AuditCache, AuditFinding } from "../types.js";

function enrichStaticFindings(findings: AuditFinding[]): AuditFinding[] {
  return findings.map((f) =>
    enrichFindingLeverage({
      ...f,
      skillHint: f.skillHint ?? skillHintForRule(f.rule, f.surface),
      exemplar: f.exemplar ?? exemplarForFinding(f),
      canonicalFixUrl: f.canonicalFixUrl ?? canonicalFixUrl(f.plugin, f.rule),
    }),
  );
}

export async function runScan(options: CliOptions): Promise<string> {
  ensureCacheDir();
  const commit = gitShortHead();

  console.log("Running react-doctor full scan (retroactive)...");
  const full = runReactDoctorScan("full", commit);

  console.log("Running react-doctor design scan...");
  const design = runReactDoctorScan("design", commit);

  console.log("Running Hercule static checks on TSX files...");
  const staticFindings = enrichStaticFindings(runHerculeStaticChecks());

  const inventory = buildInventory(collectTsxFiles());
  let findings = dedupeFindings([...full.findings, ...design.findings, ...staticFindings]);
  findings = filterBySurface(findings, options.surface);

  const cache: AuditCache = {
    schemaVersion: 1,
    commit,
    createdAt: new Date().toISOString(),
    surfaceFilter: options.surface,
    scores: {
      full: full.score,
      design: design.score,
    },
    inventory,
    findings,
    doctorReportPaths: {
      full: full.reportPath,
      design: design.reportPath,
    },
  };

  const cachePath = writeCache(cache);
  console.log(
    `Scan complete. Score full=${cache.scores.full ?? "n/a"} design=${cache.scores.design ?? "n/a"} findings=${findings.length}`,
  );
  console.log(`Cache: ${cachePath}`);
  return cachePath;
}
