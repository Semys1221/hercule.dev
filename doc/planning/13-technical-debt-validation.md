# 13 — Dette technique

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Inventaire. **Delete seulement après vérification des références** (`ENG-09`). Pas de questions A/B/C ici : les suppressions dangereuses sont `LEG-*` / `BND-*`.

---

## Applications / routes

| Problème | Evidence | Risque | Reco | Delete / migrate / keep | Dépendances | Safe now? |
|----------|----------|--------|------|-------------------------|-------------|-----------|
| `streamlit_funnels` manquant | `package.json` script, dossier absent | Low | retirer script | delete script | aucun runtime | oui |
| `streamlit_enrich` vide | dir + pycache | Low | delete dir | delete | aucun | oui |
| Session admin dead | `lib/admin/auth.ts` deleted, `.env.example` ADMIN_SECRET | Medium | aligner env+docs sur SEC-01 | migrate docs | SEC-01 | docs only |
| `doc/migration/README.md` cassé | git D, lien tech-stack README | Low | retirer lien | delete link | agents | oui (doc) |
| Doublon `documentation_2` / `documentations_2` | deux dossiers | High confusion | BND-01 | merge/archive | agents | **non** sans BND-01 |
| VALIDATION.md inachevé | V/D vides | Medium | superseded par ce package | archive after answers | — | bannière ok |
| `ui-panel-*.tsx` | 3 fichiers, 0 route | Low | delete ou brancher | decide after SUR | — | probablement oui |
| `styles/globals.css` vs `app/globals.css` | duplicate | Low | une SoT CSS | merge | layout | après grep |
| `hooks/use-toast` vs `components/ui/use-toast` | duplicate | Low | un import | merge | shadcn | après grep |
| Pages client spec | registry spec, 0 files | info | FND/SUR | keep spec | — | — |
| Stripe/Clerk/n8n docs only | mentions | info | ne pas scaffolder | keep absent | INT | — |

---

## Tables / colonnes

| Problème | Evidence | Risque | Reco | Safe now? |
|----------|----------|--------|------|-----------|
| Enum `BOOKED` | encore dans type | Low | ENG-14 migrate later | non (live data) |
| Colonne générée `link` | alias slug | Low | garder tant qu’Instantly/Python l’utilisent | non sans grep |
| URLs dénorm | reservation_*_link | Low | garder (Instantly vars) | — |
| `matches` absente | spec | — | FND-05 | — |
| `profile` `{}` | default | Medium | remplir à l’onboarding only | — |
| Soft lead_id | jobs | Low | ENG-08 | — |

---

## Logique dupliquée

| Problème | Evidence | Risque | Reco |
|----------|----------|--------|------|
| Instantly TS vs Python | `lib/instantly.ts` + `shared/instantly_client.py` + `crm/instantly_client.py` | Medium drift | un client par langage ; ne pas en ajouter un 4e |
| Bypass Next vs Streamlit send | CF-11 | High | LEG-02 |
| Booking Next vs Streamlit UI | UI vs orchestrator | OK si Streamlit → API | FND-02 |
| Demandes Streamlit vs `/api/admin/demandes` | deux éditeurs | Medium | un writer |
| FAQ content vs doc markdown | CPY-03 | Medium | CPY-03 |
| Architecture registry vs ce package | COMP-01 | Low | COMP-01 |

---

## Workarounds temporaires

| Item | Evidence | Reco |
|------|----------|------|
| `BOOKING_GO_LIVE_AT` | env + legacy.ts | LEG-03 |
| Enum values via Management API script | Postgres ADD VALUE | garder scripts apply* |
| ACK 200 Instantly skips | comments | ENG-05 keep |
| Calendly ignore unknown events | webhook | ORCH-01 |
| Onboarding `profileColumnsSupported()` | feature detect | retirer après migration universelle |

---

## Terminologie inconsistante

`lead` vs `client` vs `fiche` ; `BOOKED` vs `MEETING_BOOKED` ; `link` vs `slug` ; `SOLD` vs `COMPLETED` vs `CONFIRMED` ; `Attribution` vs `RDV` vs `U4`. À figer dans l’architecture définitive, pas ici.

---

## Docs obsolètes (ne pas effacer maintenant)

- `doc/sop/contrat.md` stub → cvg_master
- Ancien pricing 250 € dans SOP (cvg_site-sync P2)
- Prompt IA dans `00-overview.md` qui dit encore « Streamlit = seul cockpit »

---

## Unfinished migrations (produit)

`matches`, product enum values, deliverance columns, survey tokens — **pas** des migrations oubliées : **spec**. Ne pas les écrire avant FND.
