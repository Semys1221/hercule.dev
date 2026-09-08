---
name: hercule-streamlit
description: >-
  Hercule.dev Streamlit operator tools under app/streamlit_*. Use when editing
  any streamlit app, running pnpm streamlit-* commands, CRM ops dashboards,
  Outscraper pipeline, Instantly subsequence, reply agent, link tracking,
  booking Resend, email cleaner, demands editor, or campaign stats.
---

# Hercule Streamlit Tools

Router for all `app/streamlit_*` operator dashboards. Read this first, then the sub-skill for the app you are touching.

## Tool router

| App dir | pnpm command | Sub-skill | Primary MCP |
|---------|--------------|-----------|-------------|
| `streamlit_scraper` | `pnpm streamlit-scraper` | [hercule-streamlit-scraper](hercule-streamlit-scraper/SKILL.md) | outscraper skill, Instantly |
| `streamlit_subsequence` | `pnpm streamlit-subsequence` | [hercule-streamlit-subsequence](hercule-streamlit-subsequence/SKILL.md) | Instantly, Supabase |
| `streamlit_reply_agent` | `pnpm streamlit-reply-agent` | [hercule-streamlit-reply-agent](hercule-streamlit-reply-agent/SKILL.md) | Instantly, Supabase |
| `streamlit_links` | `pnpm streamlit-links` | [hercule-streamlit-links](hercule-streamlit-links/SKILL.md) | Instantly, Supabase |
| `streamlit_booking_resend` | `pnpm streamlit-booking-resend` | [hercule-streamlit-booking-resend](hercule-streamlit-booking-resend/SKILL.md) | Resend, Calendly, Supabase |
| `streamlit_clean` | `pnpm streamlit-clean` | [hercule-streamlit-clean](hercule-streamlit-clean/SKILL.md) | myemailverifier skill, Instantly |
| `streamlit_demands` | `pnpm streamlit-demands` | [hercule-streamlit-demands](hercule-streamlit-demands/SKILL.md) | Supabase |
| `streamlit_stats` | `pnpm streamlit-stats` | [hercule-streamlit-stats](hercule-streamlit-stats/SKILL.md) | — |

## Cross-tool pipeline

```
streamlit_scraper → Instantly push
       ↓
streamlit_subsequence (Interested E1–E3)
       ↓
streamlit_reply_agent (AI replies to pending leads)
```

Link tracking (`streamlit_links`) provisions Instantly variables before cold outreach. Booking Resend (`streamlit_booking_resend`) handles Calendly → Resend sequences separately.

## Shared conventions

- **Python setup:** `cd app/<app> && pip install -r requirements.txt`; load env from repo root `.env`.
- **Next.js dependency:** `streamlit_links` and `streamlit_booking_resend` need `pnpm dev` for API calls (`CRM_BACKEND_URL`, default `http://localhost:3000`).
- **Scripts:** `scripts/streamlit_*` belong to the matching sub-skill.
- **Do not use:** personal `scrapping` skill (`apps/b2b-scraper/`), `smartlead` skill.
- **Human docs:** each app's `README.md` is the source of truth for config tables; skills summarize agent workflows.

## Related repo docs

- [app/crm/doc.md](../../app/crm/doc.md) — CRM overview
- [lib/admin/architecture/components-registry.ts](../../lib/admin/architecture/components-registry.ts) — component IDs
