# Patch Sales — Dashboard closing wizard (cabinets)

> **Statut :** annexe copy — wizard de closing client `/dashboard/[slug]`  
> **Build :** [`PLAN.md`](./PLAN.md) phase **13**  
> **Périmètre :** **comptable + cif** uniquement  
> **Ton :** consultatif — urgence = mécanique de marché, pas culpabilisation

```
do_not:
  - Appliquer ce wizard à agence ou entreprise (hors adoucissement slide zone legacy)
  - Migrations Stripe, CGV juridiques
  - Afficher lead(s), Lite 998, 10 missions sur surfaces cabinets
```

---

## Objectif

Transformer le dashboard post-audit cabinets en **wizard de closing** (6 étapes) :

1. Screen-share, preview, form (inchangés)
2. FAQ 3 objections + diagnostic fit + why + CGV compacte
3. Grille Core / Horizon
4. Commit (Je me lance / J'ai encore une question) puis Stripe
5. Recovery plein écran si hésitation (1 cycle max)

Référence session pitch : [`patch_sales_new_pitch.md`](./patch_sales_new_pitch.md) — le dashboard reste le canal paiement.

---

## Principes de ton

| Éviter | Privilégier |
|--------|-------------|
| « Mais sur quoi ? », « qu'est-ce qui retient… » | « Sur quel point prendre du recul ? » |
| « Laisse la zone à un confrère » | « La zone peut être attribuée à un autre cabinet » |
| « Pas pour voir » | « Pour déployer l'infrastructure sur la zone » |
| « Caprice » (associé) | « Décision partagée » |

---

## FAQ objections (cabinets)

Ids : `obj-payment`, `obj-associe`, `obj-reflechir` — copy canon dans [`lib/dashboard/onboarding-faq.ts`](../../../lib/dashboard/onboarding-faq.ts).

---

## Diagnostic fit (sous FAQ)

| Id | Label |
|----|--------|
| `fits` | Ce fonctionnement me convient |
| `partial` | Je vois le principe, un point reste à clarifier |
| `mismatch` | Ce n'est pas encore aligné pour moi |

Why obligatoire (min 20 car.) + CGV compacte → gate Suivant.

---

## Commit paiement

| Id | Label |
|----|--------|
| `launch` | Je me lance |
| `hesitate` | J'ai encore une question |

---

## Recovery

3 questions diagnostic → 3 écrans pitch (You / Company / System) avec structure What / How / Why different / Benefit par écran.

Copy engine : [`lib/dashboard/closing-recovery.ts`](../../../lib/dashboard/closing-recovery.ts).

---

## Persistance

`profile.dashboard.closing` via PATCH `/api/dashboard/[slug]`.
