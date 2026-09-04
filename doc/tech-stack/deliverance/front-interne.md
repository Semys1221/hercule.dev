# Deliverance — Front interne (Streamlit)

> Module : [Deliverance](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Communication](./communication.md)

---

## 1. Intro (langage simple)

Tu pilotes la timeline de chaque fiche : avancer étape, retarder, voir les 3 progressions (admin + preview client agence + preview client entreprise).

---

## 2. Architecture développée (pour IA de coding)

### Panel Deliverance

Sélection lead → afficher :

| Bloc | Contenu |
|------|---------|
| Admin | statut, step, dates, boutons action |
| Preview agence | labels `profile.display.timeline` + step actuel |
| Preview entreprise | idem si row entreprise sélectionnée |

### Boutons → API (jamais Supabase write direct)

| Bouton | Action |
|--------|--------|
| Étape suivante | `ADVANCE_STEP` |
| Retarder +7j | `DELAY` |
| Match trouvé tôt | redirige vers module [Matching](../matching/README.md) |

### Liste consolidée

Toutes fiches `IN_DELIVERANCE` agence + entreprise dans un seul tableau Streamlit.

---

## 3. Prompt d'action IA

```
Panel deliverance Streamlit avec preview 3 progressions.

- Liste unifiée IN_DELIVERANCE
- Preview profile.display.timeline par lead
- Boutons via post_json admin/action

Réutiliser : crm/admin_tool.py, crm/crm_api.py
```
