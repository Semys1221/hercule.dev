# 00 — Index du package de validation

**Statut du package :** à remplir par le product owner.  
**Statut code :** aucun changement de production dans cette phase.

Mode d’emploi : [README.md](./README.md) · Propriété : [00-decision-ownership.md](./00-decision-ownership.md)

**Total questions produit : 72** (hors `ENG-*` / `CF-*`). Extension : intention métier, `/internal`, CGV, sales-ops, paiement↔onboarding, UI.

---

## Graphe de dépendances (architecture réelle)

```
Intention métier (offre, unité, pack, qui close)  ← BIZ, sas produit
        ↓
Fondations (état, cockpit, qui écrit)     ← FND-16 avec FND-01
        ↓
Database (enum, profile, appointments?)
        ↓
Intégrations (Stripe, Instantly=ops?, Calendly)
        ↓
Orchestration (fin RDV, jobs, nurturing cancel)
        ↓
API / Webhooks / Cron
        ↓
Sécurité (auth /internal — politique, pas fail-closed)
        ↓
Internal admin (édition / docs / triggers)  ← ADM, après FND-02 + SEC-01
        ↓
Surfaces (client, HTML, internal) + UI-01
        ↓
Composants (registry + catalogue fermé COMP-02)
        ↓
Funnels (sales fichiers vs matching vs CRM)
        ↓
Séquences email + copy
        ↓
CGV (SoT légale)                          ← après copy (CPY), pas à la place
        ↓
Sales ops (appels, métriques, entreprise) ← après SOT-01 / Calendly
        ↓
Settings + Capacity/SLA
        ↓
Legacy ops (Streamlit)
        ↓
Frontières d’implémentation (doc canonique, 1er module)
```

Conflits (`15`) et SoT/événements (`16`) se lisent **en parallèle** des fondations, pas après.

Ordre de remplissage recommandé : `22` → `01` → `15`+`16` → `03` → `11` → `04` → `05` → `12` → `19` → `06` → `02` → `07` → `08` → `09` → `20` → `21` → `10`+`17` → `18` → `13` (lecture) → `14`.

---

## Index des documents

