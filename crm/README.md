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
- **Provisioning** — Instantly campaign `{{link}}` injection.

Tracking URLs:
- Agence: `TRACKING_BASE_URL_AGENCE/{slug}` → `/reservation.html/{slug}`
- Entreprise: `TRACKING_BASE_URL_ENTREPRISE/{slug}` → `/reservation-entreprise.html/{slug}`

Copy: [doc/emails_booking](../doc/emails_booking)
