/** Unit tests for pipeline invitee classification. */

import assert from "node:assert/strict";

import { classifyPipelineInvitee } from "@/lib/legacy/calendly/pipeline-classify";

const COMPTABLE_BUDGET_Q =
  "Pour intégrer notre réseau partenaire, un budget minimum de 999 €/mois est requis pour la gestion des contrats. Êtes-vous en capacité d'investir ce montant si le ROI est démontré ?";
const COMPTABLE_TEAM_Q = "Quel est l'effectif actuel de votre entreprise ?";

const CIF_BUDGET_Q =
  "Quel budget votre cabinet souhaite-t-il consacrer à l'acquisition de nouveaux clients ?";
const CIF_TEAM_Q = "Quel est l'effectif actuel de votre entreprise ?";

const comptableOui = classifyPipelineInvitee("comptable", {
  [COMPTABLE_BUDGET_Q]: "Oui",
  [COMPTABLE_TEAM_Q]: "5 à 10",
});
assert.equal(comptableOui.budgetTier, "1000plus");
assert.equal(comptableOui.isIndependent, false);
assert.equal(comptableOui.isComptable, true);
assert.equal(comptableOui.segmentKey, "1000plus_not_indep_comptable");

const comptableNon = classifyPipelineInvitee("comptable", {
  [COMPTABLE_BUDGET_Q]: "Non",
  [COMPTABLE_TEAM_Q]: "2 à 4",
});
assert.equal(comptableNon.budgetTier, "undefined");
assert.equal(comptableNon.isComptable, true);

const cifHighBudget = classifyPipelineInvitee("cif", {
  [CIF_BUDGET_Q]: "Plus de 2 500 € (Structure solide, forte ambition)",
  [CIF_TEAM_Q]: "10+",
});
assert.equal(cifHighBudget.budgetTier, "1000plus");
assert.equal(cifHighBudget.isIndependent, false);
assert.equal(cifHighBudget.isComptable, false);
assert.equal(cifHighBudget.segmentKey, "1000plus_not_indep_not_comptable");

const cifMidBudget = classifyPipelineInvitee("cif", {
  [CIF_BUDGET_Q]: "Entre 1 000 € et 2 500 € (Prêt à absorber le flux)",
  [CIF_TEAM_Q]: "5 à 10",
});
assert.equal(cifMidBudget.budgetTier, "1000plus");

const cifLowBudget = classifyPipelineInvitee("cif", {
  [CIF_BUDGET_Q]: "Moins de 1 000 € (Notre capacité de traitement est limitée)",
  [CIF_TEAM_Q]: "Indépendant",
});
assert.equal(cifLowBudget.budgetTier, "undefined");
assert.equal(cifLowBudget.isIndependent, true);
assert.equal(cifLowBudget.segmentKey, "undefined_indep_not_comptable");

const cifIndepHigh = classifyPipelineInvitee("cif", {
  [CIF_BUDGET_Q]: "Entre 1 000 € et 2 500 € (Prêt à absorber le flux)",
  [CIF_TEAM_Q]: "Indépendant",
});
assert.equal(cifIndepHigh.budgetTier, "1000plus");
assert.equal(cifIndepHigh.isIndependent, true);
assert.equal(cifIndepHigh.segmentKey, "1000plus_indep_not_comptable");

console.log("OK lib/calendly/pipeline-classify.test.ts");
