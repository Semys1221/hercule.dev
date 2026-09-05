/** Unit tests for funnel toolbar action mapping. */

import assert from "node:assert/strict";

import { funnelToolbarActions } from "@/lib/admin/funnels/toolbar-actions";

const navPath = ["agence", "sales", "funnel", "discovery"];

const listDraft = funnelToolbarActions("list", "draft", navPath, "my_funnel_1");
assert.equal(listDraft.edit.enabled, true);
assert.ok(listDraft.edit.enabled && listDraft.edit.href?.includes("my_funnel_1"));
assert.equal(listDraft.preview.enabled, false);
assert.equal(listDraft.promote.enabled, true);

const listPublished = funnelToolbarActions("list", "published", navPath, "my_funnel_1");
assert.equal(listPublished.promote.enabled, false);

const editorDraft = funnelToolbarActions("editor", "draft", navPath, "my_funnel_1");
assert.equal(editorDraft.edit.enabled, false);
assert.equal(editorDraft.preview.enabled, true);
assert.equal(editorDraft.promote.enabled, true);

const editorPublished = funnelToolbarActions("editor", "published", navPath, "my_funnel_1");
assert.equal(editorPublished.preview.enabled, true);
assert.equal(editorPublished.promote.enabled, false);

console.log("toolbar-actions.test.ts: ok");
