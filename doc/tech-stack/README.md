# Tech stack Hercule — Documentation modulaire

Documentation pour implémenter la plateforme matchmaking agence ↔ entreprise.

## Validation produit

| Doc | Contenu |
|-----|---------|
| **[VALIDATION.md](./VALIDATION.md)** | **Validation doc tech-stack** — 55 questions, cases à cocher |

## Fondations

| Doc | Contenu |
|-----|---------|
| [00-overview.md](./00-overview.md) | Contexte, 3 progressions, 4 modules, statuts |
| [01-four-lines-model.md](./01-four-lines-model.md) | DB · Client · Admin · Emails — trigger/action |
| [02-data-model.md](./02-data-model.md) | 2 tables, pas de table comms |
| [02-profile-json.md](./02-profile-json.md) | Fiche JSON centrale (UI + emails + offers) |

## Documents légaux / commerciaux

| Doc | Contenu |
|-----|---------|
| **[cvg_master.md](./cvg_master.md)** | **CGV complètes B2B** — tarifs, SLA, garanties, résiliation |
| [cvg_onboarding.md](./cvg_onboarding.md) | Résumé onboarding + texte checkbox |
| [cvg_site-sync.md](./cvg_site-sync.md) | Audit alignement site ↔ CGV (checklist copy) |

> Ancien blueprint : [doc/sop/contrat.md](../sop/contrat.md) (stub → `cvg_master.md`)

## Capacity & SLA (avant front client)

| Doc | Contenu |
|-----|---------|
| **[capacity/README.md](./capacity/README.md)** | **Inbox pool, funnel, délais promettables, file d'attente, bootstrap** |

## Outils internes

| Doc | Contenu |
|-----|---------|
| **[tool/streamlit_reply_agent.md](./tool/streamlit_reply_agent.md)** | **AI Reply Agent** — Instantly `reply_received` → Groq → Unibox · Streamlit Inbox / Problem |

> Notes brutes : [tool/streamlit_reply_agent/my_raw_notes.md](./tool/streamlit_reply_agent/my_raw_notes.md)

## Modules (ordre d'implémentation)

1. [Onboarding](./onboarding/README.md) — formulaire → profile JSON
2. [Deliverance](./deliverance/README.md) — timeline read-only + emails datés · **[page suivi client](./deliverance/front-client.md)** (FAQ + support)
3. [Matching](./matching/README.md) — Mettre en lien → Calendly
4. [Post-RDV](./post-rdv/README.md) — survey → parcours agence vs entreprise

## Post-SOLD (résumé)

| Partie | Comportement |
|--------|--------------|
| **Entreprise** | Félicitations page · 1 email J+7 onboarding · **aucun upsell** |
| **Agence** | Upsell 1489€ in-page si vente · 898€ exclusif survey · nurturing 60j si refus |

Détail : [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md)

## Règles clés

- **Supabase** = source de vérité (2 tables `agence`, `entreprise`)
- **Client React** = read-only sauf `POST onboarding` + `POST survey/[token]`
- **Streamlit** = seul cockpit d'action (via API Next.js)
- **Emails** = `booking_email_jobs` + `profile` — pas de table communications

## Repo

- [`doc/crm-deployment.md`](../crm-deployment.md) — déploiement
- [`crm/README.md`](../../crm/README.md) — CRM Streamlit existant
