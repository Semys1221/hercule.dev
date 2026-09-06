# 02 — Composants

Taxonomie : **component** | **api_route** | **webhook** | **cron** | **orchestrator** | **html_public** | **streamlit**.  
Rendu : Server Component par défaut ; `"use client"` seulement si interaction.

Primitives Shadcn (`components/ui/*`) : **réutilisées**, non détaillées ici (`ENG-11`).

---

## PARTIE 1 — Ce qui est valide

- Landing agence / entreprise composées de blocs Shadcn + sections métier (`components/agence/*`, `entreprise/*`).
- Funnel builder interne : editor + preview registry + APIs fichiers.
- Fiche onboarding **admin** (`fiche-form`) → API → Supabase : built.
- Registries `/internal/components` et `/internal/database` : documentation vivante (incomplète vs ce package, mais direction juste).
- Orchestrateurs extraits de l’UI (`lib/booking-communication`, bypass, AI).

Duplications identifiées (dette, pas question) : `hooks/use-toast.ts` vs `components/ui/use-toast.ts` ; panels `ui-panel-*` non routés.

---

## PARTIE 2 — Écarts

- Registry : pages client `onboarding`, `suivi`, `survey` en **spec** — fichiers absents.
- `dashboard-kpis` status `wip` — pas de page KPI réelle sous funnels.
- `matching-admin-action` path inventé `/api/deliverance/match`.
- FAQ editor dit lire `doc/tech-stack` ; le site lit plutôt `content/` / `lib/site` — SoT copy à confirmer ([CPY](./09-copywriting-validation.md)).
- Streamlit n’est pas un composant React : le registry le liste quand même (utile) mais mélange kinds.

Pas de question « faut-il Shadcn » (`ENG`).

#### [COMP-01] L’inventaire `/internal/components` doit-il devenir la SoT **vivante** des kinds (component/api/webhook/cron) après ce package, ou rester un aperçu partiel ?

Aujourd’hui le registry a ~22 entries ; ce package est plus complet. Deux sources divergeront.

- [ ] **A (recommandé)** — Après architecture définitive : le registry TypeScript est aligné sur la doc canonique (CI test déjà présent) ; `/internal/components` = vue de cette SoT.
- [ ] **B** — Garder le registry comme prototype ; la doc `doc/` (puis planning → tech-stack) reste la SoT.
- [ ] **C** — Supprimer les pages `/internal/components` et `/internal/database` ; inventaire seulement en markdown.

**Impact si l’architecture change :** Low  
**Domaines affectés :** Internal, registries

#### [COMP-02] Le funnel builder ne peut-il **que réutiliser** les widgets du catalogue (pas en créer de nouveaux depuis l’UI) ?

C’est le comportement actuel (presets / layouts fichiers). L’intention ops : composer, pas inventer des primitives.

- [ ] **A (recommandé)** — Catalogue **fermé** dans l’UI ; les ingénieurs ajoutent des widgets via `content/funnels/_system/presets-catalog.json` (ou code).
- [ ] **B** — L’UI permet de créer de nouveaux types de steps / composants.
- [ ] **C** — Catalogue éditable **seulement** par fichiers (jamais l’UI), y compris pour réordonner les presets.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Funnel builder, presets-catalog, ADM-01

---

## Fiches — surfaces de domaine

Légende data : **props** · **fetch serveur** · **fetch client** · **mutation serveur**.

### Funnel editor

| Champ | Valeur |
|-------|--------|
| **Nom / lieu** | `FunnelEditor` — `components/internal/funnels/builder/funnel-editor.tsx` |
| **Purpose / domaine** | Éditer `funnel.json` — sales_funnel |
| **Used by** | `/internal/funnels/[audience]/[[...path]]` |
| **Props** | funnel chargé, catalogs layouts/presets |
| **Data received** | props depuis page serveur (filesystem) |
| **Data source** | `content/funnels/**` |
| **Local state** | editor client |
| **Server state** | fichiers |
| **SC / CC** | Client editor |
| **Actions** | save, publish |
| **Mutation** | `/api/admin/funnels/[slug]` PATCH, `/publish` POST |
| **Events / workflows** | aucun métier lead |
| **Services** | filesystem |
| **DB** | — |
| **Permissions** | aucune app (`API-01`) |
| **Loading / error / empty** | toolbar builder |
| **SoT** | fichier JSON |
| **Reusable** | non, domain-specific |
| **Status** | active built |

### Fiche form (onboarding admin)

