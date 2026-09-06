# 15 — Conflits d’architecture

**Règle :** ne pas fusionner silencieusement deux specs incompatibles. Chaque `CF-*` pointe vers la question produit qui le résout. Ce fichier n’ajoute **pas** de questions dupliquées.

Format : ID, sources, implémentation réelle, écart, risque, reco, décision requise, systèmes, migration.

---

## CF-01 — Trois machines d’état

| | |
|--|--|
| **Source A** | [00-overview.md](../tech-stack/00-overview.md) — `ONBOARDED` … `SOLD` |
| **Source B** | [dashboards_infos_1.md](../documentations_2/dashboards_infos_1.md) — `NOT_PAID` … `MEETING_10` |
| **Implémentation** | Enum `lead_statut` CRM : `NOTBOOKED`, `BOOKED`, `CLICKED`, `CANCELLED`, `MEETING_BOOKED`, `CONFIRMED`, `ONBOARDED` |
| **Écart** | Trois produits différents sur les mêmes tables |
| **Risque** | High — mauvais enum, mauvais dashboards, mauvais emails |
| **Reco** | [FND-01](./01-foundations-validation.md) option A (tech-stack canonique + CRM = sous-état) |
| **Décision** | FND-01 |
| **Systèmes** | DB, Calendly, dashboards, Resend, matching |
| **Migration** | `ALTER TYPE lead_statut` et/ou colonne d’état séparée ; backfill des leads CRM |

---

## CF-02 — Cockpit d’écriture

| | |
|--|--|
| **Source A** | [01-four-lines-model.md](../tech-stack/01-four-lines-model.md) — Streamlit seul writer |
| **Source B** | [app/internal/README.md](../../app/internal/README.md) — `/internal` + `/api/admin/*` sans auth |
| **Implémentation** | Les deux existent ; session admin **supprimée** (`lib/admin/auth.ts`) |
| **Écart** | Doc d’architecture vs politique interne récente vs `.env.example` (`ADMIN_SECRET`) |
| **Risque** | High — double vérité d’admin + APIs ouvertes |
| **Reco** | FND-02 A + question [SEC-01](./12-security-permissions-validation.md) (auth = politique, pas fail-closed secrets) |
| **Décision** | FND-02, SEC-01 |
| **Systèmes** | Streamlit, `/internal`, admin APIs |
| **Migration** | Selon FND-02 : déprécier Streamlit métier ou figer `/internal` en contenu only |

---

## CF-03 — Écritures client

| | |
|--|--|
| **Source A** | Tech-stack : GET + 2 POST (onboarding, survey) |
| **Source B** | [sequence_client_not_paid.md](../documentations_2/sequence_client_not_paid.md) — Stripe, CTA Activer, `NOT_PAID` |
| **Implémentation** | Pas de dashboard client ; onboarding **admin** |
| **Écart** | Trois niveaux d’agence : observateur / payeur self-serve / rien |
| **Risque** | High |
| **Reco** | [FND-03](./01-foundations-validation.md) |
| **Décision** | FND-03, INT-01 |
| **Systèmes** | Surfaces, Stripe, onboarding |
| **Migration** | Routes publiques vs admin-only |

---

## CF-04 — Stripe MVP

| | |
|--|--|
| **Source A** | V-38 / post-rdv : paiement admin, pas de Stripe |
| **Source B** | sequence_client_not_paid : « stripe link » |
| **Implémentation** | Aucun SDK Stripe, aucune route |
| **Écart** | Paiement offline vs checkout |
| **Risque** | High si on code les deux |
| **Reco** | [INT-01](./11-integrations-validation.md) |
| **Décision** | INT-01 |
| **Systèmes** | Paiement, survey, onboarding |
| **Migration** | Si Stripe : nouveau module ; si manuel : file d’attente admin |

---

## CF-05 — Surfaces client

| | |
|--|--|
| **Source A** | Tech-stack : suivi agence **et** entreprise |
| **Source B** | documentations_2 : **pas** de dashboard entreprise dans cette version |
| **Implémentation** | Marketing Next seulement |
| **Écart** | Scope UI |
| **Risque** | Medium — construire le mauvais portail |
| **Reco** | [SUR-01](./06-surfaces-validation.md) |
| **Décision** | SUR-01 |
| **Systèmes** | App Router, auth token |
| **Migration** | Pages `/suivi`, `/survey` ou non |

---

## CF-06 — Rendez-vous / compteurs

