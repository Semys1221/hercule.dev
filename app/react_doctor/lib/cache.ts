import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AuditCache } from "../types.js";
import { CACHE_DIR } from "./constants.js";

export function ensureCacheDir(): void {
  mkdirSync(CACHE_DIR, { recursive: true });
}

export function cachePathForCommit(commit: string): string {
  return path.join(CACHE_DIR, `audit-${commit}.json`);
}

export function writeCache(cache: AuditCache): string {
  ensureCacheDir();
  const filePath = cachePathForCommit(cache.commit);
  writeFileSync(filePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  writeFileSync(path.join(CACHE_DIR, "latest.json"), `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  return filePath;
}

export function readLatestCache(): AuditCache {
  const latestPath = path.join(CACHE_DIR, "latest.json");
  if (!exists(latestPath)) {
    throw new Error("No audit cache found. Run `pnpm frontend-audit scan` first.");
  }
  return JSON.parse(readFileSync(latestPath, "utf8")) as AuditCache;
}

export function readCacheByCommit(commit: string): AuditCache | null {
  const filePath = cachePathForCommit(commit);
  if (!exists(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as AuditCache;
}

function exists(filePath: string): boolean {
  try {
    readFileSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function listCacheFiles(): string[] {
  ensureCacheDir();
  return readdirSync(CACHE_DIR)
    .filter((name) => name.startsWith("audit-") && name.endsWith(".json"))
    .sort();
}
