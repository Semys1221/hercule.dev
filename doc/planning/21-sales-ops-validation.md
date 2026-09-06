# 21 — Sales ops (appels, métriques, entreprise)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


**Intention :** un système cohérent d’**activité commerciale** (appels, issues, prévisions) relié aux fiches agence/entreprise — **sans** fusionner ça avec `lead_statut` ni avec `MEETING_n` tant que FND-01 n’est pas tranché.

Spec uniquement : [`doc/documentations_2/admin_sales_metric_page.md`](../documentations_2/admin_sales_metric_page.md) (doublon `documentation_2/`). **Zéro** table, **zéro** page.

JSON local pour les notes d’appel = anti-pattern équipe (`ENG-17` : si SAL-01 = A, persister en Supabase, métriques **dérivées**).

---

## PARTIE 1 — Ce qui est valide (comme intention documentée, pas comme code)

La spec sales metrics décrit une chaîne saine **si** on sépare les vocabulaires :

```
Calendly (RDV planifiés)
    → notes + statut D’APPEL (PAID | NO SHOW | NOT PAID)
    → métriques dérivées (closing réel, CA)
prévision = volume planifié × closing cible  (config, pas une table de forecasts figés)
```

Calendly webhook **existe** déjà pour l’**acquisition** CRM (`invitee.created`). Ce n’est pas encore une « sales call table ».

L’arbre `/internal` a déjà **Sales › Funnel** discovery / pitch / closing **par audience** — aujourd’hui c’est le **builder de pages**, pas un CRM d’appels.

Entreprise : [`cvg_entreprise.md`](../tech-stack/cvg_entreprise.md) = **gratuit, aucun upsell**. Ne pas inventer un pipeline de vente payante entreprise sans SAL-02.

---

## PARTIE 2 — Écarts

| Spec sales metrics | Live | Risque |
|--------------------|------|--------|
| Page Sales Metrics sous CVG & légal | absente (KPI funnel = placeholder) | — |
| Statuts appel PAID / NO SHOW / NOT PAID | nulle part en DB | **4ᵉ vocabulaire** vs CRM vs FND-01 vs delivery `NOT_PAID` |
| JSON local | — | perdu, non partagé, non SoT |
| Forecast / DECENT-GOOD-EXCELLENT | — | — |
| Lien client/agence/entreprise | leads existent ; pas de FK appel→lead | — |

**Reco :** si sales-ops est in-scope, **entité `sales_call` (ou équivalent)** distincte du lead ; `PAID` sur l’appel ≠ `statut` lead.  
**Conflit :** [CF-14](./15-conflicts-validation.md).

#### [SAL-01] Le **sales-ops** (appels de vente planifiés, notes, issues PAID / NO SHOW / NOT PAID **sur l’appel**, forecasts, closing rate) fait-il partie du produit `/internal` ?

Ce n’est pas le matching de délivrance ni le CRM Instantly, même si Calendly peut alimenter le calendrier.

- [x] **A (recommandé)** — Oui : domaine **séparé** du `lead_statut` ; Calendly = RDV planifiés (dérivé) ; issues et notes en **base** (pas JSON laptop) ; métriques calculées.
- [ ] **B** — Hors MVP : Calendly + notes Streamlit / hors app suffisent.
- [ ] **C** — Fusionner les issues d’appel dans `lead_statut` (un seul enum pour tout).

**Impact si l’architecture change :** High  
**Domaines affectés :** `/internal`, Calendly, database, FND-01, INT-01  
**Conflit :** CF-14

#### [SAL-02] Le « sales » **entreprise** est-il un workflow payant distinct, une variante du sales agence, ou de l’acquisition gratuite ?

La CGV entreprise interdit frais et upsell. Le builder internal a pourtant un funnel Sales entreprise (discovery / pitch / closing).

- [x] **A (recommandé)** — **Pas** de pipeline de vente payante entreprise : qualification / acquisition gratuite ; d’éventuelles métriques = ops (taux de book), pas de CA entreprise.
- [ ] **B** — Même workflow sales **payant** que l’agence (contredit `cvg_entreprise.md` — préciser l’offre en notes).
- [ ] **C** — Domaine entreprise séparé (expliquer **ce qui est vendu** en notes).

**Impact si l’architecture change :** High  
**Domaines affectés :** Funnel entreprise, CGV, landing `/entreprise`, métriques  
**Lié :** FND (entreprise ne paie pas), CVG-01

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| SAL-01 | A | Sales-ops in /internal ; notes en base |
| SAL-02 | A | Entreprise jamais payante |
