# Audit alignement site ↔ CGV

```
status: canonical
audience: coding-agent
depends_on: cvg_master.md, constants-commercial.md
decisions: CVG-02 CPY-01 CPY-03 CPY-04 EML-05
do_not:
  - Laisser le site promettre 898, 4 j de rétractation, 5 attributions one-shot, 149 €/RDV
```

> **CGV de référence :** [cvg_master.md](./cvg_master.md) version **2026-09-06**  
> Pricing / FAQ **dérivent** du contrat. Module code : [constants-commercial.md](./constants-commercial.md).

---

## Règles

1. Landing, FAQ `content/`, emails vente, `/internal` pricing = **mêmes** montants que `COMMERCIAL`.
2. 2 500 €/mois : **vitrine** uniquement, jamais un CTA de souscription réelle.
3. Après rewrite CGV, rejouer cette checklist sur :
   - `components/agence/*`
   - `content/pricing/agence.json`
   - `content/faq/*`
   - `public/reservation.html` (rétractation 4 j à retirer)
4. Tests : `FORBIDDEN_COPY` dans ENG-16.

## Écarts historiques (ne plus rétablir)

| Ancien copy | Remplacement |
|-------------|--------------|
| 898 € / 3 RDV | **interdit** |
| 1 489 € pack 5 attributions | 1 489 € **par mois** |
| 1 500 € entrée | **interdit** |
| Rétractation 4 jours | **aucune** |
| No-show « sans délai » | 14 jours ouvrés |
| 149 € / RDV honoré | Attribution au RDV **planifié** |
