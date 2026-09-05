# CRM deployment checklist (hercule.dev)

Use this after merging the migration to production.

## 1. Vercel project

1. Link this repo to Vercel (or transfer domain from old hercule.dev project).
2. Copy environment variables from the old project — see [`.env.example`](../../.env.example).
3. Required vars: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `INSTANTLY_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `LINK_TRACKING_WEBHOOK_SECRET`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_API_TOKEN`.
4. Optional Calendly event type URIs for reservation availability banners (auto-resolved from scheduling URL if omitted):
   - `CALENDLY_EVENT_TYPE_URI_AGENCE` — `https://calendly.com/hercule-connect/30min`
   - `CALENDLY_EVENT_TYPE_URI_ENTREPRISE` — `https://calendly.com/hercule-connect/candidature-web-apport-d-affaires-clone`
5. Tracking URLs (already in `.env.example`):
   - `TRACKING_BASE_URL_AGENCE=https://www.hercule.dev/reservation.html`
   - `TRACKING_BASE_URL_ENTREPRISE=https://www.hercule.dev/reservation-entreprise.html`
   - `BOOKING_CONFIRM_BASE_URL=https://www.hercule.dev/confirm-reservation.html`

## 2. vercel.json

Already configured with slug rewrites for both reservation pages.

## 3. Calendly webhook

```bash
pnpm configure-calendly-link-tracking-webhook
```

Target: `https://www.hercule.dev/api/webhooks/calendly` (event: `invitee.created`).

## 4. Booking email cron (every 15 min)

On Vercel Hobby, use [cron-job.org](https://cron-job.org):

- URL: `https://www.hercule.dev/api/cron/booking-emails`
- Method: `GET`
- Schedule: `*/15 * * * *`
- Header: `Authorization: Bearer <CRON_SECRET>`

Automated registration (add `CRON_JOB_ORG_API_KEY` to `.env` from cron-job.org Console → Settings):

```bash
pnpm configure-booking-cron
```

**Deploy first:** production must include the route before the cron returns `200`.

## 5. Instantly bypass cron (every 10 min)

Manual Streamlit sends outside the Paris send window are queued in `instantly_bypass_jobs`. This cron drains due jobs.

Use [cron-job.org](https://cron-job.org) only (no Vercel cron — see `vercel.json`):

- URL: `https://www.hercule.dev/api/cron/instantly-bypass-jobs`
- Method: `GET`
- Schedule: `*/10 * * * *`
- Header: `Authorization: Bearer <CRON_SECRET>` (same value as Vercel Production)

Automated registration (add `CRON_JOB_ORG_API_KEY` to `.env` from cron-job.org Console → Settings):

```bash
pnpm configure-instantly-bypass-cron
```

**Deploy first:** production must include the route before the cron returns `200`.

Sync `CRON_SECRET` to Vercel if it differs from local `.env`:

```bash
vercel env add CRON_SECRET production --force --yes --value "<same as .env>"
```

## 6. Streamlit admin

Not hosted on Vercel. Run locally:

```bash
pnpm crm
```

Or deploy `crm/` to Streamlit Cloud with the same env vars as root `.env`.

## 7. Post-deploy smoke test

- [ ] `GET /api/booking/config` returns Calendly URL
- [ ] `GET /reservation.html/testslug` loads Calendly with tracking
- [ ] `POST /api/link-tracking/click` with valid slug returns 200
- [ ] Calendly test booking updates Supabase statut
- [ ] `GET /api/cron/booking-emails` with Bearer token returns `{ ok: true }`
- [ ] `GET /api/cron/instantly-bypass-jobs` with Bearer token returns `{ ok: true }`
- [ ] Email confirm link opens `/confirm-reservation.html?code=…&email=…`