| | |
|--|--|
| **Lieu** | `components/internal/funnels/fiche-form.tsx` |
| **Purpose** | Créer lead ONBOARDED |
| **Actor** | admin |
| **Data out** | INSERT via `/api/admin/onboarding/[category]` |
| **Fetch** | mutation client → API |
| **DB** | agence/entreprise, profile, slug |
| **Event** | onboarding admin (pas d’email confirm dans le code) |
| **Status** | built |
| **vs spec** | la spec voulait un form **client** `app/onboarding/[category]` |

### Demandes carousel

| | |
|--|--|
| **Lieu** | `components/agence/demandes-carousel.tsx` |
| **Purpose** | Marketing homepage |
| **Data** | fetch serveur `agence_demandes` |
| **Mutation** | aucune (édition = mockup-editor / Streamlit) |
| **Status** | built |

### Mockup / FAQ / Pricing / Legal editors

Internal, audience agence|entreprise, filesystem ou `agence_demandes`. Mutations admin API sans auth. Status built.

### Calendly webhook (pas un composant UI)

Kind **webhook**. Voir [05](./05-api-webhooks-crons-validation.md). Data in payload ; out lead + jobs. Idempotent rebook.

### Booking orchestrator

Kind **orchestrator**. `lib/booking-communication/orchestrator.ts`. Pas d’UI. Steps : plan types → insertJob → cron send → Resend. Services : Supabase, Resend, Calendly h20.

### Reservation HTML

Kind **html_public**. `public/reservation.html` (+ entreprise, confirm, temporary, post-booking). Fetch client `/api/link-tracking/click`, `/api/booking/config`, `/api/calendly/availability`. Redirect Calendly. Pas de React.

### Streamlit CRM links

Kind **streamlit**. `app/streamlit_links/app.py`. Lit Supabase ; POST CRM_BACKEND_URL (trigger, etc.). Permissions : Streamlit Cloud / local, secrets env.

### Internal hub

`app/internal/(shell)/page.tsx` — Server Component, cards Shadcn vers funnels / components / database. Pas de data métier.

### Spec only (pas de fichier)

| Nom | Route spec | Status |
|-----|------------|--------|
| Client onboarding form | `app/onboarding/[category]/page.tsx` | spec |
| Deliverance timeline | `app/suivi/[category]/[slug]/page.tsx` | spec |
| Post-RDV survey | `app/survey/[token]/page.tsx` | spec |
| Dashboard KPIs | `app/internal/funnels/[audience]/dashboard` | wip/absent |

---

## Inventaire classé (registry + audit)

| id | kind | domain | status | route |
|----|------|--------|--------|-------|
| fiche-form | component | onboarding | built | fiche-form.tsx |
| fiche-form-api | api_route | onboarding | built | /api/admin/onboarding |
| funnel-editor | component | sales | built | funnel-editor.tsx |
| funnel-step-preview | component | sales | built | preview-registry.tsx |
| mockup-editor | component | marketing | built | mockup-editor.tsx |
| faq-editor | component | sales | built | faq-editor.tsx |
| pricing-editor | component | sales | built | pricing-editor.tsx |
| legal-doc | component | sales | built | legal-doc.tsx |
| agence-carousel | component | marketing | built | demandes-carousel.tsx |
| webhook-calendly | webhook | crm | built | /api/webhooks/calendly |
| webhook-instantly | webhook | crm | built | /api/webhooks/instantly |
| webhook-resend | webhook | communication | built | /api/webhooks/resend |
| cron-booking-emails | cron | communication | built | /api/cron/booking-emails |
| instantly-bypass-cron | cron | communication | built | /api/cron/instantly-bypass-jobs |
| pipeline-cron | cron | communication | built | /api/cron/instantly-bypass-pipeline |
| ai-reply-agent-cron | cron | communication | built | /api/cron/ai-reply-agent-jobs |
| booking-orchestrator | orchestrator | communication | built | orchestrator.ts |
| streamlit-links | streamlit | internal | built | streamlit_links |
| streamlit-booking-resend | streamlit | internal | built | streamlit_booking_resend |
| funnels-api-crud | api_route | sales | built | /api/admin/funnels* |
| link-tracking-click | api_route | crm | built | /api/link-tracking/click |
| onboarding-client-form | component | onboarding | spec | — |
| deliverance-timeline | component | dashboard_client | spec | — |
| post-rdv-survey | component | dashboard_client | spec | — |
| matching-admin-action | api_route | internal | spec | — |
| dashboard-kpis | component | internal | wip | — |

Landing marketing : nombreux `components/agence/*` et `entreprise/*` — recipient, data = copy + carousel DB. **Active.**

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| COMP-01 | | |
| COMP-02 | | |
