import { writeFileSync } from "node:fs";

import type { CliOptions } from "../types.js";
import { readLatestCache } from "../lib/cache.js";
import { buildManifest } from "../lib/manifest.js";
import { writePlans } from "../lib/plans.js";
import { filterBySurface, resolveEffectiveSurface } from "../lib/surfaces.js";

export async function runPlan(options: CliOptions): Promise<string[]> {
  const cache = readLatestCache();
  const surface = resolveEffectiveSurface(cache.surfaceFilter, options.surface);
  const scoped = filterBySurface(cache.findings, surface);
  const written = await writePlans(scoped, options.effort, options.top);
  console.log(`Wrote ${written.length} plan(s):`);
  for (const plan of written) {
    console.log(`  - ${plan}`);
  }
  return written;
}
