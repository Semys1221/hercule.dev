# Wiring — Cold sequences (`sequences/*.md`)

## Ce que contient un fichier

Copy des **emails froids** de la campagne Instantly (généralement **2 étapes** + délais). Variables Instantly courantes : `{{city}}`, `{{firstName}}`, `{{companyName}}`, etc.

Ce n’est **pas** la subsequence Interested (E1–E3) : voir [`../subsequences/wiring.md`](../subsequences/wiring.md).

## Où ça part en prod

| Couche | Détail |
|--------|--------|
| **Instantly** | `GET/PATCH campaign` → `sequences[0].steps[]` (type `email`, variants `subject` / `body` HTML) |
| **Repo (outil)** | [`lib/backend/streamlit_scraper/bootstrap/ui_tab_emails.py`](../../../lib/backend/streamlit_scraper/bootstrap/ui_tab_emails.py) — onglet **« 4 — 2 emails campagne »** → `patch_campaign_sequences()` |
| **Preset** | [`lib/backend/streamlit_scraper/configs/{preset}_config.py`](../../../lib/backend/streamlit_scraper/configs/) → `INSTANTLY_CAMPAIGN_ID` |

## Workflow opérateur

1. Finaliser le texte dans `sequences/{niche}.md` (référence humaine).
2. Convertir en **HTML** (`<div>` ou `<p>`) comme dans Instantly.
3. **Option A — Scraper** : bootstrap / streamlit scraper → choisir le preset → onglet 4 → coller sujet + corps → **Enregistrer** (PATCH API).
4. **Option B — Instantly UI** : éditer la campagne directement.
5. **Option C — MCP** `user-instantly` : `get_campaign` puis mise à jour campagne (valider le schéma `steps` avant PATCH).

## Variantes A/B

Instantly peut avoir **plusieurs variants** par étape (ex. BTP : `question btp` vs `question trésorerie`). Le markdown doc décrit la variante **active / principale** ; documenter les autres en en-tête du fichier niche si elles restent en prod.

## Vérification

- MCP ou API : `get_campaign` avec l’UUID campagne
- Envoi test sur un lead de la liste liée au preset

## Non branché

`pnpm sequences:export` exporte vers la doc légale / archives, **pas** vers `doc/instantly/`. Pas de script inverse doc → Instantly pour l’instant.

## Par niche

| Doc | Preset | ID campagne |
|-----|--------|-------------|
| `restaurants.md` | `restaurants_independants` | `e4f11e76-717e-4be9-a6ad-c7f0a331afb7` |
| `btp.md` | `btp_pme` | `25dfdcd2-2d3c-45fb-a1ea-f262dbfaa24a` |
| `chirurgien-dentist.md` | `chirurgiens_dentistes` | `0f0b450a-e550-461c-96f6-1a7681678d67` |
