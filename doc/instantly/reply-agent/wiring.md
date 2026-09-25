# Wiring — AI Reply Agent (`reply-agent/*.md`)

## Ce que contient un fichier

Instructions Grok pour **répondre aux emails entrants** (Unibox), distinct des relances E1–E3. Contenu typique : rôle, style, contexte métier, CTA, règles `should_reply=false`, métadonnées preset / campagne.

## Chaîne source → prod

```text
doc/instantly/reply-agent/{niche}.md
        ↓ copie manuelle (source de vérité rédaction)
lib/backend/streamlit_reply_agent/prompts/{preset_id}_buyer.md
        ↓ save_prompt / resync
Supabase ai_reply_agent_config.prompt_snapshot
        ↓ webhook reply
POST /api/webhooks/instantly/reply → lib/legacy/ai-reply-agent/handler.ts
```

| Champ Supabase | Rôle |
|----------------|------|
| `campaign_id` | UUID campagne Instantly |
| `niche_preset_id` | ex. `btp_pme` |
| `prompt_key` | `{preset_id}_buyer` |
| `prompt_snapshot` | texte complet envoyé à Grok |
| `status` | `waiting_for_replies` ou `paused` |

Preset ↔ campagne : [`presets.py`](../../../lib/backend/streamlit_reply_agent/presets.py) lit `INSTANTLY_CAMPAIGN_ID` dans chaque [`*_config.py`](../../../lib/backend/streamlit_scraper/configs/).

## Workflow opérateur

1. Finaliser `reply-agent/{niche}.md`.
2. Copier (ou aligner) vers `lib/backend/streamlit_reply_agent/prompts/{preset_id}_buyer.md`.
3. **Première activation** sur la campagne :

   ```bash
   pnpm activate-reply-agents
   ```

   Ou ciblé : `python lib/backend/scripts/streamlit_reply_agent/activateReplyAgents.py` avec le preset voulu (scaffold prompt si absent, webhooks reply).

4. **Après chaque modification de prompt** :

   ```bash
   pnpm resync-reply-agent-prompts
   ```

5. **Alternative UI** : `pnpm streamlit-reply-agent` ou scraper onglet 6 (`ui_tab_reply.py`) → Save prompt.

6. Santé : `pnpm audit-reply-agent`

## Knowledge pack (hors fichier prompt)

Grok reçoit aussi un pack assemblé à la volée :

| Audience (`niche-preset`) | Faits | FAQ |
|---------------------------|-------|-----|
| `comptable_delivery` (restaurants, `btp_pme`, dentiste, …) | [`ai-reply-knowledge-jum.md`](../../../app/(legacy)/content/tech/ai-reply-knowledge-jum.md) | [`faq/jum.json`](../../../app/(marketing)/content/faq/jum.json) |

Code : [`legal_content.py`](../../../lib/backend/streamlit_reply_agent/legal_content.py) (Streamlit) · [`knowledge.ts`](../../../lib/legacy/ai-reply-agent/knowledge.ts) (prod).

Toute règle métier nouvelle (montants, dispositifs légaux) doit être ajoutée au knowledge avant d’autoriser Grok à en parler.

## Variables dans le prompt

| Placeholder | Résolution |
|-------------|------------|
| `{reservation_jum_link}` | Lien tracking lead — [`lead-links.ts`](../../../lib/legacy/ai-reply-agent/lead-links.ts) |

Ne pas confondre avec `{{reservation_jum_link}}` (doubles accolades) des templates HTML bypass.

## Par niche

| Doc | Fichier prompt | Preset | Campagne |
|-----|----------------|--------|----------|
| `restaurants.md` | `restaurants_independants_buyer.md` | `restaurants_independants` | `e4f11e76-…` |
| `btp.md` | `btp_pme_buyer.md` | `btp_pme` | `25dfdcd2-…` |
| `chirurgien-dentist.md` | `chirurgiens_dentistes_buyer.md` | `chirurgiens_dentistes` | `0f0b450a-…` |

## Distinction subsequence

Le reply agent ne remplace pas E1–E3 : voir [`../subsequences/wiring.md`](../subsequences/wiring.md).
