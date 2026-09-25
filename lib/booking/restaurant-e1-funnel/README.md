# Restaurant Interested E1 — eligibility redirect funnel

Public aggregate metrics (no lead identity on clicks):

- **Emails E1** — `instantly_bypass_events` for campaign `e4f11e76-717e-4be9-a6ad-c7f0a331afb7`, `flow = interested_email1`, `status = sent`
- **Clicks** — rows in `restaurant_e1_eligibility_clicks` (shared CTA URL)
- **Bookings** — Calendly API, active invitees on event type `comptable_delivery` (rentabilite-restaurant)

Dashboard: `/reservation/link-tracking.html` (ratios are public by design).

After copy changes, seed prod templates: `python lib/backend/scripts/streamlit_subsequence/seedRestaurantsDceBypass.py` or Streamlit subsequence UI.
