---
name: hercule-streamlit-demands
description: >-
  Hercule.dev homepage carousel demandes editor (app/streamlit_demands).
  Use when editing streamlit_demands, agence_demandes, carousel cards,
  demande teaser, or pnpm streamlit-demands.
---

# Streamlit Demands

Streamlit editor for homepage carousel cards (`agence_demandes` table). Human reference: [app/streamlit_demands/README.md](../../app/streamlit_demands/README.md).

## Quick start

```bash
pnpm streamlit-demands
```

Use MCP `plugin-supabase-supabase` for `agence_demandes` table.

## Key files

| File | Role |
|------|------|
| `app.py` | Streamlit UI, niche/origine presets |
| `supabase_repo.py` | `list_all_cards`, `get_card`, `update_demande`, `update_teaser` |

## Niche options

Defined in `app.py` as `NICHE_OPTIONS`:

- `comptabilite`, `conseil-financier`, `renovation`, `grossiste`, `a-venir`

## Origine presets

`ORIGINE_PRESETS` in `app.py` — e.g. "Recrutement actif", "Changement de locaux", "Nouveau gérant".

## Workflow

1. List all carousel cards from Supabase
2. Select card to edit
3. Update **demande** (main text) or **teaser** (short preview)
4. Changes reflect on marketing homepage carousel

## Side effects

Editing a card triggers homepage carousel refresh (Supabase → Next.js marketing pages).

## Do not

- Confuse with `streamlit_links` (CRM leads) or `streamlit_scraper` (Outscraper pipeline)
