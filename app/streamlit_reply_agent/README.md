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

## Niche comptable (`cabinets_expertise_comptable`)

Preset principal : `cabinets_expertise_comptable` (volume : `cabinets_expertise_comptable_vol`, même campagne Instantly).

| Rôle | Cible | Prompt | CTA variable |
|------|-------|--------|--------------|
| **buyer** | Cabinet EC (> 3 associés/collaborateurs) | `prompts/cabinets_expertise_comptable_buyer.md` | `{reservation_comptable_link}` |
| **seller** | Dirigeant TPE / indépendant | `prompts/cabinets_expertise_comptable_seller.md` | `{reservation_comptable_link}` ou entreprise selon campagne |

### Knowledge pack (ground truth)

Assemblé à la volée pour Grok :

| Source | Agence | Comptable |
|--------|--------|-----------|
| Faits condensés | `doc/tech-stack/ai-reply-knowledge.md` | `doc/tech-stack/ai-reply-knowledge-comptable.md` |
| FAQ | `content/faq/entreprise.json` | `content/faq/comptable.json` |
| Overview | `doc/tech-stack/00-overview.md` (tronqué) | idem |

Code : `legal_content.py` (Streamlit preview) · `lib/ai-reply-agent/knowledge.ts` (webhook prod).

**Règle tarifs comptable :** renvoyer vers `https://hercule.dev/cvg/comptable` **sans chiffrer** dans l'email. Abstention (`should_reply=false`) si la question n'est pas couverte par le pack.

### Flux reply (comptable)

```
Instantly reply_received
  → POST /api/webhooks/instantly/reply
  → lib/ai-reply-agent/handler.ts
  → buildKnowledgePack (preset comptable)
  → resolveLeadCtaLink (table comptable → reservation_comptable_link)
  → Grok JSON { should_reply, reply_text, reason }
  → draft ai_reply_agent_leads / auto-send si activé
  → Streamlit pending table (review manuelle)
```

Le reply agent est **distinct** de la subsequence E1–E3 (`orch-bypass`) et du booking orchestrator (`orch-booking`).

### Resync Supabase après changement de prompt

Les fichiers `prompts/*.md` ne mettent pas à jour prod tant que `prompt_snapshot` n'est pas resauvegardé :

1. Streamlit → onglet campagne comptable → **Save prompt**, ou
2. Internal → Bookings comptable → onglet **Reply agent** → enregistrer.

Sans cette étape, le webhook prod continue d'utiliser l'ancien texte en base.

### Liens utiles

- CGV cabinets : [/cvg/comptable](/cvg/comptable)
- Pricing canon : `content/pricing/comptable.json` + `doc/tech-stack/cvg_comptable.md`
- Alignement site ↔ CGV : `doc/tech-stack/cvg_site-sync.md` (section comptable)
- Internal SequenceWorkspace : onglet Reply agent sous Bookings comptable

## Environment

Load API keys from repo root `.env` (Grok, Instantly, Supabase). See `config.py`.
