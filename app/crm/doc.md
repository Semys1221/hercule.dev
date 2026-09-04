# Hercule CRM

Link tracking, Calendly booking, and Resend confirmation sequence for **agence** / **entreprise** leads.

## Next.js (site + API)

```bash
pnpm install
pnpm dev
```

Routes:

- `GET /reservation.html/{slug}` — Calendly embed agence (`utm_content` = slug)
- `GET /reservation-entreprise.html/{slug}` — Calendly embed entreprise
- `GET /confirm-reservation.html?code={slug}&email={email}` — presence confirm
- `POST /api/webhooks/calendly` — `invitee.created`
- `GET /api/cron/booking-emails` — every 15 minutes

## Streamlit CRM

```bash
pnpm crm
```

Needs Next.js running for status/sequence APIs (`CRM_BACKEND_URL`, default `http://localhost:3000`).

See [crm/README.md](../../crm/README.md) for admin features.

## Lead tools

### Scraper (Outscraper → enrich → Instantly)

```bash
cd app/scrapper_streamlit && pip install -r requirements.txt
pnpm scrapper
```

See [scrapper_streamlit/README.md](../scrapper_streamlit/README.md) for presets and CLI commands.

### Email cleaner (MyEmailVerifier → Instantly)

```bash
cd app/streamlit_clean && pip install -r requirements.txt
pnpm streamlit-clean
```

Requires `MYEMAILVERIFIER_API_KEY` and `INSTANTLY_API_KEY` in the repo root `.env`.

## Calendly webhook

```bash
pnpm configure-calendly-link-tracking-webhook
```

Registers `invitee.created` → `https://www.hercule.dev/api/webhooks/calendly`.

## Instantly variables

On the **Provisioning** tab, REPLACE Instantly `custom_variables` with:
- `{{reservation_agence_link}}` — `https://www.hercule.dev/reservation.html/{slug}`
- `{{reservation_entreprise_link}}` — `https://www.hercule.dev/reservation-entreprise.html/{slug}`
- `{{confirmation_agence_link}}` — `https://www.hercule.dev/confirm-reservation.html/{slug}?email=`
- `statut`

Legacy `{{link}}` / `{{confirm_link}}` are wiped. Update Instantly sequence copy to the new names.

Resend email 2 (`h48_confirm`) interpolates `{{confirmation_agence_link}}` (alias `{{confirmUrl}}`).

Copy: [doc/emails_booking](../../doc/emails_booking)

## Booking-email cron

`GET /api/cron/booking-emails` requires `Authorization: Bearer $CRON_SECRET` (or header `x-cron-secret`).

Vercel Hobby only allows daily crons, so use [cron-job.org](https://cron-job.org) (free):

1. Create job → URL `https://www.hercule.dev/api/cron/booking-emails`
2. Schedule: every 15 minutes (`*/15 * * * *`)
3. Request method: `GET`
4. Custom request header: `Authorization: Bearer <CRON_SECRET>`

## Instantly bypass cron

`GET /api/cron/instantly-bypass-jobs` — same auth as booking-emails. Drains `instantly_bypass_jobs` (manual sends scheduled outside 8h–17h Paris).

1. Create job → URL `https://www.hercule.dev/api/cron/instantly-bypass-jobs`
2. Schedule: every 10 minutes (`*/10 * * * *`)
3. Request method: `GET`
4. Custom request header: `Authorization: Bearer <CRON_SECRET>`

Or run `pnpm configure-instantly-bypass-cron` after adding `CRON_JOB_ORG_API_KEY` to `.env`.

Expect `200` with `{"ok":true,"processed":…}`. `401` means the header does not match Vercel `CRON_SECRET`. `404` means the route is not deployed yet.

After a Vercel Pro upgrade, you can use Vercel cron instead:

```json
"crons": [{ "path": "/api/cron/booking-emails", "schedule": "*/15 * * * *" }]
```

Production deployment checklist: [doc/crm-deployment.md](../../doc/crm-deployment.md)

## Data flow

**Reading (CRM board):** Streamlit → Supabase (list leads, refresh).

**Writing (booking):** Calendly webhook → Next.js API → Supabase (MEETING_BOOKED) → Instantly sync → Resend email sequence.

**Manual status change:** Streamlit → Next.js API (`/api/link-tracking/sync-status`, `/api/booking-communication/trigger`) → Supabase + Instantly + Resend.
