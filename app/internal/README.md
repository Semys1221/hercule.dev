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

## Hors scope (inchangé)

Ces mécanismes restent en place ailleurs dans le projet :

- `CRON_SECRET` — jobs planifiés (`/api/cron/*`)
- Webhooks Calendly, Instantly, Resend
- Tokens survey client (post-RDV)
