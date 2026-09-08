import { execSync } from "node:child_process";

import { REPO_ROOT } from "./constants.js";

export function gitShortHead(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}
