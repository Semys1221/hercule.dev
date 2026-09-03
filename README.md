# hercule.dev

Site Hercule (landing agence/entreprise) + CRM backend (link tracking, Calendly, Resend, Instantly).

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
pnpm crm          # Streamlit admin (separate terminal)
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
