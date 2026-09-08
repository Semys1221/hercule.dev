# Streamlit Demands

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc) (enforced when this path is open)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md) (router)
3. [`.cursor/skills/hercule-streamlit-demands/SKILL.md`](../../.cursor/skills/hercule-streamlit-demands/SKILL.md) (this app)

Human reference: sections below.

Streamlit editor for homepage carousel cards (`agence_demandes`).

## Quick start

```bash
pnpm streamlit-demands
```

## Workflow

1. List all carousel cards from Supabase
2. Select a card
3. Edit **demande** (main text) or **teaser** (short preview)
4. Save — changes reflect on the marketing homepage carousel

## Data

- Table: `agence_demandes` (Supabase)
- Repo: `supabase_repo.py` — `list_all_cards`, `get_card`, `update_demande`, `update_teaser`
