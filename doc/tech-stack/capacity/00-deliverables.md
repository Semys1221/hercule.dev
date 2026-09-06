# Capacity — Livrables par client payant

```
status: canonical
audience: coding-agent
depends_on: README.md, ../01-product.md
decisions: CAP-01 BIZ-02
do_not:
  - Unité de facturation = U4 / 149 €
```

---

## Unités

Voir [README.md](./README.md). Attribution consommée = **U3** (RDV planifié). SLA volume client = **U4** (honorés / mois).

## Promesse volume (C-02)

| Allocation inbox | Promesse U4/mois |
|------------------|------------------|
| 30 (standard) | **3 à 4** RDV honorés |
| 15 (constrained) | **2 à 3** |

« 3–5 / mois » = plafond marketing, pas un minimum.

## Mapping offres

| Offre | Lien capacity |
|-------|----------------|
| 1 489 €/mois | C-02 rythme mensuel |
| 989×3 / 15 attributions | 15 × U3 sur ~3 mois + garantie CA 4,5 k€ |
| 2 500 €/mois | vitrine, pas de capacité vendue |

## Page suivi (étape 9)

Compteur U3/U4 dérivé de `appointments`, dates `profile.capacity`, file d’attente. Pas de `MEETING_n` en statut.
