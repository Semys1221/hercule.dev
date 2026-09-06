# 05 — API, webhooks, crons

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Taxonomie : **route API** ≠ **webhook** ≠ **cron** ≠ **action UI**. Aucune Server Action.

Auth réelle : par route. **Pas** de middleware Next.

`ENG-04` : fail-closed si secret vide — à implémenter **après** validation, pas maintenant.

---

## PARTIE 1 — Ce qui est valide

- Webhooks Calendly (HMAC si clé), Resend (Svix), Instantly (bearer) existent et font le travail CRM.
- Crons Bearer `CRON_SECRET` / `x-cron-secret`.
- Booking-communication (trigger, templates, send-once, render, role-sequence) : Bearer `LINK_TRACKING_WEBHOOK_SECRET` \|\| `CRON_SECRET` — cockpit Streamlit.
- Zod sur onboarding admin.
- Click/confirm publics **volontaires** (le secret est le slug).
- Availability Calendly publique + cache : banners HTML.

---

## PARTIE 2 — Écarts

- `/api/admin/*` : **aucune auth** (CF-09). Politique écrite dans `app/internal/README.md`.
- Routes produit documentées **absentes** : `/api/onboarding/[category]`, `/api/deliverance/*`, `/api/matching/link`, `/api/post-rdv/survey`, `payment-confirmed`.
- Registry : matching listé comme `/api/deliverance/match` — encore un **troisième** path. (`ENG` : un seul path le jour J, nommé d’après FND-05).
- Calendly signing key vide → pas de vérif (`ENG-04`).
- Cron secret vide → autorisé (`ENG-04`).

#### [API-01] Les routes `/api/admin/*` (funnels, FAQ, pricing, demandes, onboarding) doivent-elles rester appelables sans session applicative, conformément au README internal ?

C’est une **politique produit / ops**, pas un détail HTTP. Répondre de façon cohérente avec [SEC-01](./12-security-permissions-validation.md) (même sujet, option C = split lectures / mutations).

- [ ] **A (recommandé)** — Non : exiger une auth (session, SSO, ou au minimum le même Bearer ops que le CRM) sur toute mutation admin, y compris funnels.
- [x] **B** — Oui : préserver **aucune auth app** ; isolation = URL / déploiement non public (README actuel).
- [ ] **C** — Split : lectures et funnel filesystem ouverts en interne ; **onboarding INSERT** et **demandes PATCH** protégés.

**Impact si l’architecture change :** High  
**Domaines affectés :** Sécurité, `/internal`, onboarding  
**Ancien ID :** — (politique récente vs V-04)

---

## Inventaire API

| Route | Méthodes | Caller | Auth | Input | Validation | DB | External | Response | Side effects | Idempotence |
|-------|----------|--------|------|-------|------------|----|----------|----------|--------------|-------------|
| `/api/admin/onboarding/[category]` | POST | Funnel fiche / fetch | **aucune** | JSON fiche | Zod agence/entreprise | INSERT lead + profile | — | row / 409 duplicate | slug URLs | email unique |
| `/api/admin/demandes` | GET PATCH | mockup editor | aucune | patch fields | repo | agence_demandes | — | list / row | carousel | — |
| `/api/admin/faq/[audience]` | GET PUT | faq-editor | aucune | markdown | audience | **fichiers** | — | content | site FAQ | overwrite |
| `/api/admin/pricing/[audience]` | GET PUT | pricing-editor | aucune | markdown | audience | fichiers | — | content | site pricing | overwrite |
| `/api/admin/funnels` | GET POST | builder | aucune | catalog / create | slug | fichiers | — | list | — | — |
| `/api/admin/funnels/catalog` | GET | builder | aucune | — | — | fichiers | — | catalog | — | — |
| `/api/admin/funnels/edits` | POST | builder | aucune | layout/component | — | `edits_to_make/` | — | ok | — | — |
| `/api/admin/funnels/[slug]` | GET PATCH DELETE | builder | aucune | funnel.json | — | fichiers | — | funnel | — | — |
| `/api/admin/funnels/[slug]/publish` | POST | builder | aucune | — | — | fichiers | — | published | preview | — |
| `/api/link-tracking/click` | POST | HTML reservation | public slug | `{slug}` | required | statut CLICKED | Instantly | ok | sync interest | click déjà fait = no-op |
| `/api/link-tracking/confirm` | GET/POST | HTML confirm | slug+email | query/body | — | CONFIRMED | Instantly | ok | cancel h24 | already confirmed |
| `/api/link-tracking/calendly-links` | GET/POST | scripts / intern | (voir route) | lead | — | join/reschedule URLs | Calendly API | links | — | retry |
| `/api/link-tracking/sync-status` | POST | scripts | Bearer | lead | — | instantly_synced_at | Instantly | ok | — | — |
| `/api/booking/config` | GET | HTML | public | — | — | — | env Calendly URL | json | — | — |
| `/api/calendly/availability` | GET | HTML | public | — | — | — | Calendly | slots | cache | — |
| `/api/booking-communication/trigger` | POST | Streamlit | Bearer | lead + types | category | jobs | — | ok | enqueue | job keys |
| `/api/booking-communication/send-once` | POST | Streamlit | Bearer | job/type | — | jobs | Resend | ok | send | key |
| `/api/booking-communication/render` | POST | Streamlit | Bearer | type | — | templates | — | html | — | — |
| `/api/booking-communication/templates` | GET PUT | Streamlit | Bearer | subject/body | — | templates | — | — | — | overwrite |
| `/api/booking-communication/templates/test` | POST | Streamlit | Bearer | — | — | — | Resend | — | email test | — |
| `/api/booking-communication/role-sequence/start` | POST | scripts/Streamlit | Bearer | lead | — | jobs | — | ok | role_seq | keys |

