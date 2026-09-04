# Audit alignement site ↔ CGV

> **CGV de référence :** [cvg_master.md](./cvg_master.md) (version 2026-09-04)  
> **Périmètre :** checklist copy existant — **pas de nouvelles sections** entreprise/client dans ce ticket.

---

## Synthèse des écarts

| Zone | Écart principal | Statut |
|------|-----------------|--------|
| Landing pricing | No-show « sans délai » vs CGV **14 j ouvrés** | **P0 — à corriger** |
| Landing pricing | Garanties MRR sans conditions vs CGV § 5 | **P0 — aligner wording** |
| Landing pricing | Starter **5 attributions** vs capacity **3–4/mois** | **P0 — harmoniser** (pack vs rythme) |
| FAQ booking | Rétractation **4 j** | **P1 — cohérent CGV § 8** |
| Footer | Pas de liens CGV / mentions légales | **P1 — routes futures** |
| Docs SOP | Références ancien modèle 250 € + 149 € | **P2 — obsolète** |
| Post-RDV doc | « 2 500 € hors MVP » | **P2 — formule active landing** |
| Capacity docs | Liens `contrat.md` | **P2 — migrer vers cvg_master** |

---

## Checklist fichier par fichier

### P0 — Landing agence (copy critique)

| Fichier | Écart actuel | Action CGV-aligned | Statut |
|---------|--------------|-------------------|--------|
| [`components/agence/product-direction-section.tsx`](../../components/agence/product-direction-section.tsx) L221 | « Rendez-vous de remplacement planifié **sans délai** » | → « … planifié sous **14 jours ouvrés** » (CGV § 10.1) | ☐ |
| idem L25 | Garantie MRR 3 000 € « ou attribution reportée » sans conditions | Aligner sur CGV § 5.2 (≥ 2 attributions/mois, service actif complet) ou simplifier le claim public | ☐ |
| idem L44 | Garantie MRR 1 500 € « ou 5 RDV supplémentaires » sans conditions | Aligner sur CGV § 5.1 (onboarding 48 h, retours post-RDV, 100 % RDV honorés) | ☐ |
| idem L34–36 | « 5 attributions » sans distinction pack vs rythme mensuel | Ajouter nuance : **5 attributions = pack Starter** ; rythme récurrent **jusqu'à 4/mois** ; référence ops **3–4 RDV honorés/mois** en régime stable | ☐ |
| idem L16 | « Jusqu'à 4 nouveaux clients signés par mois » | Vérifier : CGV parle d'**Attributions** (mise en relation), pas de signatures garanties — reformuler si besoin | ☐ |

**Copy suggéré — garantie no-show :**

```
- Prospect qualifié absent en visioconférence (malgré relance H-24) : attribution non consommée
- Rendez-vous de remplacement planifié sous 14 jours ouvrés
```

---

### P1 — Booking & footer

| Fichier | Écart actuel | Action CGV-aligned | Statut |
|---------|--------------|-------------------|--------|
| [`public/reservation.html`](../../public/reservation.html) L726 | « délai de **4 jours** pour vous rétracter » | **Cohérent** avec CGV § 8 (politique commerciale B2B) — ajouter « calendaires » si besoin | ☑ cohérent |
| [`components/agence/footer.tsx`](../../components/agence/footer.tsx) | Pas de lien CGV / mentions légales | Ajouter section « Légal » : `/cvg`, `/mentions-legales`, `/confidentialite` (routes statiques futures ou `#` temporaire) | ☐ |
| [`components/agence/navbar.tsx`](../../components/agence/navbar.tsx) | Ancre `#garanties` uniquement | Optionnel : lien « CGV » une fois route publique créée | ☐ |

---

### P2 — Documentation interne

