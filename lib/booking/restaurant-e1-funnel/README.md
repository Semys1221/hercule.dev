# Restaurant Interested E1 — RDV funnel

Public aggregate metrics (no lead identity on clicks):

- **Emails E1** — `instantly_bypass_events` for campaign `e4f11e76-717e-4be9-a6ad-c7f0a331afb7`, `flow = interested_email1`, `status = sent`
- **Clicks** — sum of (1) legacy rows in `restaurant_e1_eligibility_clicks` (shared `restaurant.html` CTA, pre–copy pivot) and (2) `leads` with `category = comptable_delivery`, same campaign id, `statut` in `CLICKED` / `CONFIRMED` / … after visit to `/reservation/restaurant/{slug}` via `{{reservation_jum_link}}`
- **Bookings** — Calendly API, active invitees on event type `comptable_delivery` (rentabilite-restaurant)

Dashboard: `/reservation/link-tracking.html` (ratios are public by design).

After copy changes, seed prod templates:

```bash
python lib/backend/scripts/streamlit_subsequence/seedRestaurantsDceBypass.py
python lib/backend/scripts/streamlit_subsequence/seedRestaurantsDceBypass.py --campaign-id 2102110d-1491-4bd0-aa24-cfd29e9a0218
```

Ensure leads have `reservation_jum_link` (`pnpm bootstrap-pierremeniaud-booking -- --confirm --resync-all` if CTAs are empty in Streamlit preview).
