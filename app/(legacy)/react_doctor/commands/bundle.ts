import { writeFileSync } from "node:fs";

import type { CliOptions } from "../types.js";
import { readLatestCache } from "../lib/cache.js";
import { buildManifest } from "../lib/manifest.js";
import { writePlans } from "../lib/plans.js";
import { filterBySurface, resolveEffectiveSurface } from "../lib/surfaces.js";

export async function runBundle(options: CliOptions): Promise<void> {
  const cache = readLatestCache();
  const surface = resolveEffectiveSurface(cache.surfaceFilter, options.surface);
  const plansWritten = await writePlans(
    filterBySurface(cache.findings, surface),
    options.effort,
    options.top,
  );
  const manifest = buildManifest(
    cache,
    options.effort,
    surface,
    options.top,
    plansWritten,
  );

  const output = JSON.stringify(manifest, null, 2);
  if (options.out) {
    writeFileSync(options.out, `${output}\n`, "utf8");
    console.log(`Wrote agent manifest to ${options.out}`);
  } else {
    console.log(output);
  }
}
