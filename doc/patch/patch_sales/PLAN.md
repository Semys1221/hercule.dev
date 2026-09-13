# Patch Sales — plan de build

```
status: build-plan
audience: coding-agent
date: 2026-09-13
entrypoint: ./README.md
annexes:
  - ./patch_sales_discovery.md
  - ./patch_sales_bleed.md
  - ./patch_sales_pitch.md
```

**Handoff agents :** voir [`README.md`](./README.md). Mettre à jour le statut et la section **Handoff** en bas de chaque phase.

---

## Statut global

| Phase | Titre | Statut |
|-------|--------|--------|
| 1 | Moteur bleed | `todo` |
| 2 | Coupe session + scoring | `todo` |
| 3 | **Bleed tunnel cabinets** | `todo` |
| 4 | Objectifs agence / entreprise | `todo` |
| 5 | Chrome bleed + qualif | `todo` |
| 6 | Présentation, règles, calendrier, ROI | `todo` |
| 7 | Dashboard objections | `todo` |
| 8 | Offre écran cabinets | `todo` |
| 9 | QA finale | `todo` |

---

## Phase 1 — Moteur bleed

**Statut :** `todo`  
**Dépend de :** —  
**Audiences :** agence, entreprise, comptable, cif  
**Annexe :** discovery §4–§5, §9.1, §9.4

### Objectif

Introduire le state dérivé `BleedTrack` et les champs schema sans changer encore tout le copy.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `lib/admin/funnels/sales-bleed-track.ts` | **Créer** — `buildBleedTrack`, `interpolateBleed`, `formatBleedStickyChips` |
| `lib/admin/funnels/sales-qualification-schema.ts` | Ajouter `o3Duration`, `bleedDiagnosticAccepted` ; defaults ; `isFieldComplete` |
| `components/internal/funnels/sales/sales-questions.ts` (types) | Étendre `SalesQuestion` : `coachCue?`, `bleedBenefit?`, `showCoachCueWhen?` |
| `lib/admin/funnels/sales-bleed-track.test.ts` | **Créer** (ou co-localiser tests) |
| `lib/admin/funnels/sales-qualification-schema.test.ts` | Mettre à jour |

### Tâches

1. Type `BleedTrack` selon discovery §5.3 (`businessNoun`, `cause`, `gap`, `duration`, `synthesis`, honoraires optionnels).
2. `interpolateBleed(template, bleed)` — tokens `{cause}`, `{gap}`, `{business}`, etc.
3. Persister les nouveaux champs via le flux qualif existant (`/api/admin/sales-session` ou PATCH lead).
4. **Ne pas** encore brancher sidebar / carte diagnostic (phases 3–5).

### DoD

- [ ] `buildBleedTrack(values, audience)` retourne un objet stable pour un preset test.
- [ ] Schema rejette `objectifs` incomplet si `bleedDiagnosticAccepted` absent (champ présent, gate UI phase 3 cabinets / phase 4 agence).
- [ ] Tests schema + bleed verts.

### Tests

```bash
pnpm test -- sales-qualification-schema sales-bleed-track
```

### Handoff

```text
Phase 1 —
Fait :
Pas fait :
Piège :
Suivant : phase 2
```

---

## Phase 2 — Coupe session + scoring

**Statut :** `todo`  
**Dépend de :** phase 1  
**Audiences :** toutes  
**Annexe :** discovery §3, §9.2, §9.5

### Objectif

Retirer Historique et questions filler ; ajuster scoring Serial.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `components/internal/funnels/sales/sales-funnel-sections.ts` | Retirer `historique` des 4 arrays ; subtitles Objectifs/Capacité/Conditions (sans prix 998/1499) |
| `components/internal/funnels/sales/sales-funnel-sidebar.tsx` | Masquer étape Historique |
| `components/internal/funnels/sales/sales-questions.ts` | Retirer q4, q5 |
| `components/internal/funnels/sales/sales-questions-comptable.ts` | Retirer q6–q10 si présents |
| `components/internal/funnels/sales/sales-questions-cif.ts` | Idem |
| `lib/admin/funnels/sales-qualification-schema.ts` | Retirer `historique` de `SECTION_QUESTION_KEYS` ; retirer q4/q5 de `capacite` |
| `lib/admin/funnels/sales-preset-scoring.ts` | `scoreSerial` : q4/q10 → **q3**, **q20** |
| `lib/admin/funnels/sales-test-session-preset.ts` | Retirer q6–q10 ; ajouter champs bleed |
| `lib/admin/funnels/sales-preset-scoring.test.ts` | Mettre à jour |
| `lib/admin/navigation.test.ts` | Si sections sidebar référencées |

