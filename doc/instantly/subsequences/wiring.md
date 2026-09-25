# Wiring — Interested subsequence E1–E3 (`subsequences/*.md`)

## Ce que contient un fichier

Trois blocs **E1 / E2 / E3** : emails envoyés en **réponse Unibox** dans le thread existant, après le tag Instantly **Interested** (pipeline bypass).

## Où ça part en prod

| Couche | Table / fichier | Clés |
|--------|-----------------|------|
| **Supabase** | `instantly_bypass_templates` | `campaign_id` + `template_key` : `interested_email1`, `interested_email2`, `interested_email3` |
| **Config campagne** | `instantly_bypass_config` | auto-send E1, pause, `webhook_id` |
| **Pipeline** | `instantly_bypass_pipeline` | `step_0` … `step_3` |
| **Webhook** | `POST {NEXT_PUBLIC_APP_URL}/api/webhooks/instantly` | `lead_interested` |
| **Cron** | `GET /api/cron/instantly-bypass-jobs` | envois manuels hors fenêtre lun–ven 8h–17h Europe/Paris |

Code : [`lib/legacy/instantly-bypass/`](../../../lib/legacy/instantly-bypass/) · UI : `pnpm streamlit-subsequence` · README : [`lib/backend/streamlit_subsequence/README.md`](../../../lib/backend/streamlit_subsequence/README.md).

## Conversion doc → template live

1. Rédiger dans `subsequences/{niche}.md` (plain text ; `[Calendly]` = placeholder humain).
2. Passer en **HTML** pour Supabase :
   - Remplacer `[Calendly]` par  
     `<a href="{{reservation_jum_link}}">Réserver un créneau</a>`  
     pour les verticales **livraison comptable / DCE** (restaurants, BTP, dentiste Meniaud).
   - Ajouter `{{accountSignature}}` en fin de corps si vous utilisez la signature du compte Instantly.
   - E2 / E3 : opt-out aligné prod si besoin — voir `OPT_OUT_DISCLAIMER_HTML` dans [`default_templates.py`](../../../lib/backend/streamlit_subsequence/default_templates.py).
3. **Streamlit** : `pnpm streamlit-subsequence`
   - Sélectionner la **campagne** (UUID = preset `INSTANTLY_CAMPAIGN_ID`).
   - **Initialiser** si « Non initialisé ».
   - Setup / Templates : coller Email 1 / 2 / 3 → **Enregistrer**.
4. **Setup** : activer l’auto-envoi E1 si souhaité (webhook + cron jobs).
5. Smoke : `pnpm smoke-streamlit-subsequence`

## Bootstrap initial (code)

À **Initialiser**, l’E1 vide peut être prérempli par `DEFAULT_E1_BODY_HTML` (comptable legacy) — **pas** depuis `doc/instantly/`. Les clés `interested_email1_restaurant`, `interested_email1_b2b`, etc. dans `default_templates.py` servent surtout aux **migrations** ; en prod, par campagne, seules comptent `interested_email1`, `interested_email2`, `interested_email3`.

## Liens RDV (prérequis)

Sans `{{reservation_jum_link}}` résolu sur le lead, le CTA est vide.

```bash
pnpm bootstrap-pierremeniaud-booking -- --dry-run
pnpm bootstrap-pierremeniaud-booking -- --confirm
# leads existants :
pnpm bootstrap-pierremeniaud-booking -- --confirm --resync-all
```

Mapping catégorie : [`provision-campaign-lead.ts`](../../../lib/legacy/link-tracking/provision-campaign-lead.ts) (`KNOWN_CAMPAIGN_CATEGORY`).

## Par niche

| Doc | Campagne | Segment / route Meniaud |
|-----|----------|-------------------------|
| `restaurants.md` | Restaurants (DCE) | `restaurant` → `/reservation/restaurant/{slug}` |
| `btp.md` | BTP (DCE) | `b2b` → `/reservation/btp/{slug}` |
| `chirurgien-dentist.md` | Chirurgiens-dentistes | `dentiste` → `/reservation/chirurgien-dentiste/{slug}` (activer la verticale dans `pierremeniaud.json` si `enabled: false`) |

## Distinction reply agent

E1–E3 = relances **programmées** (bypass). Le **reply agent** gère les réponses **ad hoc** quand le prospect écrit : [`../reply-agent/wiring.md`](../reply-agent/wiring.md).
