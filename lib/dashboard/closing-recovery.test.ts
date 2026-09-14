/** Unit tests for dashboard closing recovery pitch. */
import assert from "node:assert/strict";

import type { BleedTrack } from "@/lib/admin/funnels/sales-bleed-track";
import {
  buildRecoveryPitchScreens,
  getRecoveryAngle,
  isRecoveryDiagnosticComplete,
  RECOVERY_MAX_CYCLES,
  serviceFitsToBoolean,
} from "./closing-recovery";

const mockBleed: BleedTrack = {
  businessNoun: "cabinet",
  cause: "l'invisibilité locale",
  causeId: "invisibilite",
  primaryBrake: "SEO sans garantie",
  gap: "12 mandats/an",
  gapId: "gap_12",
  duration: "2019",
  synthesis: [],
  honorairesAnnual: 180000,
  goal: "+8 mandats",
};

const mockContext = {
  bleed: mockBleed,
  firstName: "Jean",
  zone: "Rhône (69)",
};

const diagnosticOui = {
  serviceFits: "oui" as const,
  serviceWhy: "Le cadre me semble cohérent avec notre zone.",
  friction: "Rien de bloquant pour l'instant.",
};

const diagnosticPasEncore = {
  serviceFits: "pas_encore" as const,
  serviceWhy: "Je veux valider le calendrier avec mon associé.",
  friction: "Le timing de déploiement sur 60 jours.",
};

const screensAngle1 = buildRecoveryPitchScreens(diagnosticOui, mockContext, 1);
assert.equal(screensAngle1.length, 3);
assert.match(screensAngle1[0].beats.how, /180.?000/);
assert.match(screensAngle1[0].beats.benefit, /12 mandats\/an/);
assert.match(screensAngle1[2].alert ?? "", /Rhône \(69\)/);

const screensAngle2 = buildRecoveryPitchScreens(diagnosticPasEncore, mockContext, 2);
assert.match(screensAngle2[0].title, /coût de l'attente/i);
assert.match(screensAngle2[0].beats.what, /invisibilité locale/i);
assert.match(screensAngle2[0].beats.benefit, /timing de déploiement/);
assert.match(screensAngle2[2].title, /Urgence zone/i);
assert.match(screensAngle2[2].alert ?? "", /Rhône \(69\)/);

assert.notEqual(
  screensAngle1[0].beats.what,
  screensAngle2[0].beats.what,
  "angle 2 should differ from angle 1",
);

assert.equal(getRecoveryAngle(0), 1);
assert.equal(getRecoveryAngle(1), 2);
assert.equal(RECOVERY_MAX_CYCLES, 2);

assert.equal(serviceFitsToBoolean("oui"), true);
assert.equal(serviceFitsToBoolean("pas_encore"), false);
assert.equal(serviceFitsToBoolean(null), null);

assert.equal(isRecoveryDiagnosticComplete(diagnosticOui), true);
assert.equal(
  isRecoveryDiagnosticComplete({
    serviceFits: "oui",
    serviceWhy: "court",
    friction: "court",
  }),
  false,
);

console.log("closing-recovery.test.ts: ok");
