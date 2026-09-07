import assert from "node:assert/strict";
import test from "node:test";

import type { AgenceDemandeRow } from "@/lib/admin/demandes";
import { mapDemandeRow } from "./demandes-repo";

test("mapDemandeRow maps verso qualification fields from snake_case", () => {
  const row: AgenceDemandeRow = {
    external_id: "C1",
    record_type: "demande",
    niche: "comptabilite",
    secteur: "Comptabilité",
    prestation: "SEO",
    budget: "1 500 €",
    taille: "8 mandataires",
    zone: "Grand Est",
    disponibilite: "Septembre",
    origine: "Recrutement",
    duree_souhaitee: "6–12 mois récurrent",
    horizon_resultat: "90 jours",
    historique_agences: "Première collaboration",
    status: "available",
    available_from: "2026-09-08",
    available_until: "2026-11-30",
    titre: null,
    description: null,
    note: null,
    sort_order: 1,
  };

  const mapped = mapDemandeRow(row);
  assert.equal(mapped.dureeSouhaitee, "6–12 mois récurrent");
  assert.equal(mapped.horizonResultat, "90 jours");
  assert.equal(mapped.historiqueAgences, "Première collaboration");
});