### Tâches

1. Navigation session : plus d’étape Historique dans la sidebar.
2. Scoring Serial aligné discovery §9.2.
3. **Pas** de copy Foundation ni tunnel bleed cabinets (phase 3).

### DoD

- [ ] Sidebar comptable/agence/cif/entreprise sans « Historique ».
- [ ] q4, q5, q6–q10 absents du schema sections.
- [ ] Tests scoring verts.
- [ ] Session test (seed) charge sans erreur.

### Tests

```bash
pnpm test -- sales-preset-scoring sales-qualification-schema sales-funnel-sections
```

### Handoff

```text
Phase 2 —
Fait :
Pas fait :
Piège :
Suivant : phase 3
```

---

## Phase 3 — Bleed tunnel cabinets

**Statut :** `todo`  
**Dépend de :** phases 1–2  
**Audiences :** **comptable + cif** uniquement  
**Annexe :** [`patch_sales_bleed.md`](./patch_sales_bleed.md) (canon)

### Objectif

Remplacer les questions linéaires `o1`–`o6` par le **tunnel branching** b1–b8 : objectif → actuel → ancienneté → H chiffré → méthodes → piège → problèmes de X → coût statu quo → carte diagnostic. **Phase la plus importante** — résout les objections avant Foundation.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `components/internal/funnels/sales/sales-questions-objectifs-comptable.ts` | Remplacer par tunnel `b1`–`b8` |
| `components/internal/funnels/sales/sales-questions-objectifs-cif.ts` | Transposition lexique CIF |
| `components/internal/funnels/sales/sales-question-fields.tsx` | Sliders dynamiques `b2`/`b4` ; `visibleWhen` `b5b` ; branches `b7` ; carte diagnostic |
| `components/internal/funnels/sales/sales-questions.ts` | Étendre `SalesQuestion` : `visibleWhen?`, options dynamiques `b7` |
| `lib/admin/funnels/sales-qualification-schema.ts` | Champs `b*` cabinets ; `SECTION_QUESTION_KEYS.objectifs` split audience |
| `lib/admin/funnels/sales-bleed-track.ts` | `BleedTrackCabinet` : `goal`, `current`, `method`, `gap` |
| `components/internal/funnels/sales/sales-funnel-section-page.tsx` | Subtitle Objectifs cabinets |
| `lib/admin/funnels/sales-bleed-track.test.ts` | Interpolation `{method}`, `{year}`, `{goal}` |
| `sales-questions-objectifs-comptable.test.ts` | Chemins b1→carte ; branches b7 |

**Ne pas toucher** `sales-questions-objectifs-agence.ts` ni `entreprise.ts`.

### Tâches

1. Implémenter tronc b1–b5 + `b5b` conditionnel (bleed §3).
2. Bloc piège b6 (script interpolé) + b7 par méthode (bleed §4).
3. b8 + carte `bleedDiagnosticAccepted` (bleed §3.10–3.11).
4. `buildBleedTrack` cabinets alimente tokens pour phases 5+.
5. **Pas** de pitch Foundation ici — transition en phase 6.

### DoD

- [ ] Parcours comptable b1 → carte sans dead-end.
- [ ] Q6 affiche piège `{method}` × `{goal}` × `{year}`.
- [ ] 7 listes `b7` (une par méthode b5).
- [ ] Carte bloque navigation.
- [ ] CIF : mandats / études — pas « audit ».
- [ ] Aucun `lead` dans les prompts.
- [ ] Scoring Serial **non** branché sur `b*`.

### Tests

```bash
pnpm test -- sales-questions-objectifs-comptable sales-bleed-track sales-qualification-schema
```

### Handoff

```text
Phase 3 —
Fait :
Pas fait :
Piège :
Suivant : phase 4
```

---

## Phase 4 — Objectifs agence / entreprise

**Statut :** `todo`  
**Dépend de :** phases 1–2 (parallèle possible avec phase 3 si agents distincts)  
**Audiences :** **agence + entreprise** uniquement  
**Annexe :** discovery §6.2

### Objectif

