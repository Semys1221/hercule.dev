# Internal — politique d'accès

## AI agents

Before editing, read:

1. [`.cursor/rules/nextjs-hercule.mdc`](../../.cursor/rules/nextjs-hercule.mdc) (enforced when matching paths are open)
2. [`.cursor/skills/hercule-nextjs/SKILL.md`](../../.cursor/skills/hercule-nextjs/SKILL.md) (router)
3. [`.cursor/skills/hercule-nextjs-internal/SKILL.md`](../../.cursor/skills/hercule-nextjs-internal/SKILL.md) (this domain)

Canon: [doc/README.md](../../doc/README.md) reading order for business rules.

L'espace `/internal` (Funnel Builder, inventaire composants, inventaire database) est un **outil interne sans authentification applicative**.

## Ce qu'on ne veut pas

- Page de login ou formulaire mot de passe dans `app/internal`
- Middleware Next.js qui protège `/internal`
- Guards cookie / Bearer (`ADMIN_SECRET`, `hercule_admin_session`) sur les pages ou APIs funnel
- Table Supabase pour sessions admin

## Sécurité réelle

L'accès repose sur le **déploiement** (URL non publique, équipe restreinte), pas sur une couche login dans l'app. Les layouts internal utilisent déjà `robots: noindex`.

## APIs associées

Les routes `/api/admin/*` qui servent le funnel builder (funnels, FAQ, pricing, demandes, onboarding) sont appelées **sans auth** depuis l'UI internal. Ne pas réintroduire `verifyAdminRequest` ni `POST /api/admin/session` pour ce périmètre.

## SequenceWorkspace (Phase 3)

Variables d'environnement pour les envois test et l'historique :

| Variable | Usage |
|----------|--------|
| `SEQUENCE_TEST_LEAD_ID_AGENCE` | FK fixture pour les lignes `booking_email_jobs` (Historique). Fallback : premier lead agence avec email. |
| `SEQUENCE_TEST_LEAD_ID_COMPTABLE` | Idem niche comptable. |
| `SEQUENCE_TEST_LEAD_ID_ENTREPRISE` | Idem niche entreprise. |
| `NEXT_PUBLIC_OPS_TEST_EMAIL` | Destinataire par défaut du dialog Tester (ex. `ops@hercule.dev`). Redémarrer le dev server après modification. |

Tests : `pnpm test-bookings-patch` (unit) ; `pnpm test-resolve-booking-lead` (intégration DB).

## Variables email — Bookings DB (Phase 7)

Onglet **DB** sous `/internal/funnels/bookings/{niche}` :

- **Vérifier** — `POST /api/admin/niches/{niche}/variables/verify` (scan leads campagne liée)
- **Provisionner** — `POST /api/admin/niches/{niche}/variables/provision` (PATCH Instantly depuis Supabase)
- CLI : `pnpm verify-email-variables -- --niche agence` (même lib que l'API ; exit 1 si mismatch)

Prérequis : campagne Instantly liée via la section « Lier campagne » ; `INSTANTLY_API_KEY` + Supabase service role en local.

## Hors scope (inchangé)

Ces mécanismes restent en place ailleurs dans le projet :

- `CRON_SECRET` — jobs planifiés (`/api/cron/*`)
- Webhooks Calendly, Instantly, Resend
- Tokens survey client (post-RDV)
