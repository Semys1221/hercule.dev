/** Unit tests for funnel builder schemas and routing. */

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createFunnel,
  deleteFunnel,
  listFunnels,
  nextDefaultDisplayName,
  publishFunnel,
} from "@/lib/admin/funnels/repo";
import { parseWorkspacePath } from "@/lib/admin/funnels/routing";
import {
  funnelDocumentSchema,
  publicPathForScope,
  scopeFromLeafKey,
  stepComponentsSchema,
} from "@/lib/admin/funnels/schema";

assert.equal(
  publicPathForScope({ audience: "agence", kind: "onboarding", stage: null }),
  "/onboarding/agence",
);
assert.equal(
  publicPathForScope({ audience: "entreprise", kind: "vente", stage: "discovery" }),
  "/vente/entreprise/discovery",
);

const discoveryScope = scopeFromLeafKey("sales_funnel_discovery", "agence");
assert.ok(discoveryScope);
assert.equal(discoveryScope?.stage, "discovery");

const parsedList = parseWorkspacePath("agence", ["sales", "funnel", "discovery"]);
assert.equal(parsedList.kind, "leaf");
if (parsedList.kind === "leaf") {
  assert.equal(parsedList.leafKey, "sales_funnel_discovery");
  assert.equal(parsedList.funnelSlug, null);
}

const parsedEditor = parseWorkspacePath("agence", [
  "sales",
  "funnel",
  "discovery",
  "my_funnel_1",
]);
assert.equal(parsedEditor.kind, "funnel_editor");
if (parsedEditor.kind === "funnel_editor") {
  assert.equal(parsedEditor.funnelSlug, "my_funnel_1");
}

const sampleDoc = funnelDocumentSchema.parse({
  schemaVersion: 1,
  slug: "my_funnel_1",
  displayName: "my_funnel_1",
  audience: "agence",
  kind: "vente",
  stage: "discovery",
  status: "draft",
  layoutId: "default-split",
  publicPath: "/vente/agence/discovery",
  steps: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
assert.equal(sampleDoc.slug, "my_funnel_1");

const validComponents = stepComponentsSchema.parse({
  faq: [
    { id: "faq_a", hiddenIds: [], localEntries: [] },
    { id: "faq_b", hiddenIds: [], localEntries: [] },
  ],
  pricing: { id: "pricing_a" },
});
assert.equal(validComponents.faq?.length, 2);

const invalidComponents = stepComponentsSchema.safeParse({
  faq: [
    { id: "faq_a", hiddenIds: [], localEntries: [] },
    { id: "faq_b", hiddenIds: [], localEntries: [] },
    { id: "faq_c", hiddenIds: [], localEntries: [] },
  ],
});
assert.equal(invalidComponents.success, false);

async function withTempContentRoot(run: (root: string) => Promise<void>) {
  const originalCwd = process.cwd();
  const tempRoot = await mkdtemp(join(tmpdir(), "funnel-builder-"));
  process.chdir(tempRoot);
  await mkdir(join(tempRoot, "content", "funnels"), { recursive: true });
  await mkdir(join(tempRoot, "app"), { recursive: true });
  await writeFile(join(tempRoot, "app", "globals.css"), ":root { --background: oklch(1 0 0); }");

  try {
    await run(tempRoot);
  } finally {
    process.chdir(originalCwd);
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function runRepoTests() {
  await withTempContentRoot(async () => {
    const scope = { audience: "agence" as const, kind: "vente" as const, stage: "discovery" as const };
    const firstName = await nextDefaultDisplayName(scope);
    assert.equal(firstName, "my_funnel_1");

    const funnel = await createFunnel(scope);
    assert.equal(funnel.displayName, "my_funnel_1");
    assert.equal(funnel.publicPath, "/vente/agence/discovery");

    const listed = await listFunnels(scope);
    assert.equal(listed.length, 1);

    const second = await createFunnel(scope, "Second funnel");
    assert.notEqual(second.slug, funnel.slug);

    await publishFunnel(scope, funnel.slug);
    const publishedFirst = JSON.parse(
      await readFile(
        join(
          process.cwd(),
          "content",
          "funnels",
          "agence",
          "vente",
          "discovery",
          funnel.slug,
          "funnel.json",
        ),
        "utf8",
      ),
    );
    assert.equal(publishedFirst.status, "published");

    await publishFunnel(scope, second.slug);
    const republishedFirst = JSON.parse(
      await readFile(
        join(
          process.cwd(),
          "content",
          "funnels",
          "agence",
          "vente",
          "discovery",
          funnel.slug,
          "funnel.json",
        ),
        "utf8",
      ),
    );
    assert.equal(republishedFirst.status, "draft");

    await deleteFunnel(scope, second.slug);
    const afterDelete = await listFunnels(scope);
    assert.equal(afterDelete.length, 1);
    assert.equal(afterDelete[0]?.slug, funnel.slug);
  });
}

runRepoTests()
  .then(() => {
    console.log("funnels.test.ts: ok");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
