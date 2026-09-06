/** Unit tests for architecture registries. */

import assert from "node:assert/strict";

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

assert.ok(COMPONENTS_REGISTRY.length >= 20);
assert.ok(DATABASE_REGISTRY.length >= 15);

console.log("architecture-registry.test.ts: ok");
