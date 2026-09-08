---
name: hercule-streamlit-stats
description: >-
  Hercule.dev legacy cold email campaign stats tracker (app/streamlit_stats).
  Use when editing streamlit_stats, campaign_stats.json, or local email tracking.
---

# Streamlit Stats

Legacy local JSON tracker for cold email campaign stats. Human reference: [app/streamlit_stats/README.md](../../app/streamlit_stats/README.md).

## Quick start

```bash
pnpm streamlit-stats
```

## Storage

- Data file: `app/streamlit_stats/campaign_stats.json` (local, not Supabase)
- Functions: `load_data()`, `save_data()` in `app.py`

## Scope

Simple Streamlit UI to manually track campaign performance metrics. **Prefer Instantly live stats or the internal admin dashboard for new work** — this tool is legacy/local-only.

## When to use

- Quick offline tracking during early campaigns
- Historical reference for stats captured before Instantly API integration

## When not to use

- Production reporting → use Instantly MCP `user-instantly` analytics
- Persistent team dashboards → use `app/internal/` admin tools

## Do not

- Treat `campaign_stats.json` as source of truth for production metrics
- Expect multi-user sync — file is local to the machine running Streamlit
