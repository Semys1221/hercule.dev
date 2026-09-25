# Instantly — wiring copy → production

Ce dossier est la **rédaction source** (plain text / markdown léger). Rien n’est envoyé automatiquement depuis `doc/instantly/` : chaque sous-dossier a son propre chemin « live » (voir `wiring.md` dans chaque dossier).

| Dossier | Rôle | Moment dans le funnel | Destination live |
|---------|------|------------------------|------------------|
| [`sequences/`](sequences/wiring.md) | Cold outreach (email 1, relance 2…) | Avant Interested | API Instantly `campaign.sequences` |
| [`subsequences/`](subsequences/wiring.md) | Interested E1 → E2 → E3 | Tag **Interested** | Supabase `instantly_bypass_templates` + Unibox |
| [`reply-agent/`](reply-agent/wiring.md) | Réponses IA aux replies | Inbound Unibox | Supabase `ai_reply_agent_config.prompt_snapshot` + `prompts/*.md` |

## Cartographie niches (fichier doc → preset → campagne)

| Fichier doc | Preset scraper | Campagne Instantly |
|-------------|----------------|---------------------|
| `restaurants.md` | `restaurants_independants` | Restaurants (DCE) — `e4f11e76-717e-4be9-a6ad-c7f0a331afb7` |
| `btp.md` | `btp_pme` | BTP (DCE) — `25dfdcd2-2d3c-45fb-a1ea-f262dbfaa24a` |
| `chirurgien-dentist.md` | `chirurgiens_dentistes` | Hercule — Chirurgiens-dentistes (France) — `0f0b450a-e550-461c-96f6-1a7681678d67` |

Config client livraison comptable (liens RDV) : [`config/clients/pierremeniaud.json`](../../config/clients/pierremeniaud.json) · [`lib/legacy/admin/niches/comptable-delivery-verticals.ts`](../../lib/legacy/admin/niches/comptable-delivery-verticals.ts).

## Ordre recommandé pour une nouvelle verticale

1. Rédiger le **cold** dans `sequences/{niche}.md`
2. Pousser le cold → Instantly (scraper onglet 4 ou UI Instantly)
3. Provisionner les liens leads (`pnpm bootstrap-pierremeniaud-booking -- --confirm` si Meniaud)
4. Rédiger **E1–E3** dans `subsequences/{niche}.md` → Streamlit subsequence
5. Rédiger le **reply agent** dans `reply-agent/{niche}.md` → `lib/backend/streamlit_reply_agent/prompts/{preset}_buyer.md` → activate + resync
6. Vérifier les webhooks : `lead_interested` (bypass) + reply (reply agent)

## Décisions (convention repo)

- **Sync** : copie **manuelle** doc → outils prod pour l’instant. `pnpm sequences:export` alimente `legal-documentation`, pas `doc/instantly/`.
- **Cold A/B** : un fichier `sequences/{niche}.md` décrit la variante **principale** ; les autres variants Instantly sont notés en commentaire en tête de fichier si besoin.
- **Nommage fichiers** : kebab-case dans `doc/instantly/` ; preset scraper en snake_case (`chirurgien-dentist.md` ↔ `chirurgiens_dentistes`).

## Docs code

- [`lib/doc/modules.md`](../../lib/doc/modules.md) — § Sending
- Skills : [`hercule-streamlit-subsequence`](../../.cursor/skills/hercule-streamlit-subsequence/SKILL.md), [`hercule-streamlit-reply-agent`](../../.cursor/skills/hercule-streamlit-reply-agent/SKILL.md)
