import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRIES_PATH = join(process.cwd(), "lib", "(resend)", "sequences", "entries.ts");
const SLUGS_PATH = join(process.cwd(), "lib", "(resend)", "sequences", "booking-slugs.ts");

/** Remove one top-level object whose `slug` field matches. */
export function removeSequenceObjectBySlug(source: string, slug: string): string {
  const needle = `slug: "${slug}"`;
  const at = source.indexOf(needle);
  if (at < 0) {
    throw new Error(`sequence_not_in_registry:${slug}`);
  }
  const open = source.lastIndexOf("{", at);
  if (open < 0) {
    throw new Error(`sequence_object_not_found:${slug}`);
  }
  let depth = 0;
  let close = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close < 0) {
    throw new Error(`sequence_object_unclosed:${slug}`);
  }
  let end = close + 1;
  while (end < source.length && /[ \t]/.test(source[end])) end++;
  if (source[end] === ",") end++;
  if (source[end] === "\n") end++;
  return source.slice(0, open) + source.slice(end);
}

export function removeBookingSlugKeys(source: string, slug: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let skipping = false;
  let depth = 0;
  for (const line of lines) {
    if (!skipping) {
      const key = line.match(/^\s*"([^"]+)":/);
      if (key && (key[1] === slug || key[1].startsWith(`${slug}:`))) {
        skipping = true;
        depth = 0;
      }
    }
    if (skipping) {
      depth += (line.match(/\[/g) ?? []).length;
      depth -= (line.match(/\]/g) ?? []).length;
      if (depth <= 0 && line.includes("],")) {
        skipping = false;
      }
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

export function removeResendSequenceFromRegistry(slug: string): void {
  const entries = readFileSync(ENTRIES_PATH, "utf-8");
  writeFileSync(ENTRIES_PATH, removeSequenceObjectBySlug(entries, slug), "utf-8");
  const slugs = readFileSync(SLUGS_PATH, "utf-8");
  writeFileSync(SLUGS_PATH, removeBookingSlugKeys(slugs, slug), "utf-8");
}
