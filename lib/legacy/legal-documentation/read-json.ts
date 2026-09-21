import { readFileSync } from "node:fs";

export function readJsonFile<T>(path: string): T {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
}