| Domaine | Document | Purpose | # décisions | High-impact | Dépend de | Statut |
|---------|----------|---------|-------------|-------------|-----------|--------|
| Propriété | [00-decision-ownership.md](./00-decision-ownership.md) | ENG vs produit | 0 (ENG décidés) | — | — | à lire |
| Intention métier | [22-business-intent-validation.md](./22-business-intent-validation.md) | Offre, unité, paiement vs livraison, pack | 10 | BIZ-01…06 | — | à remplir **en premier** |
| Fondations | [01-foundations-validation.md](./01-foundations-validation.md) | Machines d’état, cockpit, matching, commercial, paiement | 16 | FND-01,02,03,04,05,06,13,16 | 22 | à remplir |
| Composants | [02-components-validation.md](./02-components-validation.md) | Inventaire + registry + catalogue fermé | 2 | COMP-02 | 01, 03, 19 | à remplir |
| Database | [03-database-validation.md](./03-database-validation.md) | 17 tables, enum, profile | 2 | DB-01 | 01, 16 | à remplir |
| Orchestration | [04-orchestration-validation.md](./04-orchestration-validation.md) | Jobs, fin RDV | 3 | ORCH-01 | 01, 03, 11 | à remplir |
| API/WH/Cron | [05-api-webhooks-crons-validation.md](./05-api-webhooks-crons-validation.md) | Inventaire routes | 1 | API-01 | 04, 12 | à remplir |
| Surfaces | [06-surfaces-validation.md](./06-surfaces-validation.md) | Marketing, HTML, client, internal, langage visuel | 4 | SUR-01 | 01, 12, 19 | à remplir |
| Funnels | [07-funnels-validation.md](./07-funnels-validation.md) | Sales JSON vs CRM vs matching | 2 | FUN-02 | 01, 16 | à remplir |
| Emails | [08-email-sequences-validation.md](./08-email-sequences-validation.md) | Booking vs produit vs Instantly vs CGV | 5 | EML-01 | 01, 04, 20 | à remplir |
| Copy | [09-copywriting-validation.md](./09-copywriting-validation.md) | Prix, termes, SoT contenus | 4 | CPY-04 | 01, 07 | à remplir |
| Settings | [10-settings-validation.md](./10-settings-validation.md) | Env, singletons, toggle 15 j | 2 | — | 17 | à remplir |
| Intégrations | [11-integrations-validation.md](./11-integrations-validation.md) | Stripe, Instantly ops, scraper | 3 | INT-01 | 01 | à remplir |
| Sécurité | [12-security-permissions-validation.md](./12-security-permissions-validation.md) | `/internal`, slugs | 2 | SEC-01 | 01, 05 | à remplir |
| Dette | [13-technical-debt-validation.md](./13-technical-debt-validation.md) | Morts, doublons | 0 | — | 18 | à lire |
| Frontières | [14-implementation-boundaries-validation.md](./14-implementation-boundaries-validation.md) | Doc canonique, 1er module | 2 | BND-01, BND-02 | toutes | à remplir **en dernier** |
| Conflits | [15-conflicts-validation.md](./15-conflicts-validation.md) | CF-01…CF-15 | 0 (pointeurs) | — | 01 | à lire |
| SoT / events | [16-sources-and-events-validation.md](./16-sources-and-events-validation.md) | Vérités + événements | 3 | SOT-01 | 01, 03 | à remplir |
| Capacity | [17-capacity-sla-validation.md](./17-capacity-sla-validation.md) | C-01…C-06 toujours vrais ? | 1 | CAP-01 | 01 | à remplir |
| Legacy ops | [18-legacy-ops-validation.md](./18-legacy-ops-validation.md) | Streamlit, double bypass | 3 | LEG-01, LEG-02 | 01, 11 | à remplir |
| Internal admin | [19-internal-admin-validation.md](./19-internal-admin-validation.md) | Édition, docs SoT, triggers | 3 | ADM-01 | 01 (FND-02), 12 (SEC-01) | à remplir |
| CGV | [20-cvg-validation.md](./20-cvg-validation.md) | SoT contrat, write-back, consommateurs | 2 | CVG-01 | 09 (CPY-03) | à remplir |
| Sales ops | [21-sales-ops-validation.md](./21-sales-ops-validation.md) | Appels, métriques, sales entreprise | 2 | SAL-01, SAL-02 | 16 (SOT-01), 11 | à remplir |

---

## Décisions high-impact (fork d’architecture)

| ID | Question (raccourci) |
|----|----------------------|
| BIZ-01 | Meetings-only, closing Hercule, marketplace, ou hybride ? |
| BIZ-02 | Qu’est-ce qui consomme une Attribution (planifié / honoré / signé) ? |
| BIZ-03 | Assignation exclusive vs catalogue de demandes ? |
| BIZ-04 | Paiement avant livraison, audit-then-buy, NOT_PAID, ou self-checkout ? |
| BIZ-05 | L’agence payante : suivi+survey, rien in-app, ou self-serve large ? |
| BIZ-06 | Pack : séquentiel vs parallèle ; crédits après vente ; 898 quand / quoi ? |
| BIZ-07 | Starter vs 2500 : parallèles, ladder, autre métier, ou copy ? |
| FND-01 | Quelle machine d’état est canonique ? |
| FND-02 | Cockpit Streamlit vs Next ? |
| FND-03 | Écritures client autorisées ? |
| FND-04 | Promote délivrance manuel ? |
| FND-05 | Matching « Mettre en lien » au produit ? |
| FND-06 | Fin de mission = SOLD survey vs MEETING_10 vs CRM ? |
| FND-13 | Remboursement / crédit si match sans vente ? |
| FND-16 | Paiement = flag/événement vs machine canonique vs ops-only ? |
| DB-01 | Un ou deux champs de statut ? |
| SOT-01 | Entité appointments distincte de l’acquisition ? |
| ORCH-01 | Comment clôturer un RDV (admin vs webhook) ? |
| INT-01 | Paiement manuel vs Stripe ? |
| API-01 / SEC-01 | Auth sur `/api/admin` et `/internal` ? |
| SUR-01 | Surfaces client agence / entreprise / aucune ? |
| FUN-02 | 898 € = 3 cycles ou 3 Calendly ? |
| EML-01 | Queue jobs pour emails produit ? |
| LEG-01 / LEG-02 | Devenir Streamlit / exécuteur bypass ? |
| BND-01 / BND-02 | Doc canonique et premier module ? |
| CAP-01 | SLA capacity toujours valides ? |
| ADM-01 | `/internal` = console ops (édition + docs + triggers) ? |
| CVG-01 | CGV canonique = markdown, Supabase, ou JSON CMS ? |
| SAL-01 | Sales-ops (appels / issues / forecasts) in-scope `/internal` ? |
| SAL-02 | Sales entreprise = gratuit, payant comme agence, ou domaine séparé ? |

