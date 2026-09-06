# Matching — Front interne (Streamlit)

> Module : [Matching](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Communication](./communication.md)

---

## 1. Intro (langage simple)

Tu choisis une agence et une entreprise, tu cliques **« Mettre en lien »**. Ça envoie l'email Calendly à l'entreprise et met les deux fiches en `MATCH_PROPOSED`.

---

## 2. Architecture développée (pour IA de coding)

### UI

- Select agence éligible (`IN_DELIVERANCE` ou `CONFIRMED`, pas de match actif)
- Select entreprise éligible (`IN_DELIVERANCE`)
- Preview + dialog confirmation
- Bouton **« Mettre en lien »** → `POST /api/matching/link`

### Post-action

Toast + refresh ; afficher statut `MATCH_PROPOSED` et lien suivi client.

Warning si agence pas `CONFIRMED` : entretien commercial non validé.

Via [`crm/crm_api.py`](../../../crm/crm_api.py) `post_json`.

---

## 3. Prompt d'action IA

```
Panel Matching Streamlit — bouton Mettre en lien.

- Picker agence + entreprise
- POST /api/matching/link via post_json
- Dialog confirmation avec preview des deux fiches

Réutiliser : app/streamlit_links/app.py dialog pattern, crm/crm_api.py

Tests : click → MATCH_PROPOSED both + email job match_proposal_entreprise
```
