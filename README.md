# hercule.dev

Site Hercule (landing agence/entreprise) + CRM backend (link tracking, Calendly, Resend, Instantly).

## AI agents

Before editing Next.js code (`app/`, `components/`, `lib/`, `emails/`, `content/`), read:

1. [`.cursor/rules/nextjs-hercule.mdc`](.cursor/rules/nextjs-hercule.mdc) (enforced when matching paths are open)
2. [`.cursor/skills/hercule-nextjs/SKILL.md`](.cursor/skills/hercule-nextjs/SKILL.md) (router)
3. The domain sub-skill for your area (internal, marketing, sales-funnel, dashboard, crm, communication, product)

Canon: [doc/README.md](doc/README.md) reading order for business rules. Streamlit tools: [hercule-streamlit](.cursor/skills/hercule-streamlit/SKILL.md).

## Development

```bash
pnpm install
pnpm dev
```

## CRM

See [app/crm/doc.md](app/crm/doc.md) for the full CRM documentation.

Quick start:

```bash
pnpm dev          # Next.js API + site
pnpm streamlit-links          # Streamlit link tracking (separate terminal)
```

Copy `.env.example` to `.env` and fill in Supabase, Instantly, Resend, and Calendly credentials.

## Pages

- `/` — landing agence
- `/entreprise` — landing entreprise
- `/reservation.html` — Calendly agence (with optional slug tracking)
- `/reservation-entreprise.html` — Calendly entreprise (with optional slug tracking)
- `/confirm-reservation.html` — email confirmation page

## Scripts

```bash
pnpm configure-calendly-link-tracking-webhook
pnpm apply-agence-entreprise-migration          # if schema not yet applied
pnpm apply-crm-booking-communication-migration  # if schema not yet applied
```

Production deployment: [doc/crm-deployment.md](doc/crm-deployment.md)
