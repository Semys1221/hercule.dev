# Hercule CRM (Streamlit)

```bash
pnpm crm
# or:
cd crm && pip install -r requirements.txt && streamlit run admin_tool.py
```

Needs the Next.js app for status/sequence APIs (`CRM_BACKEND_URL` or `NEXT_PUBLIC_APP_URL`, default `http://localhost:3000`).

- **Leads** — list + Actualiser; change statut. MEETING_BOOKED asks whether to trigger Resend (now / schedule / skip).
- **Ajouter** — manual form. Duplicate email is rejected.
- **Unibox Instantly** — import replies (skip duplicates).
- **Provisioning** — Instantly campaign REPLACE of `{{reservation_agence_link}}`, `{{reservation_entreprise_link}}`, `{{confirmation_agence_link}}` (+ `statut`). Wipes legacy `{{link}}` / `{{confirm_link}}`.

### Recovering a partial provision (e.g. `Server disconnected`)

Large batches commit per chunk (50–100 rows). If Supabase disconnects mid-run, rows from completed chunks are already saved; Instantly PATCH runs for whatever succeeded.

1. Restart Streamlit (`pnpm crm`) so retry logic is active.
2. Re-select the same campaign leads and click **Provision / re-sync** again (same category, PATCH enabled).
   - Existing emails → Supabase **update** (fast).
   - Missing emails → **insert** (remaining chunks).
   - Instantly PATCH runs for all leads with an Instantly id.
3. If Supabase keeps failing, use **Instantly only (re-sync)** on leads already visible in the **Leads** tab while investigating connectivity.

Optional check:

```sql
SELECT count(*) FROM agence WHERE instantly_campaign_id = '<campaign_id>';
```

Tune large jobs via env: `SUPABASE_INSERT_BATCH_SIZE` (default 100, auto 50 when >1000 rows), `SUPABASE_BATCH_MAX_RETRIES` (default 4). Updates use the same chunk size and per-row retry (partial success: re-run finishes the rest).

Tracking URLs (full links stored in Supabase):
- `slug` — 6-char token only
- `reservation_agence_link` → `/reservation.html/{slug}`
- `reservation_entreprise_link` → `/reservation-entreprise.html/{slug}`
- `confirmation_agence_link` → `/confirm-reservation.html/{slug}?email=` (Resend email 2 agence)

Copy: [doc/emails_booking](../doc/emails_booking)
