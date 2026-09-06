# 18 — Legacy / ops (Streamlit, Python, HTML)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Ne rien supprimer avant réponses + grep des références (`ENG-09`).

---

## PARTIE 1 — Ce qui est valide

Les apps Streamlit suivantes **tournent** l’exploitation :

| App | Script pnpm | Rôle |
|-----|-------------|------|
| `streamlit_links` | `streamlit-links` | CRM leads, liens, statuts |
| `streamlit_booking_resend` | `streamlit-booking-resend` | templates + trigger + legacy tab (`BOOKING_GO_LIVE_AT`) |
| `streamlit_subsequence` | `streamlit-subsequence` | Unibox / bypass UI |
| `streamlit_demands` | `streamlit-demands` | carousel |
| `streamlit_scraper` | `streamlit-scraper` | Outscraper → Instantly |
| `streamlit_clean` | `streamlit-clean` | MyEmailVerifier |
| `streamlit_reply_agent` | `streamlit-reply-agent` | inbox AI / prompts / blocklist |
| `streamlit_stats` | *(pas de script)* | JSON stats local |

Python partagé : `crm/*`, `shared/instantly_client.py`. Next est déjà le backend d’envoi (booking, bypass, AI crons).

---

## PARTIE 2 — Décisions

#### [LEG-01] Après FND-02, que faire des apps Streamlit **métier leads** (`links`, `booking_resend`) une fois un cockpit Next équivalent ?

- [x] **A (recommandé)** — Cutover : Next interne reprend links + templates booking ; Streamlit booking/links **dépréciés** après parité, pas avant.
- [ ] **B** — Les garder indéfiniment comme cockpit CRM (FND-02 B/C).
- [ ] **C** — Les éteindre immédiatement (interdit tant que Next n’a pas la parité — option dangereuse).

**Impact si l’architecture change :** High  
**Domaines affectés :** Ops quotidienne, APIs booking-communication

#### [LEG-02] Quel exécuteur unique pour la subsequence Instantly (E1–E3) ?

Next bypass **et** Streamlit subsequence peuvent envoyer. Risque double E1 (CF-11).

- [x] **A (recommandé)** — Exécuteur = Next (`lib/instantly-bypass` + crons + webhooks) ; Streamlit = UI / config / lecture seulement.
- [ ] **B** — Préserver les deux chemins (état actuel).
- [ ] **C** — Exécuteur = Streamlit ; désactiver webhooks/crons Next bypass.

**Impact si l’architecture change :** High  
**Domaines affectés :** Instantly, doublons email  
**Conflit :** CF-11

#### [LEG-03] `BOOKING_GO_LIVE_AT` / onglet Legacy Streamlit : faut-il encore un mode « bookings avant cette date sans séquence auto » ?

C’est un workaround de bascule 2026-09-03.

- [x] **A (recommandé)** — Le garder jusqu’à ce qu’il n’y ait plus de leads pre-go-live actifs ; ensuite supprimer le split (`ENG` fera le delete).
- [ ] **B** — Forcer tous les leads sur la séquence auto maintenant.
- [ ] **C** — Étendre le split (nouvelles dates / flags par campagne).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** orchestrator `legacy.ts`, Streamlit

---

## Morts / cassés (inventaire — action après validation)

| Item | Evidence | Risque | Reco | Safe now? |
|------|----------|--------|------|-----------|
| `app/streamlit_funnels` | script pnpm, dossier **absent** | Low | retirer script | oui après grep |
| `app/streamlit_enrich` | vide + pycache | Low | supprimer dir | oui |
| `pnpm streamlit-funnels` | package.json | Low | delete script | oui |
| Instantly vars `link` / `confirm_link` dépréciés | commentaires provision | Low | déjà wiped | — |
| `doc/migration/README.md` | lien tech-stack README, fichier **deleted** (git) | Medium confusion | retirer lien | doc only |

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| LEG-01 | A | Streamlit déprécié après parité Next |
| LEG-02 | A | Next envoie Instantly E1–E3 |
| LEG-03 | A | Garder BOOKING_GO_LIVE_AT tant que besoin |
