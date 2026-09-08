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
