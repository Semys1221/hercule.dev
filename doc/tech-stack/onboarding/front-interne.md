# Onboarding — Front interne (Streamlit)

> Module : [Onboarding](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Communication](./communication.md)  
> Contexte : [Vue d'ensemble](../00-overview.md)

---

## 1. Intro (langage simple)

Tu vois les nouvelles fiches (agence + entreprise **dans la même interface**). Tu peux passer une fiche en « délivrance » quand tu es prêt à lancer le service.

---

## 2. Architecture développée (pour IA de coding)

### Vue consolidée admin

Liste unifiée agence + entreprise ([`list_all_leads()`](../../../crm/supabase_repo.py)) :

| Colonne | Source |
|---------|--------|
| category | agence / entreprise |
| email, company, first_name | row |
| statut | row.statut |
| profile preview | `profile.form.besoin` ou `specialites` (truncated) |
| onboarding_completed_at | row |

Filtre : `statut = 'ONBOARDED'`

### Actions (WRITE via API)

| Bouton | API |
|--------|-----|
| Passer en délivrance | `POST /api/deliverance/promote` |
| Actualiser | read Supabase |

Preview **3 progressions** : afficher ce que verra le client (`profile.display.timeline` preview) avant promote.

---

## 3. Prompt d'action IA

```
Panel onboarding Streamlit (crm/admin_tool.py).

- Liste unifiée agence+entreprise, filtre ONBOARDED
- Colonne preview profile.form
- Bouton Passer en délivrance → post_json /api/deliverance/promote
- Preview timeline labels depuis profile.display

Réutiliser : crm/supabase_repo.py, crm/crm_api.py
```
