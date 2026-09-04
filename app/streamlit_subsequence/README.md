# Streamlit Subsequence

Operator dashboard for Instantly interest-status sequences — Unibox reply sends.

## Model

| Sequence | Fetch filter | Email 1 | Email 2 | Email 3 |
|----------|--------------|---------|---------|---------|
| **Interested** | `FILTER_LEAD_INTERESTED` | Auto webhook + manual | Manual | Manual → Not Interested |
| **No Show** | `FILTER_LEAD_NO_SHOW` | Manual | Manual → Not Interested | — |

- **One fetch per sequence** — operator picks which email to send.
- **Reply detection** — unchecked if lead replied since any Hercule send.
- **Missing `reservation_agence_link`** — warning in UI, send blocked.
- **Final emails** (Interested E3, No Show E2) set Instantly status to **Not Interested (-1)**.
- All sends are **Unibox replies** in the existing thread (thread subject kept).

## Quick start

```bash
pnpm streamlit-subsequence
pnpm smoke-streamlit-subsequence
```

1. Apply migrations through `20260910120000_subsequence_v2.sql`
2. Configure campaign in **Setup**
3. **Envois** → fetch leads by interest status → pick email → send

## Webhook (Interested Email 1 only)

- URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/instantly`
- Kill switch: `INSTANTLY_BYPASS_WEBHOOK_ENABLED=true` required to auto-send

## Template variables

`{{reservation_agence_link}}`, `{{accountSignature}}`, `{{first_name}}`, `{{last_name}}`, `{{company_name}}`
