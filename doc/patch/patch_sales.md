# Patch Sales — Session live (3 niches)

```
status: implementation-spec
audience: coding-agent
date: 2026-09-13
depends_on:
  - ../tech-stack/00-decisions.md
  - ../tech-stack/03-data-model.md
  - ../tech-stack/09-surfaces.md
  - ../tech-stack/modules/cms-funnels.md
  - ../tech-stack/modules/sales-ops.md
  - patch_bookings.md
do_not:
  - Dupliquer Bookings CRM / SequenceWorkspace / Clients gate (patch_bookings phases 2–7)
  - Brancher la session live via leaf-content ou catch-all workspace
  - Fusionner agence / entreprise / comptable en une table lead
  - Faire de Stripe la gate d'apparition Clients
  - Matching cabinet↔TPE dans ce patch
  - Backfill entreprise → comptable
  - Réécrire reservation*.html en Next avant parité SUR-02
  - Ajouter un login /internal
```

Canon inchangé : `lead_statut` = acquisition ; `product_statut` = livraison ; `sales_calls.status` ≠ livraison ; orchestrateur = webhook → job → cron.

**Relation patch_bookings :** phases 0–1 (IA cockpit + data plane comptable) sont prérequis et largement livrés. Ce patch couvre **uniquement le module Session** (hub ops + funnel live plein écran).

---

## 0. Décisions verrouillées

| Sujet | Choix |
|-------|--------|
| Hub Session | `/internal/funnels/session/{niche}` — CTA unique « Ouvrir la session » |
| Live funnel | `/internal/funnels/{niche}/sales/funnel` **inchangé** (hors catch-all) |
| Entreprise session | **Garder** le funnel existant (sections agence + objectifs entreprise) |
| Comptable closing | Étape **activation** = checkout Stripe embedded (`SalesComptablePricingPanel`) |
| Agence closing | Pas d'étape activation in-session (lien dashboard seulement) |
| Calendly Comptable absent | `InternalStatusAlert` sur Rendez-vous — pas de fallback silencieux vers event agence |
| Test meeting | 1 preset / niche → table SoT correcte (`agence` / `comptable` / `entreprise`) |

---

## 1. Surfaces

| Surface | URL |
|---------|-----|
| Hub Session | `/internal/funnels/session/{niche}` |
| Live session | `/internal/funnels/{niche}/sales/funnel` |
| Session settings | `…/funnel/settings` |
| Legacy (redirect) | `/internal/funnels/{niche}/sales` → `session/{niche}` |

Fichiers clés :

- [`components/internal/funnels/sales/`](../../components/internal/funnels/sales/) — UI live
- [`lib/admin/funnels/sales-audience.ts`](../../lib/admin/funnels/sales-audience.ts) — niche → table
- [`lib/admin/funnels/provision-test-meeting.ts`](../../lib/admin/funnels/provision-test-meeting.ts) — seed test
- [`content/funnels/{niche}/sales/session-settings.json`](../../content/funnels/agence/sales/session-settings.json)

---

## 2. Phases d'implémentation

| Phase | Livrable | Done when |
|-------|----------|-----------|
| **0 — Spec** | Ce document | Scope Session isolé de patch_bookings §6–8 |
| **1 — Live parity** | Links comptable Rendez-vous ; alerte Calendly ; checkout activation ; preset entreprise | Comptable session close → Stripe ; 3 presets test ; links CRM corrects |
| **2 — Verification** | Playwright comptable + README | E2E Test button comptable ; hub paths documentés |

---

## 3. Phase 1 — critères d'acceptation

1. Rendez-vous comptable affiche `reservation_comptable_link` / `confirmation_comptable_link`, pas les colonnes agence.
2. Sans `CALENDLY_EVENT_TYPE_URI_COMPTABLE`, alerte visible sur Rendez-vous (hub + funnel restent ouvrables).
3. Closing comptable : recap → règles → missions → calendrier → **activation (checkout)** → dashboard.
4. Tie-downs bloquent checkout jusqu'à `reglesAccepted && calendrierAccepted`.
5. Test entreprise écrit dans `entreprise` + `sales_calls.entreprise_id`, pas `agence`.
6. Agence session inchangée (pas d'étape activation).

---

## 4. Hors scope (explicite)

- Bookings CRM, stats Instantly, SequenceWorkspace (patch_bookings)
- Clients gate `onboarding_completed_at` (patch_bookings phase 5)
- `public/reservation-comptable.html` — ops SUR-02
- Matching cabinet ↔ TPE
- Playwright comptable (phase 2)

---

## 5. Plan de test

**Automatique**

- `sales-session-links.test.ts` — résolution links comptable
- `sales-closing-sections.test.ts` — activation dans sections comptable
- `sales-test-session-preset.test.ts` — 3 niches
- `scripts/crm/smokeEntrepriseTestMeeting.ts` — seed entreprise

**Manuel**

1. `/internal/funnels/session/comptable` → session → Rendez-vous (alerte + links)
2. Closing comptable → activation → cartes Stripe
3. Entreprise → Test → row `entreprise`
4. Agence regression closing sans activation
