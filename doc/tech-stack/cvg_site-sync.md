# Audit alignement site ↔ CGV

```
status: canonical
audience: coding-agent
depends_on: cvg_master.md, constants-commercial.md
decisions: CVG-02 CPY-01 CPY-03 CPY-04 EML-05
do_not:
  - Laisser le site promettre 898 €, 149 €/RDV, Growth 2 500 € souscriptible avec garanties MRR
```

> **CGV de référence :** [/cvg](/cvg) version **2026-09-08**  
> Pricing / FAQ **dérivent** du contrat. Module code : [/cvg/constants-commercial](/cvg/constants-commercial).

---

## Règles

1. Landing, FAQ `content/`, emails vente, `/internal` pricing = **mêmes** montants que `COMMERCIAL`.
2. **Starter** : 1 489 € one-shot, **5 Attributions**, garantie MRR 1 500 €.
3. **Renouvellement** (emails upsell, survey) : mensuel 1 489 €/mois **ou** pack 989×3 = 2 967 €.
4. **2 500 €/mois** : **vitrine** uniquement avec footnote « non souscriptible » — jamais garanties MRR 3 000 € ni CTA de souscription réelle.
5. **Rétractation** : **4 jours calendaires** (CGV §8) — cohérent FAQ + reservation.html.
6. Après rewrite CGV, rejouer cette checklist sur :
   - `components/comptable/*`
   - `content/pricing/comptable.json`
   - `content/faq/comptable.json`
   - `public/modalites-hercule.html`
7. Tests : `FORBIDDEN_COPY` dans ENG-16 · `offer_type` `starter_1489_5` pour checkout entrée.

## Écarts historiques (ne plus rétablir)

| Ancien copy | Remplacement |
|-------------|--------------|
| 898 € / 3 RDV | **interdit** |
| 1 489 € **par mois** comme seule entrée | **Starter 1 489 € / 5 Attributions** en entrée |
| 1 500 € forfait d'entrée | **interdit** (1 500 € = seuil garantie MRR Starter) |
| Growth 2 500 € avec garanties contractuelles | **vitrine footnote only** |
| No-show « sans délai » | 14 jours ouvrés |
| 149 € / RDV honoré | Attribution au RDV **planifié** |

---

## Vertical comptable (2026-09-09)

**CGV de référence :** [/cvg](/cvg) · **Knowledge reply agent :** [`ai-reply-knowledge-comptable.md`](./ai-reply-knowledge-comptable.md)

1. `content/pricing/comptable.json` ↔ `cvg_comptable.md` ↔ `COMMERCIAL_COMPTABLE` dans `lib/commercial/constants.ts`.
2. Nomenclature canonique : **Hercule Lite** (998 €/mois, 5 missions/mois, abonnement) · **Hercule Starter** (1 499 €/mois, 10 missions/mois, abonnement) · **Pack 3 mois Starter** (3 598 €, paiement unique).
3. FAQ : `content/faq/comptable.json` — mêmes montants et garanties MRR : **5 remplacements / 3 000 €** (Starter, après 10 missions) · **15 remplacements / 9 000 €** (Pack, après 30 missions, 5 par tranche de 10 missions).
4. Site marketing : `components/comptable/comptable-pricing-grid.tsx` (flip Lite ↔ Pack + Starter).
5. Sales live : `SalesComptablePricingPanel` → `ComptablePricingCheckout` (même grille).
6. Dashboard onboarding : `StepPricingCardComptable` doit réutiliser `ComptablePricingGrid` — pas de plan ID `plan-comptable-croissance`.
7. Reply agent : preset `cabinets_expertise_comptable` — prompts `prompts/cabinets_expertise_comptable_*.md`, knowledge pack comptable, CTA `{reservation_comptable_link}`, tarifs → `hercule.dev/cvg` sans chiffrer.

### Interdits comptable (copy)

| Ancien copy | Remplacement |
|-------------|--------------|
| « Formule Croissance » / « Croissance 1 499 € » | **Hercule Starter** |
| « Hercule Starter 999 € » / « Lite one-shot » | **Hercule Lite 998 €/mois** |
| `plan-comptable-croissance` | `plan-comptable-lite` / `plan-comptable-starter` |
| Tarifs agence (1 489 €, 5 attributions) dans reply agent comptable | Knowledge pack [`ai-reply-knowledge-comptable.md`](./ai-reply-knowledge-comptable.md) |
