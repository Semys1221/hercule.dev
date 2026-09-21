# Streamlit Stats

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc) (enforced when this path is open)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md) (router)
3. [`.cursor/skills/hercule-streamlit-stats/SKILL.md`](../../.cursor/skills/hercule-streamlit-stats/SKILL.md) (this app)

Human reference: sections below.

Legacy local JSON tracker for cold email campaign stats.

## Quick start

```bash
pnpm streamlit-stats
```

## Storage

Data persisted in `campaign_stats.json` (local file, same directory as `app.py`).

## Note

Prefer Instantly live analytics or internal admin dashboards for production reporting. This tool is for quick offline / historical tracking only.