| Fichier | Écart actuel | Action CGV-aligned | Statut |
|---------|--------------|-------------------|--------|
| [`doc/sop/contrat.md`](../sop/contrat.md) | Blueprint sales 250 € + 149 € | **Stub redirect** → [cvg_master.md](./cvg_master.md) | ☑ |
| [`doc/sop/sop-validation.md`](../sop/sop-validation.md) | Références contrat.md §1–§7, modèle 250+149, beta 9/15 | Bandeau obsolète · renvoi CGV + landing 1489/2500 | ☑ |
| [`doc/sop/sop-commercial.md`](../sop/sop-commercial.md) | « Généré depuis contrat.md », pricing 250+149 | En-tête + §3–§4 → **cvg_master.md** | ☑ |
| [`doc/sop/sop.md`](../sop/sop.md) | « Sections 1–5 depuis contrat.md » | Renvoi **cvg_master.md** | ☑ |
| [`doc/sop/sop-landing-plan.md`](../sop/sop-landing-plan.md) | Plan basé ancien contrat | Note historique + renvoi CGV | ☑ |
| [`doc/tech-stack/post-rdv/agence-commercial.md`](./post-rdv/agence-commercial.md) L17 | « **Hors MVP :** abonnement 2 500 € » | Commercialisé (landing + CGV) ; impl. technique hors MVP | ☑ |
| [`doc/tech-stack/capacity/README.md`](./capacity/README.md) | Lien `contrat.md` promesse 3–5 RDV | → `cvg_master.md` § 9 ; promesse ops **3–4 U4/mois** | ☑ |
| [`doc/tech-stack/capacity/00-deliverables.md`](./capacity/00-deliverables.md) | Garantie → `contrat.md` §5 | → `cvg_master.md` § 10.1 | ☑ |
| [`doc/tech-stack/capacity/07-doc-corrections.md`](./capacity/07-doc-corrections.md) | Entrées `contrat.md` | → `cvg_master.md` | ☑ |
| [`doc/tech-stack/VALIDATION.md`](./VALIDATION.md) C-03 | Lien `contrat.md` §5 | → `cvg_master.md` § 10.1 | ☑ |
| [`doc/tech-stack/VALIDATION.md`](./VALIDATION.md) V-39 | « abo 2500€ hors MVP » | Commercialisé ; impl. post-RDV hors MVP | ☑ |

---

### P3 — Historique

| Fichier | Action | Statut |
|---------|--------|--------|
| [`doc/sop/sop-landing-plan.md`](../sop/sop-landing-plan.md) | Bandeau « Document historique — pricing actuel : cvg_master.md » | ☑ |

---

## Résolution des tensions (décisions CGV)

### Starter 5 attributions vs capacity 3–4/mois

| Source | Valeur |
|--------|--------|
| Landing Starter | **5 attributions** (forfait) |
| Landing récurrent | **Jusqu'à 4 / mois** |
| Capacity ops | **3–4 RDV honorés / mois** @ 30 inbox |

**Décision CGV :** les **5 attributions Starter** = **pack initial** (consommable sur plusieurs mois). Le rythme **3–4 RDV honorés/mois** = référence opérationnelle en allocation standard, pas un minimum contractuel Starter.

### No-show « immédiat » vs 14 jours ouvrés

| Source | Valeur |
|--------|--------|
| Landing (actuel) | « sans délai » |
| CGV + capacity | **14 jours ouvrés** |

**Décision CGV :** **14 jours ouvrés** — corriger la landing (P0).

### Abonnement 2 500 € « hors MVP »

| Source | Valeur |
|--------|--------|
| Landing | **2 500 €/mois** affiché |
| post-rdv doc | « hors MVP » |
| VALIDATION V-718 | implémentation technique hors MVP |

**Décision :** **commercialisé** (CGV § 5.2, landing) · **flux post-RDV / Stripe / routes** = hors MVP implémentation.

---

## Hors scope (explicitement)

- [ ] Implémentation checkbox onboarding React ([cvg_onboarding.md](./cvg_onboarding.md))
- [ ] Routes publiques `/cvg`, `/mentions-legales`, `/confidentialite`
- [ ] Nouvelle page `/entreprise` légale
- [ ] Correction copy `product-direction-section.tsx` (documentée ici — exécution site = ticket séparé sauf demande explicite)
- [ ] Complétion placeholders SIRET / adresse / TVA dans CGV
- [ ] Validation juridique HT vs TTC

---

## Validation manuelle post-rédaction

| Point | Statut |
|-------|--------|
| HT vs TTC sur 1 489 € et 2 500 € | ☐ À trancher |
| Base légale rétractation 4j (B2B pro vs geste commercial) | ☐ CGV § 8 = geste commercial |
| Placeholders SIRET / adresse / RCS | ☐ Avant publication publique |
| Formulation exacte garanties MRR (conditions activation) | ☐ Aligner landing P0 |

---

*Dernière revue : 2026-09-04*
