import assert from "node:assert/strict";
import test from "node:test";

import { mapComptableDemandeRow } from "./demandes-repo";

test("mapComptableDemandeRow maps verso qualification fields from snake_case", () => {
  const mapped = mapComptableDemandeRow({
    external_id: "T1",
    record_type: "demande",
    niche: "btp",
    secteur: "BTP / rénovation",
    prestation: "Reprise tenue + liasse fiscale",
    budget: "3 600–4 800 €/an",
    taille: "4 salariés",
    zone: "Île-de-France",
    disponibilite: "Septembre",
    origine: "Changement expert-comptable",
    duree_souhaitee: "Mission annuelle",
    horizon_resultat: "Premier RDV sous 20 à 25 jours",
    historique_agences: "Cabinet précédent — délais de clôture",
    status: "available",
    available_from: "2026-09-08",
    available_until: "2026-11-30",
    titre: null,
    description: null,
    note: null,
    sort_order: 1,
  });

  assert.equal(mapped.dureeSouhaitee, "Mission annuelle");
  assert.equal(mapped.horizonResultat, "Premier RDV sous 20 à 25 jours");
  assert.equal(mapped.historiqueAgences, "Cabinet précédent — délais de clôture");
  assert.equal(mapped.origine, "Changement expert-comptable");
});