Ancre bleed linéaire : cues, chips `o3Duration`, carte diagnostic bloquante — flux discovery inchangé pour ces audiences.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `components/internal/funnels/sales/sales-questions-objectifs-agence.ts` | Cues discovery §6.2 |
| `components/internal/funnels/sales/sales-questions-objectifs-entreprise.ts` | Idem |
| `components/internal/funnels/sales/sales-question-fields.tsx` | Branche audience : chips `o3Duration` ; carte agence/entreprise |
| `components/internal/funnels/sales/sales-funnel-section-page.tsx` | Subtitle Objectifs interpolé (agence/entreprise) |
| `components/internal/funnels/sales/sales-questions-objectifs-agence.test.ts` | Mettre à jour |
| `components/internal/funnels/sales/sales-questions-objectifs-entreprise.test.ts` | Mettre à jour |

### Tâches

1. Carte diagnostic : bloque navigation tant que `bleedDiagnosticAccepted !== true`.
2. Garder ids `o1`–`o6` + `o3Duration` (discovery).
3. Ne pas implémenter chip sticky (phase 5).

### DoD

- [ ] Chips durée après o3 (agence/entreprise).
- [ ] Carte diagnostic bloque la suite.
- [ ] Comptable/cif **non** affectés (tunnel phase 3).
- [ ] Tests objectifs agence/entreprise verts.

### Tests

```bash
pnpm test -- sales-questions-objectifs-agence sales-questions-objectifs-entreprise
```

### Handoff

```text
Phase 4 —
Fait :
Pas fait :
Piège :
Suivant : phase 5
```

---

## Phase 5 — Chrome bleed + qualif

**Statut :** `todo`  
**Dépend de :** phases 3 et 4  
**Audiences :** toutes — copy split q3/q20/q21  
**Annexe :** discovery §6.3–§6.5 · pitch §6.4–§6.5 pour comptable/cif

### Objectif

Réinjecter bleed dans le parcours ; q21 agence ; qualif cabinets en lexique inbound.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `components/internal/funnels/sales/sales-funnel-sidebar.tsx` | Chip sticky (3 tokens max après Objectifs validés) |
| `components/internal/funnels/sales/sales-question-fields.tsx` | `bleedBenefit` sous prompts |
| `components/internal/funnels/sales/sales-funnel-section-page.tsx` | Subtitles sections interpolés |
| `components/internal/funnels/sales/sales-questions.ts` | q21 agence (créer) ; descriptions q3 bleed |
| `components/internal/funnels/sales/sales-questions-comptable.ts` | q3/q20/q21 copy pitch |
| `components/internal/funnels/sales/sales-questions-cif.ts` | Idem CIF |
| `lib/admin/funnels/comptable-sales-copy.ts` | Cues q21 si externalisés |

### Copy split

| Zone | agence / entreprise | comptable / cif |
|------|---------------------|-----------------|
| q3 | discovery §6.3 (volume dossiers/mandats) | pitch §6.4 (demandes inbound) |
| q20 | discovery §6.5 (bande passante Hercule) | pitch §6.5 (agenda inbound cabinet) |
| q21 | discovery §6.4 (différenciation PME) | pitch §6.5 (capture zone) |
| Conditions subtitle | sans 998/1499 | sans 998/1499 |

### Tâches

1. Widget ROI honoraires : **ne pas** finaliser ici si conflit pitch (phase 6 cabinets).
2. q1/q2 : chips froides, **zéro bleed** (discovery §5.5).

### DoD

- [ ] Chip sticky visible après Objectifs validés.
- [ ] q1/q2 sans bleed visible.
- [ ] q3, q21, q20 descriptions interpolées.
- [ ] q21 agence présent.
- [ ] Subtitles Conditions sans prix Lite/Starter.

### Tests

```bash
pnpm test -- sales-questions-cif compose-opportunity-cards
```

### Handoff

```text
Phase 5 —
Fait :
Pas fait :
Piège :
Suivant : phase 6
```

---

## Phase 6 — Présentation, règles, calendrier, ROI

**Statut :** `todo`  
**Dépend de :** phase 5  
**Audiences :** **split** — deux tracks, fichiers disjoints  
**Annexe :** discovery §6.6 · pitch §6.3–§6.7

### Objectif

Closing session : présentation, règles 24 h, calendrier, ROI.

### Track A — agence (+ entreprise si partagé)

