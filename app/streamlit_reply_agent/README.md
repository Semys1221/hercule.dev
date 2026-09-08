# Streamlit Reply Agent

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc) (enforced when this path is open)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md) (router)
3. [`.cursor/skills/hercule-streamlit-reply-agent/SKILL.md`](../../.cursor/skills/hercule-streamlit-reply-agent/SKILL.md) (this app)

Human reference: sections below.

AI-assisted replies to Instantly pending leads using Grok.

## Quick start

```bash
pnpm streamlit-reply-agent
pnpm activate-reply-agents
```

## Presets

Niche presets are imported from `app/streamlit_scraper/config_loader.PRESET_LABELS`. New niches created via `python -m bootstrap create` must scaffold buyer + seller prompts in `prompts/`.

## Key areas

- **Pending replies** — fetch, preview, edit, send within send window
- **Prompts** — per-niche `*_buyer.md` and `*_seller.md` stored in Supabase via `prompt_store.py`
- **Bulk actions** — `pending_bulk_actions.py`

## Environment

Load API keys from repo root `.env` (Grok, Instantly, Supabase). See `config.py`.
