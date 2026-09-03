# CRM deployment checklist (hercule.dev)

Use this after merging the migration to production.

## 1. Vercel project

1. Link this repo to Vercel (or transfer domain from old hercule.dev project).
2. Copy environment variables from the old project — see [`.env.example`](../../.env.example).
3. Required vars: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `INSTANTLY_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `LINK_TRACKING_WEBHOOK_SECRET`, `CALENDLY_WEBHOOK_SIGNING_KEY`.
4. Tracking URLs (already in `.env.example`):
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
- Header: `Authorization: Bearer <CRON_SECRET>`

## 5. Streamlit admin

Not hosted on Vercel. Run locally:

```bash
pnpm crm
```

Or deploy `crm/` to Streamlit Cloud with the same env vars as root `.env`.

## 6. Post-deploy smoke test

- [ ] `GET /api/booking/config` returns Calendly URL
- [ ] `GET /reservation.html/testslug` loads Calendly with tracking
- [ ] `POST /api/link-tracking/click` with valid slug returns 200
- [ ] Calendly test booking updates Supabase statut
- [ ] `GET /api/cron/booking-emails` with Bearer token returns `{ ok: true }`
- [ ] Email confirm link opens `/confirm-reservation.html?code=…&email=…`