| Fichier | Action |
|---------|--------|
| `components/internal/funnels/sales/sales-company-presentation-panel.tsx` | Pivot anti-confiance discovery §6.6 |
| `components/internal/funnels/sales/sales-intro-script.ts` | Si scripts agence |
| `components/internal/funnels/sales/sales-closing-panel.tsx` | Règles 24 h discovery |
| `components/internal/funnels/sales/sales-calendrier-panel.tsx` | Branche agence : reveal meetings + ROI #2 discovery §6.6 |
| `lib/admin/funnels/compose-opportunity-cards.ts` | Si cards calendrier agence |

### Track B — comptable + cif

| Fichier | Action |
|---------|--------|
| `lib/admin/funnels/comptable-sales-copy.ts` | Foundation paragraphs + highlights pitch §6.3 |
| `lib/admin/funnels/cif-sales-copy.ts` | Transposition CIF |
| `components/internal/funnels/sales/sales-company-presentation-panel.tsx` | Grille SEO vs Foundation ; schéma 4 blocs |
| `components/internal/funnels/sales/sales-calendrier-panel.tsx` | **Timeline 3 phases 60 j** — plus d’insertion RDV |
| `components/internal/funnels/sales/sales-closing-panel.tsx` | Règles SLA inbound pitch §6.5 |
| Widget ROI sous honoraires | pitch §6.6 (7 197 / 5 000 / 60 000) — **pas** 10 × taux |

### DoD

- [ ] Agence : pivot Pappers, calendrier meetings inchangé ou ROI discovery.
- [ ] Comptable/cif : pas de « 10 missions », pas de RDV incrustés au calendrier.
- [ ] Comptable/cif : grille SEO + script Foundation à l’écran.
- [ ] Comptable/cif : ROI = maths garantie, pas volume missions.
- [ ] `pnpm doctor` OK si UI touchée.

### Tests

```bash
pnpm test -- sales-calendrier-dates compose-opportunity-cards
```

### Handoff

```text
Phase 6 —
Fait :
Pas fait :
Piège :
Suivant : phase 7
```

---

## Phase 7 — Dashboard objections

**Statut :** `todo`  
**Dépend de :** phase 6  
**Audiences :** split  
**Annexe :** discovery §7 · pitch §7 pour comptable/cif

### Objectif

FAQ 3 objections, checkbox fusionnée, intention window, slides.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `lib/dashboard/onboarding-faq.ts` | 3 objections tête ; `CIF_FAQ` ; copy split |
| `components/dashboard/steps/step-faq-tie-down.tsx` | Ordre accordion |
| `components/dashboard/steps/step-intention-window.tsx` | **Créer** si absent |
| `components/dashboard/steps/step-hesitation-slides.tsx` | **Créer** ; 4 slides cabinets (slide zone pitch §7.6.1) |
| `components/dashboard/onboarding-comptable-wizard.tsx` | Brancher steps |
| `components/dashboard/onboarding-preview-wizard.tsx` | Agence — discovery §7 |
| Checkbox fusionnée | discovery §7.4 agence · pitch §7.5 cabinets |

### Copy split

| Audience | FAQ / intention / slides |
|----------|--------------------------|
| agence | discovery §7.3–§7.6 |
| comptable, cif | pitch §7.3–§7.7 (zone, 90 j, « Je sécurise la zone ») |
| entreprise | bleed Objectifs + FAQ confiance ; **pas** tunnel paiement B |

### DoD

- [ ] 3 FAQ objections **avant** items CGV.
- [ ] Checkbox bloque accès grille.
- [ ] 3 intentions → **toujours** grille (pas shortcut Stripe).
- [ ] Hésitation → slides → checkout.
- [ ] CIF a une entrée `FAQ_BY_AUDIENCE`.
- [ ] Bleed interpolé dans FAQ (`{gap}`, `{cause}`, honoraires) via API qualif.

### Tests

```bash
pnpm test -- onboarding-faq
```

### Handoff

```text
Phase 7 —
Fait :
Pas fait :
Piège :
Suivant : phase 8
```

---

## Phase 8 — Offre écran cabinets

**Statut :** `todo`  
**Dépend de :** phase 7  
**Audiences :** comptable + cif uniquement  
**Annexe :** pitch §7.2–§7.3, §9.1

### Objectif

Labels Core 1 799 / Horizon 2 399 et garantie 90 j à l’écran.

### Fichiers (exclusifs)

