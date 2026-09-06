/** Unit tests for architecture registries. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COMPONENTS_REGISTRY } from "@/lib/admin/architecture/components-registry";
import { DATABASE_REGISTRY } from "@/lib/admin/architecture/database-registry";
import {
  componentsRegistrySchema,
  databaseRegistrySchema,
} from "@/lib/admin/architecture/types";

assert.equal(
  componentsRegistrySchema.safeParse(COMPONENTS_REGISTRY).success,
  true,
);
assert.equal(databaseRegistrySchema.safeParse(DATABASE_REGISTRY).success, true);

const componentIds = COMPONENTS_REGISTRY.map((entry) => entry.id);
assert.equal(
  componentIds.length,
  new Set(componentIds).size,
  "component ids must be unique",
);

const databaseIds = DATABASE_REGISTRY.map((entry) => entry.id);
assert.equal(
  databaseIds.length,
  new Set(databaseIds).size,
  "database ids must be unique",
);

assert.ok(COMPONENTS_REGISTRY.length >= 67);
assert.ok(DATABASE_REGISTRY.length >= 15);

function extractDocComponentIds(markdown: string): string[] {
  const ids: string[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^\| ([a-z][a-z0-9-*]+) \|/);
    if (!match || match[1] === "id" || match[1] === "ID") {
      continue;
    }
    ids.push(match[1]);
  }
  return ids;
}

const componentsDocPath = join(
  process.cwd(),
  "doc/tech-stack/06-components.md",
);
const componentsDoc = readFileSync(componentsDocPath, "utf8");
const docComponentIds = extractDocComponentIds(componentsDoc).filter(
  (id) => !id.includes("*"),
);
const docComponentIdSet = new Set(docComponentIds);
const registryComponentIdSet = new Set(componentIds);

const onlyInDoc = docComponentIds.filter((id) => !registryComponentIdSet.has(id));
const onlyInRegistry = componentIds.filter((id) => !docComponentIdSet.has(id));

assert.deepEqual(
  onlyInDoc,
  [],
  `06-components.md lists ids missing from registry: ${onlyInDoc.join(", ")}`,
);
assert.deepEqual(
  onlyInRegistry,
  [],
  `registry lists ids missing from 06-components.md: ${onlyInRegistry.join(", ")}`,
);

console.log("architecture-registry.test.ts: ok");
