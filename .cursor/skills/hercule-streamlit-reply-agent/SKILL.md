---
name: hercule-streamlit-reply-agent
description: >-
  Hercule.dev AI reply agent for Instantly pending leads (app/streamlit_reply_agent).
  Use when editing reply agent, Grok prompts, buyer seller prompts, pending replies,
  Unibox threads, or pnpm streamlit-reply-agent.
---

# Streamlit Reply Agent

AI-assisted replies to Instantly pending leads. Human reference: [app/streamlit_reply_agent/README.md](../../app/streamlit_reply_agent/README.md).

## Quick start

```bash
pnpm streamlit-reply-agent
pnpm activate-reply-agents
```

Use MCP `user-instantly` for lead/thread ops; `plugin-supabase-supabase` for agent config and job queue.

## Key files

| File | Role |
|------|------|
| `app.py` | Main Streamlit UI |
| `presets.py` | Imports `PRESET_LABELS` from `streamlit_scraper/config_loader` |
| `prompts/*_buyer.md`, `prompts/*_seller.md` | Per-niche Grok prompts |
| `prompt_store.py` | Load/save prompts to Supabase |
| `prompt_scaffold.py` | Bootstrap stub templates |
| `grok_usage.py` | Grok API usage tracking |
| `pending_fetch.py`, `pending_table_ui.py` | Pending reply workflow |
| `send_window.py` | Send window constraints |
| `unibox_thread.py`, `thread_resolve.py` | Thread handling |

## Preset discovery

- `presets.py` adds `streamlit_scraper` to `sys.path` and reads `config_loader.PRESET_LABELS`
- `build_campaign_preset_index()` maps Instantly campaign UUIDs → `preset_id`
- **Bootstrap rule:** new presets get a **buyer** prompt via scraper tab 6 (`ui_tab_reply.py` → `prompt_store.save_prompt`). Seller prompts are optional / legacy only.

## Workflow

1. Select niche preset (from scraper labels)
2. Review pending leads (Instantly interested/replied)
3. Preview AI-generated reply (Grok)
4. Edit and send within send window
5. Bulk actions available via `pending_bulk_actions.py`

## Scripts

```bash
pnpm activate-reply-agents    # scripts/streamlit_reply_agent/activateReplyAgents.py
```

## Cross-links

- Preset labels: `app/streamlit_scraper/config_loader.py`
- Bootstrap prompts: scraper tab 6 (`app/streamlit_scraper/bootstrap/ui_tab_reply.py`)
- After subsequence E1–E3, interested leads may flow here for AI replies

## Do not

- Duplicate preset registry — always import from scraper `config_loader`
- Create new niche buyer prompts without using scraper onboarding tab 6
