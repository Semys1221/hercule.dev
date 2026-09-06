import assert from "node:assert/strict";

import {
  FAQ_LIVE_INSTANCES,
  getLiveInstancesForAudience,
  getQuestionCountForInstance,
} from "@/lib/admin/faq/live-registry";
import { getBundledFaqDocument } from "@/lib/site/faq-data";

assert.ok(FAQ_LIVE_INSTANCES.length >= 6);

const agence = getLiveInstancesForAudience("agence");
assert.ok(agence.every((instance) => instance.audience === "agence"));
assert.ok(agence.some((instance) => instance.kind === "master"));
assert.ok(agence.some((instance) => instance.kind === "dashboard"));

const documents = {
  agence: getBundledFaqDocument("agence"),
  entreprise: getBundledFaqDocument("entreprise"),
};

const masterAgence = FAQ_LIVE_INSTANCES.find((instance) => instance.id === "master-agence");
assert.ok(masterAgence);
assert.equal(
  getQuestionCountForInstance(masterAgence, documents),
  documents.agence.entries.length,
);

const dashboard = FAQ_LIVE_INSTANCES.find((instance) => instance.id === "dashboard-step-faq");
assert.ok(dashboard);
assert.equal(getQuestionCountForInstance(dashboard, documents), 3);

console.log("live-registry.test.ts: ok");