**Absentes (spec) :** onboarding public, deliverance GET/promote, matching/link, post-rdv/survey, payment-confirmed, session admin (supprimée).

---

## Webhooks

| Provider | Event | Endpoint | Auth | Payload | Mutation | Business event | Downstream | Idempotence | Retry provider | Échec |
|----------|-------|----------|------|---------|----------|----------------|------------|-------------|----------------|-------|
| Calendly | invitee.created | `/api/webhooks/calendly` | HMAC (skip si clé vide) | invitee + utm_content | book lead | RDV créé | jobs + Instantly | rebook same invitee | Calendly retries | 401/500 |
| Calendly | invitee.canceled | idem | HMAC | email | CANCELLED | RDV annulé | cancel jobs + Instantly | already CANCELLED | idem | 500 logged |
| Calendly | autres | idem | — | — | ignore 200 | — | — | — | — | — |
| Resend | opened/clicked/delivered | `/api/webhooks/resend` | Svix `RESEND_WEBHOOK_SECRET` | email_id | engagement timestamps | — | — | earliest ts | Resend | 400/503 si secret manquant |
| Instantly | lead_interested | `/api/webhooks/instantly` | Bearer bypass\|\|cron (open si vide) | campaign, email | bypass E1 | interested | Instantly send/queue | event key | Instantly ; ACK 200 skips | 401/500 |
| Instantly | reply | `/api/webhooks/instantly/reply` | idem | thread | AI messages | reply inbound | Grok / Instantly | email id | ACK 200 | 401/500 |
| Supabase | UPDATE booked | `/api/webhooks/supabase-link-tracking` | LINK_TRACKING_WEBHOOK_SECRET | row | Instantly sync | retry sync | Instantly | sync flags | Supabase webhook | 401 |

---

## Crons (cron-job.org, pas Vercel)

| Schedule (doc) | Purpose | Entry | Query | External | DB | Concurrency | Retry | Idempotence |
|----------------|---------|-------|-------|----------|----|-------------|-------|-------------|
| */15 | booking emails + retry Calendly links | `/api/cron/booking-emails` | due pending jobs | Resend, Calendly | jobs, leads | 1 | fail=failed | keys |
| */10 | drain bypass queue | `/api/cron/instantly-bypass-jobs` | due jobs | Instantly | bypass_jobs | 1 | — | keys |
| (pipeline script) | advance E2/E3/close | `/api/cron/instantly-bypass-pipeline` | due steps | Instantly | pipeline | 1 | — | step |
| (AI script) | drain AI manual jobs | `/api/cron/ai-reply-agent-jobs` | due | Instantly | ai jobs | 1 | — | keys |

Auth : `CRON_SECRET` ; **si unset → 200 ouvert**. Scripts : `pnpm configure-*-cron`, `pnpm audit-crons`.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| API-01 | B | Pas de login admin |