| | |
|--|--|
| **Source A** | documentations_2 : RDV = entité, compteur → `MEETING_n` |
| **Source B** | Code : colonnes Calendly **sur la row lead** (un RDV à la fois) |
| **Implémentation** | Pas de table `appointments` |
| **Écart** | 1 lead = 1 meeting CRM vs N meetings de délivrance |
| **Risque** | High — écrasement du RDV d’acquisition si on réutilise les mêmes colonnes |
| **Reco** | [SOT-01](./16-sources-and-events-validation.md) — **ne pas** présupposer que `appointments` existe |
| **Décision** | SOT-01, FND-01 |
| **Systèmes** | DB, Calendly, dashboard, meeting counter |
| **Migration** | Soit nouvelle table, soit JSON historique, soit un seul meeting par lead |

---

## CF-07 — Table `matches`

| | |
|--|--|
| **Source A** | [matching/db.md](../tech-stack/matching/db.md) — SQL `CREATE TABLE matches` |
| **Source B** | Registry `status: planned` |
| **Implémentation** | Aucune migration, aucun code |
| **Écart** | Spec vs planned vs absent |
| **Risque** | Medium |
| **Reco** | [FND-05](./01-foundations-validation.md) |
| **Décision** | FND-05 |
| **Systèmes** | DB, admin matching |
| **Migration** | Créer table + FKs seulement si FND-05 ≠ B |

---

## CF-08 — Questionnaire antérieur inachevé

| | |
|--|--|
| **Source A** | [VALIDATION.md](../tech-stack/VALIDATION.md) V-01–D-15 vides |
| **Source B** | C-01–C-06 pré-cochés |
| **Implémentation** | — |
| **Écart** | On ne peut pas traiter l’ancien fichier comme des décisions |
| **Risque** | Medium — un agent « complète » l’ancien doc et code |
| **Reco** | Ce package **remplace** VALIDATION.md ; C-01–C-06 repris dans [17](./17-capacity-sla-validation.md) |
| **Décision** | CAP-01 (toujours valides ?) |
| **Systèmes** | Documentation |
| **Migration** | Bannière superseded sur VALIDATION.md |

---

## CF-09 — Auth admin documentée vs code

| | |
|--|--|
| **Source A** | `.env.example` : `ADMIN_SECRET` + cookie session |
| **Source B** | README internal : pas de login, pas de `verifyAdminRequest` |
| **Implémentation** | Fichiers auth **supprimés** (WIP git) |
| **Écart** | Trois politiques |
| **Risque** | High — APIs `/api/admin/*` mutantes sans garde |
| **Reco** | [SEC-01](./12-security-permissions-validation.md) ; `ENG-04` = secrets cron/webhook fail-closed (autre sujet) |
| **Décision** | SEC-01 |
| **Systèmes** | `/api/admin/*`, `/internal` |
| **Migration** | Réintroduire session **seulement** si SEC-01 ≠ A (keep no-auth) |

---

## CF-10 — Trois arbres de documentation actifs

| | |
|--|--|
| **Source A** | `doc/tech-stack/` présenté comme canonique |
| **Source B** | `doc/documentations_2/` + doublon `doc/documentation_2/` |
| **Implémentation** | Les trois sont dans le repo |
| **Écart** | Les agents implémentent au hasard |
| **Risque** | High |
| **Reco** | Après vos réponses : une doc canonique ; archiver le reste. Question [BND-01](./14-implementation-boundaries-validation.md) |
| **Décision** | BND-01 |
| **Systèmes** | `/doc` |
| **Migration** | Archive + README pointeurs |

---

## CF-11 — Double subsequence Instantly

| | |
|--|--|
| **Source A** | Next `lib/instantly-bypass` + crons + webhooks |
| **Source B** | `app/streamlit_subsequence` |
| **Implémentation** | Les deux opèrent |
| **Écart** | Double E1 / double avance de pipeline possible |
| **Risque** | High — emails doublons |
| **Reco** | [LEG-02](./18-legacy-ops-validation.md) : un exécuteur (Next), Streamlit = UI |
| **Décision** | LEG-02 |
| **Systèmes** | Instantly, Resend-like sends via Instantly API |
| **Migration** | Éteindre un des deux chemins d’envoi |

---

## CF-12 — Fin de RDV / no-show

| | |
|--|--|
| **Source A** | Tech-stack : webhook fin RDV → `POST_RDV_SURVEY` |
| **Source B** | CGV : no-show signalé par le client sous 48 h, remplacement 14 j |
| **Implémentation** | Calendly : `invitee.created` + `invitee.canceled` seulement ; ignore le reste |
| **Écart** | Survey auto vs déclaration manuelle |
| **Risque** | Medium |
| **Reco** | [ORCH-01](./04-orchestration-validation.md) |
| **Décision** | ORCH-01 (définition de l’événement) ; [ADM-03](./19-internal-admin-validation.md) (où l’opérateur clique) |
| **Systèmes** | Calendly, emails, statuts |
| **Migration** | Nouveaux events Calendly et/ou bouton admin no-show |

