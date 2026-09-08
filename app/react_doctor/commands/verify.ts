import { execSync } from "node:child_process";

import type { CliOptions } from "../types.js";
import { readLatestCache } from "../lib/cache.js";
import { REPO_ROOT, VERIFY_COMMANDS } from "../lib/constants.js";
import { buildManifest } from "../lib/manifest.js";
import { resolveEffectiveSurface } from "../lib/surfaces.js";

export async function runVerify(options: CliOptions): Promise<void> {
  const cache = readLatestCache();
  const surface = resolveEffectiveSurface(cache.surfaceFilter, options.surface);
  const manifest = buildManifest(cache, options.effort, surface, options.top);

  console.log("Post-fix verification checklist:\n");
  for (const cmd of manifest.verifyCommands) {
    console.log(`  ${cmd}`);
  }

  if (manifest.visualRoutes.length) {
    console.log("\nVisual routes to spot-check:");
    for (const route of manifest.visualRoutes) {
      console.log(`  ${route}`);
    }
  }

  if (options.runVerify) {
    console.log("\nRunning verification commands...\n");
    for (const cmd of VERIFY_COMMANDS) {
      console.log(`> ${cmd}`);
      try {
        execSync(cmd, { cwd: REPO_ROOT, stdio: "inherit" });
      } catch {
        console.error(`Command failed: ${cmd}`);
        process.exitCode = 1;
      }
    }

    try {
      const raw = execSync("pnpm doctor:score", {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      const scoreLine = raw.trim().split("\n").pop() ?? "";
      const current = Number(scoreLine.replace(/\D/g, "") || scoreLine);
      const baseline = cache.scores.full;
      console.log(`\nScore now: ${scoreLine.trim()} | baseline at scan: ${baseline ?? "n/a"}`);
      if (baseline != null && !Number.isNaN(current) && current < baseline) {
        console.error("Score regressed below scan baseline.");
        process.exitCode = 1;
      }
    } catch {
      console.error("Could not read doctor score.");
    }
  } else {
    console.log("\nRun with --run to execute commands (not just print).");
  }
}
