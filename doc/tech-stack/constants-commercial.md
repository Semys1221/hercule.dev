# Constantes commerciales (ENG-16)

```
status: canonical
audience: coding-agent
depends_on: 00-decisions.md, cvg_master.md
decisions: ENG-16 EML-05 CVG-02 CAP-01 CPY-01 CPY-04
do_not:
  - Parser cvg_master.md au runtime
  - Dupliquer ces chiffres dans un composant React
```

Implémenter `lib/commercial/constants.ts` + tests de non-divergence (snapshots / equality).  
Le markdown CGV reste le contrat **lisible**. Le code lit **ce module**.

```ts
export const COMMERCIAL = {
  /** Starter — 1 489 € one-shot, 5 attributions */
  starterPriceCents: 148_900,
  starterAttributions: 5,
  starterGuaranteeMrrCents: 150_000,
  starterGuaranteeMaxReplacements: 5,

  /** Mensuel sans engagement — 1 489 €/mois */
  monthlyPriceCents: 148_900,

  /** Pack 3 mois — 989 €/mois × 3 */
  pack989x3UnitCents: 98_900,
  pack989x3TotalCents: 296_700,
  pack989x3Attributions: 15,
  packGuaranteeCaCents: 450_000,
  packGuaranteeMaxReplacements: 15,

  honorMinutesMin: 15,
  noshowReplaceWorkingDays: 14,
  noshowReportHours: 48,
  confirmRelanceHours: 24,
  firstHonoredDaysStandard: 21,
  firstHonoredDaysConstrained: 28,
  volumeHonoredPerMonthStandard: { min: 3, max: 4 },
  onboardingAccessHours: 48,
  waitingListMaxDays: 15,
  retractationDays: 4,
} as const;

export const OFFER_TYPES = {
  starter1489_5: "starter_1489_5",
  monthly1489: "monthly_1489",
  pack989x3: "pack_989x3",
} as const;

export const VITRINE_ONLY = {
  hercule2500MonthlyCents: 250_000,
} as const;

export const FORBIDDEN_COPY = [
  "898",
  "1 500 €",
  "1500€",
  "MEETING_10",
] as const;
```

`VITRINE_ONLY` : affichage marketing **uniquement**, jamais `payments.offer_type`.

Rétractation **4 jours** : voir `retractationDays` et CGV §8.

---

## Comptable — `COMMERCIAL_COMPTABLE`

Contrat lisible : [`cvg_comptable.md`](./cvg_comptable.md). Pricing UI : `content/pricing/comptable.json`.

```ts
export const OFFER_TYPES_COMPTABLE = {
  starter999_5: "starter_999_5",   // Hercule Lite
  monthly1499: "monthly_1499",     // Hercule Starter
  pack3x1499: "pack_3x1499",       // Pack 3 mois Starter
} as const;

export const COMMERCIAL_COMPTABLE = {
  starterPriceCents: 99_800,              // Lite — 998 €/mois, 5 missions/mois
  liteMissionsPerMonth: 5,
  starterMissions: 5,                   // alias liteMissionsPerMonth
  monthlyPriceCents: 149_900,             // Starter — 1 499 €/mois, 10 missions/mois
  growthMissionsPerMonth: 10,
  growthGuaranteeMrrCents: 300_000,       // 3 000 € MRR cumulé ou 5 remplacements
  growthGuaranteeMaxReplacements: 5,
  pack3TotalCents: 359_800,               // Pack 3 mois — 1 499 × 3 − 20 %
  pack3MissionsTotal: 30,
  pack3GuaranteeMrrCents: 900_000,
  pack3GuaranteeMaxReplacements: 15,
  firstRdvDaysMin: 20,
  firstRdvDaysMax: 25,
  noshowReplaceWorkingDays: 14,
  minAssociatesOrCollaborators: 3,
} as const;
```

Nomenclature UI (2026-09-10) : **Lite** (entrée 998 €/mois, 5 missions/mois) · **Starter** (mensuel 1 499 €, 10 missions/mois) · **Pack 3 mois Starter** (3 598 €, paiement unique). Ne pas réintroduire « Croissance », « Starter 999 € » ni le libellé « TTC ».
