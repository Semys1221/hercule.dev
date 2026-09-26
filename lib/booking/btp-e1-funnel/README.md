# BTP Interested E1–E3 — funnel metrics

## CTA (emails)

Shared tracking URL (no per-lead slug):

`https://www.hercule.dev/reservation/btp.html`

Redirects to `https://calendly.com/jum-advisory/rendez-vous-comptable-btp` after recording an anonymous click.

## Clicks

- **Shared URL** — rows in `btp_e1_eligibility_clicks` (`clicked_at`).
- **Legacy per-lead** — `leads` with `instantly_campaign_id` = BTP DCE and `statut` in `CLICKED` / `BOOKED` / … after `/reservation/btp/{slug}`.

Dashboard sums both for the funnel **Clics page RDV** total.

## APIs

- `POST /api/btp-e1/eligibility-click`
- `GET /api/btp-e1/metrics` (`?refresh=1` bypasses cache)

## Dashboard

`/reservation/link-tracking.html` — Restaurant + BTP sections; BTP lists recent click timestamps.

Campaign: `25dfdcd2-2d3c-45fb-a1ea-f262dbfaa24a`. E1 bypass flow: `interested_email1_b2b`.