| Fichier | Action |
|---------|--------|
| `lib/commercial/constants.ts` | Constantes écran Core/Horizon/garantie 5000 (sans casser offer types Stripe existants) |
| `lib/commercial/constants.test.ts` | Mettre à jour |
| `components/dashboard/steps/step-pricing-card-comptable.tsx` | Labels Core / Horizon |
| `components/dashboard/steps/step-pricing-card.tsx` | **Ne pas** mélanger si agence reste sur ancienne grille |

### Hors phase (documenter seulement)

- Offer types Stripe `starter_999_5`, `monthly_1499`, `pack_3x1499`
- CGV / mentions légales garantie 5 000 €
- Pack 3 mois recalculé

### DoD

- [ ] Écran comptable/cif : Core 1 799 €, Horizon 2 399 € (reco).
- [ ] Garantie 5 000 € / 90 j visible pricing.
- [ ] Aucun « Lite 998 », « Starter 1 499 », « 10 missions » sur pricing cabinets.
- [ ] Agence pricing **inchangé** (discovery).

### Tests

```bash
pnpm test -- constants.test
```

### Handoff

```text
Phase 8 —
Fait :
Pas fait :
Piège :
Suivant : phase 9
```

---

## Phase 9 — QA finale

**Statut :** `todo`  
**Dépend de :** phases 1–8  
**Audiences :** toutes  
**Annexe :** discovery §11 · pitch §11

### Objectif

Validation bout-en-bout et grep lexique.

### Checklist

#### Mécanique (discovery §11)

- [ ] Carte diagnostic bloque navigation
- [ ] Chip sticky 3 tokens après Objectifs
- [ ] Historique absent sidebar
- [ ] Aucun tarif Hercule en session
- [ ] Dashboard : FAQ, checkbox, intention, slides
- [ ] Entreprise : pas tunnel paiement, bleed OK
- [ ] Copy B2B : pas « dormir », « faute », « retard » accusatoire

#### Bleed tunnel cabinets (bleed §9)

- [ ] b1→carte sans dead-end ; piège b6 interpolé
- [ ] Branches b7 par méthode ; b5b si multi
- [ ] Agence/entreprise : flux o1–o6 intact

#### Framing cabinets (pitch §11)

- [ ] Pas de `lead(s)` session + dashboard comptable/cif
- [ ] Pas 998, 1 499, 3 000 €, 10 missions, 20–25 jours (cabinets)
- [ ] Calendrier 3 phases ; pas pastilles RDV livrés
- [ ] Intention : pas « tester » / « pour voir »
- [ ] Badge licence zone sur slide hésitation
- [ ] Agence / entreprise : **pas** Foundation

#### Outreach

- [ ] Instantly / Calendly booking **non modifié**

### Browser

Par audience :

1. `/internal/funnels/{audience}/sales` → **Test** → parcours session complet.
2. Dashboard seed : intention → grille → checkout (comptable/cif/agence payants).

### Grep

Voir commande dans [`README.md`](./README.md) § QA commun.

### DoD

- [ ] Toutes les cases ci-dessus cochées ou explicitement reportées avec ticket.
- [ ] `pnpm doctor` vert.
- [ ] Tests sales + dashboard verts.

### Handoff

```text
Phase 9 —
Fait :
Pas fait :
Piège :
Suivant : patch terminé — PR / déploiement
```

---

## Handoff global (dernier agent)

```text
Patch Sales —
Phases done : 1–9
Blocages restants :
Décisions reportées (Stripe/CGV/ops cabinet_brand) :
```

---

## Référence rapide — fichiers par domaine

Tous sous `components/internal/funnels/sales/` sauf mention.

| Domaine | Fichiers clés |
|---------|----------------|
| Shell | `sales-funnel-module.tsx`, `sales-qualification-form.tsx` |
| Config | `sales-funnel-sections.ts`, `sales-funnel-sidebar.tsx` |
| Questions | `sales-questions*.ts`, `sales-questions-objectifs-*.ts` |
| Bleed | `lib/admin/funnels/sales-bleed-track.ts` |
| Closing | `sales-closing-sections.ts`, `sales-closing-panel.tsx`, `sales-calendrier-panel.tsx` |
| Dashboard | `components/dashboard/onboarding-*-wizard.tsx`, `lib/dashboard/onboarding-faq.ts` |
| Commercial | `lib/commercial/constants.ts` |
