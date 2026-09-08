#!/usr/bin/env node
/**
 * Frontend Audit CLI — retroactive UI scan for Cursor agents.
 * @see app/react_doctor/README.md
 */

import type { CliOptions, Effort, SurfaceFilter } from "./types.js";
import { runScan } from "./commands/scan.js";
import { runReport } from "./commands/report.js";
import { runPlan } from "./commands/plan.js";
import { runBundle } from "./commands/bundle.js";
import { runVerify } from "./commands/verify.js";

const USAGE = `frontend-audit — retroactive Hercule UI audit (read-only)

Usage:
  pnpm frontend-audit <command> [options]

Commands:
  scan      Full retroactive scan → JSON cache
  report    Human table or JSON summary from latest cache
  plan      Write prioritized react-plans/ from latest cache
  bundle    Agent manifest JSON (scan + skills + plans + verify)
  verify    Post-fix checklist (add --run to execute)

Options:
  --surface internal|marketing|dashboard|all   (default: all)
  --effort quick|standard|deep                 (default: standard)
  --top <n>                                    (default: 10)
  --json                                       Machine-readable output
  --out <path>                                 Write artifact to file
  --run                                        Execute verify commands
`;

function parseArgs(argv: string[]): CliOptions {
  const raw = argv.slice(2);
  const hashIndex = raw.indexOf("#");
  const args = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
  const command = args[0] ?? "help";

  let surface: SurfaceFilter = "all";
  let effort: Effort = "standard";
  let top = 10;
  let json = false;
  let out: string | undefined;
  let runVerify = false;

  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--surface" && args[i + 1]) {
      surface = args[++i] as SurfaceFilter;
      continue;
    }
    if (arg === "--effort" && args[i + 1]) {
      effort = args[++i] as Effort;
      continue;
    }
    if (arg === "--top" && args[i + 1]) {
      top = Number(args[++i]);
      continue;
    }
    if (arg === "--out" && args[i + 1]) {
      out = args[++i];
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--run") {
      runVerify = true;
      continue;
    }
  }

  return { command, surface, effort, top, json, out, runVerify };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  switch (options.command) {
    case "scan":
      await runScan(options);
      break;
    case "report":
      await runReport(options);
      break;
    case "plan":
      await runPlan(options);
      break;
    case "bundle":
      await runBundle(options);
      break;
    case "verify":
      await runVerify(options);
      break;
    case "help":
    case "-h":
    case "--help":
      console.log(USAGE);
      break;
    default:
      console.error(`Unknown command: ${options.command}\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