---

## CF-13 — CGV markdown vs souvenir JSON / pricing dupliqué

| | |
|--|--|
| **Source A** | Souvenir ops : CGV éditées en JSON Streamlit (`streamlit_funnels`) |
| **Source B** | [`cvg_master.md`](../tech-stack/cvg_master.md) / [`cvg_entreprise.md`](../tech-stack/cvg_entreprise.md) + loader [`legal-content.ts`](../../lib/site/legal-content.ts) |
| **Implémentation** | Markdown = SoT réelle ; **aucun** JSON CGV. [`content/pricing/agence.json`](../../content/pricing/agence.json) recopie §5 (1489 / 2500 / 14 j / MRR). Preview `/internal` **lecture seule**. |
| **Écart** | Trois vérités possibles (markdown, pricing JSON, mémoire JSON CMS) |
| **Risque** | High — mauvais CMS, contrat ≠ landing |
| **Reco** | [CVG-01](./20-cvg-validation.md) A (markdown + write `/internal`) ; pricing dérivé ([CVG-02](./20-cvg-validation.md)) |
| **Décision** | CVG-01, CVG-02 |
| **Systèmes** | `/cvg`, internal legal, PricingEditor, FAQ, AI reply |
| **Migration** | Activer write markdown **ou** déplacer en DB ; aligner pricing sur constantes (`ENG-16`) |

---

## CF-14 — Issues d’appel PAID / NO SHOW / NOT PAID vs enum lead vs FND-01

| | |
|--|--|
| **Source A** | [`admin_sales_metric_page.md`](../documentations_2/admin_sales_metric_page.md) — issues **sur l’appel** : `PAID` / `NO SHOW` / `NOT PAID` ; notes JSON local |
| **Source B** | Enum `lead_statut` CRM + machines FND-01 (`SOLD`, `MEETING_n`, `NOT_PAID` délivrance) |
| **Implémentation** | Aucune table d’appel, aucune page metrics |
| **Écart** | Quatrième vocabulaire de statuts, collé au même mot `PAID` / `NOT_PAID` |
| **Risque** | High — un `UPDATE lead.statut = 'PAID'` casserait le CRM et FND-01 |
| **Reco** | [SAL-01](./21-sales-ops-validation.md) A : entité d’appel séparée ; `PAID` d’appel ≠ `lead_statut`. [FND-16](./01-foundations-validation.md) pour le lien paiement → onboarding. |
| **Décision** | SAL-01, FND-16 |
| **Systèmes** | `/internal` sales, Calendly, database, dashboards |
| **Migration** | Si SAL-01 A : table (ou équivalent) `sales_call` + métriques dérivées, **pas** JSON laptop (`ENG-17`) |

---

## CF-15 — `/internal` console ops vs inventaire + placeholders

| | |
|--|--|
| **Source A** | Intention : `/internal` = édition live + docs canoniques + **triggers** (ex. no-show depuis une table booking) |
| **Source B** | [`app/internal/README.md`](../../app/internal/README.md) + nav : architecture, funnel builder, FAQ/pricing JSON |
| **Implémentation** | Édition partielle ; CGV read-only ; emails = `FunnelPlaceholder` → Streamlit ; **pas** de table meetings. `app/streamlit_funnels` **absent** (`ENG-15`). |
| **Écart** | Wiki + CMS fichiers vs cockpit ops |
| **Risque** | High — on construit le mauvais dashboard ; Streamlit reste le writer réel |
| **Reco** | [ADM-01](./19-internal-admin-validation.md) A ; édition booking [ADM-02](./19-internal-admin-validation.md) ; triggers [ADM-03](./19-internal-admin-validation.md). Cohérent avec FND-02. |
| **Décision** | ADM-01 (ADM-02, ADM-03 en découlent) |
| **Systèmes** | `/internal`, Streamlit, APIs admin, jobs |
| **Migration** | Selon ADM-01 : parité Streamlit → Next, ou figer `/internal` contenu + archi |

---

## Matrice conflit → question

| Conflit | Question |
|---------|----------|
| CF-01 | FND-01 |
| CF-02 | FND-02, SEC-01 |
| CF-03 | FND-03, INT-01 |
| CF-04 | INT-01 |
| CF-05 | SUR-01 |
| CF-06 | SOT-01 |
| CF-07 | FND-05 |
| CF-08 | CAP-01 |
| CF-09 | SEC-01 |
| CF-10 | BND-01 |
| CF-11 | LEG-02 |
| CF-12 | ORCH-01, ADM-03 |
| CF-13 | CVG-01, CVG-02 |
| CF-14 | SAL-01, FND-16 |
| CF-15 | ADM-01 |