---

## Mapping ancien VALIDATION.md → ce package

L’ancien [VALIDATION.md](../tech-stack/VALIDATION.md) est **remplacé** pour la prise de décision. C-01–C-06 restent la base de CAP-01.

| Ancien | Nouveau | Note |
|--------|---------|------|
| V-01 | FND-01 | 4 modules vs autres machines |
| V-02 | FND-02 | 4 lignes / cockpit |
| V-03 | ENG-03 | SoT Supabase |
| V-04 | FND-02, API-01 | writes via API |
| V-05 | ENG-01 | pas de table comms |
| V-06 | 03 Partie 1 | 2 tables : garder, pas de question |
| V-07 | FND-05 | matches |
| V-08 | FND-01, DB-01 | enum |
| V-09 | EML-01, ORCH-02 | queue jobs |
| V-10 | FND-08 | continue search / abandon |
| V-11 V-12 V-13 V-14 | DB-02, SOT-03, FND-10 | profile |
| V-15 V-16 | FND-03 | écritures / ONBOARDED |
| V-17 | SEC-02 | token survey |
| V-18 | ENG-02 | pas Resend Python |
| V-19 V-22 V-26 V-28 | EML-01 | emails produit |
| V-20 V-21 | SOT-03 + CGV Partie 1 | délais / rétractation 4 j |
| V-23 | FND-04 | promote |
| V-24 V-40 | FND-02 | cockpit admin |
| V-25 | SUR-01 | timeline GET |
| V-27 | FND-15 | advance/delay |
| V-29 V-31 | FND-05, FND-06 | matching non terminal |
| V-30 | FND-12, SUR-03 | webhook book |
| V-32 | ORCH-01 | fin RDV survey |
| V-33 | EML-03 | entreprise no upsell |
| V-34 | FND-09 | 1489 in-page |
| V-35 V-36 | FND-10 | 898 page-only |
| V-37 | EML-02 | nurturing |
| V-38 | INT-01 | pas Stripe |
| V-39 | FND-11 | 2500 hors MVP |
| D-01 | FND-06, FND-09 | SOLD vs paiement |
| D-02 | FND-07 | une vs deux surveys |
| D-03 | FND-08 | abandon entreprise |
| D-04 | CPY-02 | wording J+7 |
| D-05 | FND-12 | statuts décalés |
| D-06 | FND-10 | 898 si onglet fermé |
| D-07 | EML-02 | volume nurture |
| D-08 | FND-01, FND-02, INT-02 | coexistence CRM |
| D-09 | SUR-03 | notif agence |
| D-10 | FND-13, BIZ-02, BIZ-10 | remboursement |
| D-11 | FUN-02, BIZ-06 | 898 = 3 RDV |
| D-12 | INT-01 | paiement manuel |
| D-13 | EML-03 | avis MVP |
| D-14 | FND-14 | FK après decline |
| D-15 | CPY-01 | 1500 vs 1489 |
| C-01…C-06 | CAP-01 | pré-validés, confirmer |

---

## Après remplissage

1. Dire à l’agent : **c’est fini** (ne plus éditer les cases).
2. L’agent lit tout, produit le plan d’architecture définitif (CONFIRMED / REJECTED / …).
3. Si deux réponses s’annulent (ex. FND-05 B et FUN-02 A, ou FND-16 B et FND-01 ≠ C, ou un `FND-*` qui contredit un `BIZ-*`), **stop** : une question ciblée, pas d’implémentation.
4. Ensuite seulement : doc canonique, infra `/internal`, modules un par un.
