# 19 — Console admin `/internal`

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


**Intention produit (pas l’implémentation actuelle) :** `/internal` est le **cockpit opérateur** à trois métiers — édition de ressources live, documentation canonique qui se propage, déclenchement de workflows. Streamlit / JSON / placeholders ne sont pas la cible par défaut.

Ne pas reposer [FND-02](./01-foundations-validation.md) (Streamlit vs Next) ni [SEC-01](./12-security-permissions-validation.md) (auth). Répondre **de façon cohérente** avec FND-02 : si FND-02 = B (Streamlit seul writer métier), ADM-01 C ou B devient le seul couple cohérent.

---

## PARTIE 1 — Ce qui est valide

L’arbre de navigation Next **reprend** le shell documenté de `streamlit_funnels` (audience agence | entreprise → Sales / Onboarding / Dashboard / CVG & légal / Emails) : [`lib/admin/navigation.ts`](../../lib/admin/navigation.ts).

| Rôle visé | Ce qui existe | Écart |
|-----------|---------------|-------|
| **Édition** | Funnel builder (`content/funnels/**/funnel.json`), fiche onboarding INSERT, mockup `agence_demandes`, FAQ JSON, pricing JSON | Booking emails = placeholder → Streamlit ; CGV non éditable |
| **Documentation consolidée** | Preview markdown CGV / mentions / confidentialité via [`legal-content.ts`](../../lib/site/legal-content.ts) | Edit toolbar **désactivée** (« P2 ») dans [`legal-doc.tsx`](../../components/internal/funnels/legal-doc.tsx) |
| **Triggering** | — | Emails PRE-CLOSE/CLOSE = `FunnelPlaceholder` + hint `npm run streamlit-*`. Pas de table booking, pas de bouton no-show |

Inventaires `/internal/components` et `/internal/database` : utiles, **ce n’est pas** le cockpit ops.

Le dossier `app/streamlit_funnels` est **absent** ; le script `pnpm streamlit-funnels` est mort. **Ne pas** le ressusciter (`ENG-15`).

Toolbar édition / preview / promote / delete : pattern UI déjà là ([`internal-resource-toolbar.tsx`](../../components/internal/funnels/ui/internal-resource-toolbar.tsx)) — à brancher, pas à réinventer.

---

## PARTIE 2 — Écarts

**Ce qui est faux :** traiter `/internal` comme wiki d’architecture alors que l’intention est un dashboard ops (édition + SoT + triggers).  
**Pourquoi :** les vrais writers restent Streamlit ; le builder Next n’exécute pas les séquences.  
**Reco :** contrat produit ADM-01 ; migrer l’UI booking (ADM-02) ; table meetings + actions (ADM-03) alignée sur [ORCH-01](./04-orchestration-validation.md).  
**Conflit :** [CF-15](./15-conflicts-validation.md).

#### [ADM-01] `/internal` est-il le console opérateur à **trois métiers** (éditer les ressources live, éditer la doc canonique qui se propage, déclencher des workflows) ?

Aujourd’hui : édition partielle, CGV lecture seule, zéro trigger.

- [x] **A (recommandé)** — Oui : c’est le contrat produit ; Streamlit reste temporaire jusqu’à parité (FND-02 A).
- [ ] **B** — Non : `/internal` reste architecture + funnel content / FAQ / pricing ; l’ops métier reste Streamlit.
- [ ] **C** — Split durable : docs + édition de contenu dans Next ; **triggers** (no-show, send-once, promote) restent Streamlit.

**Impact si l’architecture change :** High  
**Domaines affectés :** `/internal`, Streamlit, APIs admin, SEC-01  
**Lié :** FND-02

#### [ADM-02] L’édition **et** le preview des séquences booking (sujet, HTML, délais) doivent-ils vivre dans `/internal`, en s’appuyant sur `booking_email_templates` et l’API render déjà existantes ?

Le live est [`app/streamlit_booking_resend`](../../app/streamlit_booking_resend/). La feuille `/internal/funnels/.../emails/pre_close/booking` n’est qu’un placeholder.

- [x] **A (recommandé)** — Oui : migrer l’UI d’édition/preview vers `/internal` ; la table et le cron Next restent la SoT d’exécution.
- [ ] **B** — Garder Streamlit `booking_resend` comme éditeur.
- [ ] **C** — `/internal` = preview seulement ; l’édition reste SQL / scripts.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Streamlit booking, `/internal/emails`, `booking_email_templates`  
**Lié :** LEG-01, EML-01

#### [ADM-03] Les actions ops du type **no-show** (et équivalents : realized, resend survey) se déclenchent-elles depuis une **table rendez-vous** dans `/internal` ?

Complète [ORCH-01](./04-orchestration-validation.md) (comment l’événement est **défini**) : ici c’est **où l’opérateur clique**. Aucune table UI n’existe.

- [x] **A (recommandé)** — Oui : table meetings / bookings interne ; clic « no-show » enqueue la séquence no-show (après ORCH-01).
- [ ] **B** — Pas de table interne au MVP ; no-show = Streamlit ou déclaration hors app (CGV 48 h).
- [ ] **C** — Triggers uniquement via API/script, sans table UI.

**Impact si l’architecture change :** High  
**Domaines affectés :** `/internal`, Calendly, jobs, SOT-01  
**Lié :** ORCH-01, SOT-01

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| ADM-01 | A | /internal = édition + docs + triggers |
| ADM-02 | A | Édition emails vente dans /internal |
| ADM-03 | A | Table RDV interne pour no-show / RDV fait |
