---
name: hercule-streamlit-reply-agent
description: >-
  Hercule.dev AI reply agent for Instantly pending leads (lib/backend/streamlit_reply_agent).
  Use when editing reply agent, Grok prompts, buyer seller prompts, pending replies,
  Unibox threads, or pnpm streamlit-reply-agent.
---

# Streamlit Reply Agent

AI-assisted replies to Instantly pending leads. Human reference: [lib/backend/streamlit_reply_agent/README.md](../../lib/backend/streamlit_reply_agent/README.md).

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
| `legal_content.py` | Knowledge pack assembly (mirror of `lib/ai-reply-agent/knowledge.ts`) |
| `lead_links.py` | CTA resolution from Supabase + prompt substitution |
| `grok_usage.py` | Grok API usage tracking |
| `pending_fetch.py`, `pending_table_ui.py` | Pending reply workflow |
| `send_window.py` | Send window constraints |
| `unibox_thread.py`, `thread_resolve.py` | Thread handling |

## Knowledge pack sources

| Niche | Condensed facts | FAQ |
|-------|-----------------|-----|
| Agence (default) | `app/(legacy)/content/tech/ai-reply-knowledge.md` | `app/(marketing)/content/legal-documentation/entreprise/faq.json` |
| Comptable (`*comptable*` preset) | `app/(legacy)/content/tech/ai-reply-knowledge-comptable.md` | `app/(marketing)/content/legal-documentation/comptable/faq.json` |

Plus `app/(legacy)/content/tech/00-overview.md` (truncated). **Do not** load full CGV at runtime — use condensed knowledge only.

## Niche comptable

- Preset : `cabinets_expertise_comptable` (+ vol variant)
- Prompts : `prompts/cabinets_expertise_comptable_buyer.md` / `_seller.md`
- CTA : `{reservation_comptable_link}` (table `comptable`, colonne `reservation_comptable_link`)
- Tarifs dans email : **interdit de chiffrer** → renvoyer `hercule.dev/cvg#dec`
- Pricing / CGV alignés : `app/(marketing)/content/legal-documentation/comptable/pricing.json` · `app/(marketing)/content/legal-documentation/_shared/cgv.md`

## Preset discovery

- `presets.py` adds `streamlit_scraper` to `sys.path` and reads `config_loader.PRESET_LABELS`
- `build_campaign_preset_index()` maps Instantly campaign UUIDs → `preset_id`
- **Bootstrap rule:** new presets get a **buyer** prompt via scraper tab 6 (`ui_tab_reply.py` → `prompt_store.save_prompt`). Seller prompts optional for non-comptable niches.

## Workflow

1. Select niche preset (from scraper labels)
2. Review pending leads (Instantly interested/replied)
3. Preview AI-generated reply (Grok)
4. Edit and send within send window
5. Bulk actions available via `pending_bulk_actions.py`

## Scripts

```bash
pnpm activate-reply-agents           # bootstrap campaigns + webhooks
pnpm audit-reply-agent               # failures, abstentions, slow pending report
pnpm resync-reply-agent-prompts      # push prompts/*.md → prompt_snapshot (prod)
pnpm configure-ai-reply-agent-health-cron  # cron-job.org health alerts
pnpm reprocess-skipped-replies       # Grok re-run on skipped inbound (dry-run default)
pnpm stop-lead-relances              # unified opt-out stop (all relance channels)
pnpm patch-e2e3-opt-out-disclaimer   # patch E2/E3 templates in prod
pnpm configure-ai-reply-agent-reprocess-cron  # alert when skipped volume > threshold
```

## Recovery mode (Lead tag only)

| Tag | Grok | Reply | On send |
|-----|------|-------|---------|
| Interested (1) | Yes | `should_reply` (no 70% gate) | unchanged |
| Lead | Yes | `should_reply` + `recovery_confidence ≥ 70` | auto-tag Interested |
| Not interested (-1) | No | skip (`skipped_not_interested`) | — |
| No show (-4) | No | skip | — |

- Gate : `reply_gate.py` (Streamlit) · `lib/ai-reply-agent/reply-gate.ts` (webhook)
- Copy : **AER** (Acknowledge → Explain → Redirect) on all `should_reply=true` replies
- Objection conférence (comptable + CIF) : script 2 500 € sur-mesure → clé en main en conférence → option 1:1 en répondant au mail
- Migration : `pnpm apply-ai-reply-agent-recovery-migration` (`skipped_recovery` + `recovery_confidence` column)
- Opt-out : `lib/lead-relances/opt-out.ts` + `stop-lead-relances` — stops Resend, bypass E1/E2/E3, reply agent blocklist
- Reprocess : `reprocessSkippedInbound.py` (read-only default) ; cron `/api/cron/ai-reply-agent-reprocess` alerts ops
- Disclaimer : `_Répondez non si vous ne souhaitez plus de messages._` in reply agent + E2/E3 templates

## Niche CIF + comptable — conference cutover

- Knowledge : `app/(legacy)/content/tech/ai-reply-knowledge-cif.md` · `app/(legacy)/content/tech/ai-reply-knowledge-comptable.md`
- FAQ : `app/(marketing)/content/legal-documentation/cif/faq.json` · `app/(marketing)/content/legal-documentation/comptable/faq.json`
- **International BE/CH/CA (DEC · IAS · CIF)** : tarifs 1 499 USD/mois + 400 USD/mois profils · acceptation explicite requise · lien Calendly unique (`CALENDLY_EVENT_TYPE_URI_INTERNATIONAL_1TO1`)
- CTA `{reservation_cif_link}` / `{reservation_comptable_link}` → `/reservation/{slug}`
- Objection conférence : AER avec 2 500 € sur-mesure (seul prix autorisé dans l'email pour cette objection) + redirect conférence + « répondez à ce mail » pour 1:1 sur-mesure
- Health cron : `/api/cron/ai-reply-agent-health` (failed + slow pending → `NOTIFICATION_OPS_EMAIL`)

## Cross-links

- Preset labels: `lib/backend/streamlit_scraper/config_loader.py`
- Bootstrap prompts: scraper tab 6 (`lib/backend/streamlit_scraper/bootstrap/ui_tab_reply.py`)
- After subsequence E1–E3, interested leads may flow here for AI replies
- Prod webhook: `lib/ai-reply-agent/handler.ts` + `lib/ai-reply-agent/knowledge.ts`
- Site sync checklist: `doc/tech-stack/cvg_site-sync.md`

## Do not

- Duplicate preset registry — always import from scraper `config_loader`
- Create new niche buyer prompts without using scraper onboarding tab 6
- Use agence pricing (1 489 €) in comptable knowledge or prompts
- Substitute wrong CTA column for comptable cabinets (must resolve `reservation_comptable_link`)
