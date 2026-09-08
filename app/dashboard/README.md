# Client Dashboard

Client-facing onboarding and delivery tracking — no login, slug in URL.

## AI agents

Before editing, read:

1. [`.cursor/rules/nextjs-hercule.mdc`](../../.cursor/rules/nextjs-hercule.mdc)
2. [`.cursor/skills/hercule-nextjs/SKILL.md`](../../.cursor/skills/hercule-nextjs/SKILL.md) (router)
3. [`.cursor/skills/hercule-nextjs-dashboard/SKILL.md`](../../.cursor/skills/hercule-nextjs-dashboard/SKILL.md) (this domain)

Canon: [doc/README.md](../../doc/README.md).

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/[slug]` | Client onboarding + delivery steps |
| `/survey/[token]` | Post-RDV survey (one-time token) |

## APIs

- `GET/PATCH /api/dashboard/[slug]`
- `POST /api/dashboard/[slug]/noshow`
- `GET/POST /api/survey/[token]`

## Components

`components/dashboard/*` — steps, onboarding modal, no-show dialog, delivery cards.

## Auth

Slug or survey token in URL — no client login. Validate server-side on every request.
