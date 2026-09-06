# 01 — Fondations

**Propriétaire :** produit pour les questions `FND-*`. Les `ENG-*` liées (vérité en base, pas de table comms, orchestration TS) sont dans [00-decision-ownership.md](./00-decision-ownership.md).

**Dépendances :** [22-business-intent-validation.md](./22-business-intent-validation.md) (`BIZ-*`). Remplir **`22` d’abord**. Une réponse `FND-*` ne doit pas contredire un `BIZ-*` déjà coché.

---

## PARTIE 1 — Ce qui est valide

À confirmer : ce n’est pas une liste de souhaits, c’est ce que le code **et** les docs alignés décrivent déjà de façon cohérente.

### Aligné et à préserver (sauf question contraire plus bas)

1. **Hercule met en relation des entreprises et des agences web.** L’agence paie ; l’entreprise ne paie rien — jamais d’upsell entreprise après embarquement (tech-stack + CGV). C’est une exigence métier stable. Pas de question : la remettre en cause changerait le produit, pas l’architecture.
2. **Supabase est la vérité opérationnelle des leads** `agence` / `entreprise`. Admin, webhooks et crons lisent/écrivent la même row. (`ENG-03`)
3. **Deux tables leads miroir** existent et fonctionnent (`agence`, `entreprise`). Ce n’est pas un défaut SQL à « unifier » sans décision produit.
4. **Le CRM d’acquisition est réel** : Instantly → clic lien → Calendly → jobs Resend. C’est le système live, pas un prototype.
5. **Le client marketing Next** (`/`, `/entreprise`, FAQ, légal) est réel et distinct du CRM.
6. **Capacity / SLA C-01–C-06** ont déjà été cochés « oui » dans l’ancien questionnaire. Reprise compacte dans [17-capacity-sla-validation.md](./17-capacity-sla-validation.md).
7. **CGV no-show : 14 jours ouvrés**, signalement client sous 48 h ([cvg_master.md](../tech-stack/cvg_master.md) § 10.1). Le code ne l’automatise pas ; la règle légale reste la référence copy.

### Ce que la documentation fondations affirme — à valider, pas à croire

Le modèle « 4 lignes » (DB, front client, front interne Streamlit, emails) et les « 4 modules » (onboarding → délivrance → matching → post-RDV) sont **une spec**, pas l’implémentation. Le registry interne marque matching / suivi / survey en `spec`.

---

## PARTIE 2 — Ce qui doit changer ou être tranché

### Écart 1 — Trois machines d’état incompatibles

**Ce qui existe**

| Modèle | Statuts | Où | Implémenté ? |
|--------|---------|-----|----------------|
| CRM live | `NOTBOOKED` → `CLICKED` → `MEETING_BOOKED` → `CONFIRMED` / `CANCELLED` (+ `ONBOARDED` greffé) | Enum Postgres + `lib/link-tracking/types.ts` | Oui |
| Tech-stack | `ONBOARDED` → `IN_DELIVERANCE` → `MATCH_PROPOSED` → `MEETING_BOOKED` → `POST_RDV_SURVEY` → `SOLD` | `doc/tech-stack/00-overview.md` | Non (sauf `ONBOARDED`) |
| Delivery `documentations_2` | `NOT_PAID` → `PAID` → `MEETING_1` … `MEETING_10` → `COMPLETED` | `doc/documentations_2/dashboards_infos_1.md` | Non |

**Ce qui est faux :** traiter ces trois chaînes comme le même produit. **Pourquoi :** toute feature matching / dashboard / email post-RDV code la mauvaise machine. **Recommandation :** choisir **une** machine canonique, dériver les autres (CRM acquisition peut rester un sous-état). **Conséquence :** enum, dashboards, webhooks, copy. Conflit [CF-01](./15-conflicts-validation.md).

#### [FND-01] Quelle machine d’état produit est canonique pour le cycle de vie d’une fiche payante / livrée ?

Les trois modèles (CRM booking, 4 modules tech-stack jusqu’à `SOLD`, compteurs `MEETING_1`–`MEETING_10`) sont incompatibles ; les implémenter en parallèle duplique les sources de vérité.

- [ ] **A (recommandé)** — Canonique = modèle tech-stack (`ONBOARDED` … `SOLD`) ; le CRM `CLICKED` / `MEETING_BOOKED` / `CONFIRMED` reste un **sous-état d’acquisition** jusqu’au paiement / promote, puis bascule vers les statuts produit.
- [ ] **B** — Canonique = rester sur l’enum CRM live uniquement ; les modules délivrance / matching / post-RDV ne sont pas le produit à implémenter maintenant.
- [ ] **C** — Canonique = `NOT_PAID` → `PAID` → `MEETING_n` → `COMPLETED` (`documentations_2`) ; le tech-stack `SOLD` n’est pas la cible.

**Impact si l’architecture change :** High  
**Domaines affectés :** Database, Calendly, dashboards, Resend, matching, copy, CGV  
**Ancien ID :** V-01, V-08, D-08  
**Lié :** FND-16 (paiement vs onboarding vs délivrance — pas une 4ᵉ machine)

---

### Écart 2 — Qui a le droit d’agir sur le service

**Ce qui existe :** la doc dit « Streamlit = seul cockpit d’action ». Le code a Streamlit **et** `/internal` + `/api/admin/*` **sans auth**.  
**Pourquoi c’est un problème :** double cockpit, APIs admin mutantes joignables si l’URL l’est.  
**Recommandation :** un cockpit d’écriture métier (Next interne) ; Streamlit relégué aux outils d’outreach jusqu’à cutover. **Ne pas** ajouter d’auth en silence — voir [SEC-01](./12-security-permissions-validation.md).

#### [FND-02] Quel est le cockpit d’exploitation pendant (et après) la migration Next ?

La doc impose Streamlit comme unique writer ; Next `/internal` et les APIs admin existent déjà et écrivent (onboarding, funnels, demandes).

- [ ] **A (recommandé)** — Next `/internal` devient le cockpit produit (fiches, matching, paiement, dashboards) ; Streamlit reste **temporairement** l’ops Instantly / scraper / AI reply, avec cutover documenté.
- [ ] **B** — Préserver l’architecture documentée : Streamlit reste le seul writer métier ; `/internal` = documentation / funnel builder de contenu seulement.
- [ ] **C** — Split durable par domaine : Streamlit = CRM acquisition (liens, booking, Instantly) ; Next = produit (onboarding payant, délivrance, matching) ; les deux coexistent sans date de fin.

**Impact si l’architecture change :** High  
**Domaines affectés :** Surfaces, APIs admin, Streamlit, sécurité, orchestration  
**Ancien ID :** V-02, V-04, V-24, D-08  
**Lié :** [ADM-01](./19-internal-admin-validation.md) (trois métiers de `/internal` — ne pas reposer FND-02 là-bas)

---

### Écart 3 — Écritures client

**Tech-stack :** client = GET sauf `POST onboarding` et `POST survey`.  
**`sequence_client_not_paid` :** CTA Activer, Stripe, statut `NOT_PAID`.  
**Code :** pas de dashboard client ; onboarding admin seulement (`POST /api/admin/onboarding/[category]`).

#### [FND-03] Quelles écritures un client (agence ou entreprise) a-t-il le droit de déclencher ?

Deux specs et zéro dashboard client : sans cette règle, on ne sait pas quelles routes publiques créer.

- [ ] **A (recommandé)** — Exceptions = onboarding (création de fiche) + survey post-RDV tokenisé, comme le tech-stack ; tout le reste (paiement, matching, statut) est admin.
- [ ] **B** — Aucune écriture client pour l’instant : l’admin crée les fiches (comportement **actuel** de `/api/admin/onboarding`) ; onboarding public et survey restent hors MVP.
- [ ] **C** — Le client peut aussi payer / « Activer » (Stripe ou lien de paiement) et donc écrire un statut `PAID` / `NOT_PAID`, comme `sequence_client_not_paid`.

**Impact si l’architecture change :** High  
**Domaines affectés :** Surfaces, API, Stripe, sécurité, onboarding  
**Ancien ID :** V-15, V-16, V-17

---

### Écart 4 — Promote délivrance

La doc : inscription → `ONBOARDED` ; l’admin clique « Passer en délivrance ».  
Le code : `ONBOARDED` existe ; pas de route promote, pas de `IN_DELIVERANCE`.

#### [FND-04] Le passage en recherche active (délivrance) est-il toujours un acte admin manuel ?

Sans ça, on ne sait pas si l’onboarding doit enqueuer des emails tout de suite ou attendre.

- [ ] **A (recommandé)** — Oui : admin promote manuel → `IN_DELIVERANCE` + séquence emails (V-23).
- [ ] **B** — Pas de module délivrance pour le MVP : `ONBOARDED` suffit ; le CRM booking reste le seul parcours auto.
- [ ] **C** — Auto-promote à l’inscription ou au paiement confirmé, sans clic admin.

**Impact si l’architecture change :** High  
**Domaines affectés :** Onboarding, emails, admin, SLA  
**Ancien ID :** V-23

---

### Écart 5 — Matching comme produit

`matches` + `POST /api/matching/link` sont **spec**. Le live, c’est Calendly d’acquisition (prospect booke un call Hercule), pas un RDV agence↔entreprise.

#### [FND-05] Le matching admin « Mettre en lien » agence ↔ entreprise fait-il partie du produit à construire ?

Sans ça, Calendly restera uniquement un outil d’acquisition, pas de délivrance.

- [ ] **A (recommandé)** — Oui : matching manuel admin + table `matches` + email Calendly entreprise, **en plus** du CRM d’acquisition, avec un flag/catégorie pour ne pas mélanger les leads.
- [ ] **B** — Non : garder uniquement le funnel Calendly d’acquisition actuel ; pas de module matching.
- [ ] **C** — Matching plus tard ; d’abord terminer le CRM + dashboards de suivi **sans** lier agence et entreprise en base.

**Impact si l’architecture change :** High  
**Domaines affectés :** Database, Calendly, emails, admin, dashboards  
**Ancien ID :** V-07, V-29, V-31, D-08

---

### Écart 6 — Clôture commerciale (post-RDV)

Les règles tech-stack (entreprise sans upsell, agence 1489 in-page, 898 page-only, nurturing, paiement admin) ne sont **pas** dans le code. `documentations_2` déclenche l’upsell à `MEETING_10`. Ce n’est pas la même offre.

#### [FND-06] Quand une mission agence est-elle « terminée » côté produit (`SOLD` / `COMPLETED`) ?

`SOLD` à la vente survey vs `COMPLETED` à 10 RDV vs `CONFIRMED` Calendly décrivent trois fins de parcours.

- [ ] **A (recommandé)** — Fin de mission = survey positif (vente agence **ou** embarquement entreprise) → `SOLD`, comme le tech-stack ; `MEETING_10` n’est pas le trigger de clôture.
- [ ] **B** — Pas de clôture produit au MVP : le CRM s’arrête à `CONFIRMED` / `CANCELLED`.
- [ ] **C** — Fin de mission = quota de RDV livrés (`MEETING_10` / pack d’attributions), comme `documentations_2`.

**Impact si l’architecture change :** High  
**Domaines affectés :** Statuts, survey, upsell, emails, dashboard agence  
**Ancien ID :** V-31, V-33, D-01

#### [FND-07] Une seule réponse survey positive clôt-elle **les deux** fiches (agence et entreprise) ?

La doc `evaluateMatchOutcome` ferme les deux rows dès qu’une partie répond oui ; l’autre spec attend les deux ou l’admin.

- [ ] **A (recommandé)** — Une réponse positive suffit pour passer les deux en `SOLD` ; l’admin `force-sold` tranche les désaccords.
- [ ] **B** — Ne pas implémenter le survey au MVP (cohérent si FND-06 = B).
- [ ] **C** — Attendre les **deux** surveys, ou seulement l’admin, avant toute clôture.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Post-RDV, database, admin  
**Ancien ID :** D-02, V-40

#### [FND-08] Si l’entreprise n’est pas embarquée et refuse de relancer la recherche, quel état terminal voulez-vous ?

La doc ne définit pas le statut (rester `POST_RDV_SURVEY`, archiver, `CANCELLED`).

- [ ] **A (recommandé)** — Statut terminal explicite (ex. `CANCELLED` ou `ARCHIVED`), plus d’emails auto.
- [ ] **B** — Rester sur le statut survey / CRM actuel pour recontact admin manuel, sans nouvel enum.
- [ ] **C** — Retour `IN_DELIVERANCE` même si elle a dit ne pas continuer (relance malgré tout).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Statuts, emails, admin  
**Ancien ID :** V-10, D-03

---

### Écart 7 — Offres agence (1489 / 898 / 2500)

Exigences métier **distinctes** ; ne pas les fusionner.

#### [FND-09] Le renouvellement 1 489 € après vente se fait-il uniquement in-page, sans email auto à `SOLD` ?

Tech-stack V-34 : CTA sur `/survey/[token]`, pas de job `renewal_agence_1489`.

- [ ] **A (recommandé)** — Oui : 1489 in-page seulement ; paiement confirmé par l’admin ; pas d’email renewal auto à la vente.
- [ ] **B** — Pas d’upsell post-vente au MVP.
- [ ] **C** — Email auto 1489 à `SOLD` **et/ou** CTA in-page.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Survey, emails, paiement  
**Ancien ID :** V-34, D-01

#### [FND-10] L’offre 898 € (secours si pas de vente) reste-t-elle exclusive à la page survey, jamais en email ?

- [ ] **A (recommandé)** — Oui : 898 visible seulement sur la page survey ; decline = disparition permanente ; closing l’onglet ≠ refus.
- [ ] **B** — Pas d’offre 898 au MVP.
- [ ] **C** — 898 aussi par email, ou expiration temporelle, ou session unique (retour = plus d’offre).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Survey, emails, profile.offers  
**Ancien ID :** V-35, V-36, D-06

#### [FND-11] L’abonnement 2 500 €/mois reste-t-il commercialisé (landing + CGV) mais hors parcours technique MVP ?

- [ ] **A (recommandé)** — Oui : copy/CGV inchangés ; **pas** de routes, webhooks Stripe, ni champs `profile` abo au MVP.
- [ ] **B** — Retirer 2500 de la landing / CGV jusqu’à implémentation (changement **commercial**).
- [ ] **C** — Implémenter le parcours 2500 dans le MVP (paiement récurrent).

**Impact si l’architecture change :** High si C ; Medium si B  
**Domaines affectés :** Landing, CGV, Stripe, post-RDV  
**Ancien ID :** V-39

---

### Écart 8 — Règles matching / post-match encore ouvertes dans l’ancien questionnaire

#### [FND-12] Après un book Calendly de **matching**, l’agence passe-t-elle aussi en `MEETING_BOOKED`, ou reste-t-elle en `MATCH_PROPOSED` avec seulement `profile.match.active_rdv=true` ?

La spec matching désynchronise volontairement les deux fiches.

- [ ] **A (recommandé)** — Synchroniser : les deux rows passent `MEETING_BOOKED` (plus simple pour admin et compteurs).
- [ ] **B** — Préserver la spec : entreprise `MEETING_BOOKED` ; agence flag JSON seulement.
- [ ] **C** — Un statut commun de paire sur `matches` ; les leads gardent leur statut CRM.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Matching, dashboards, webhooks  
**Ancien ID :** D-05, V-30

#### [FND-13] En cas de match sans vente, que devient le **paiement d’entrée** agence (~1 500 €) : nouvelle recherche, litige/remboursement, ou non documenté volontairement ?

La doc post-survey (898 / nurturing) ne dit pas si l’entrée est créditée, remboursée, ou consommée.

- [ ] **A (recommandé)** — Pas de remboursement auto : l’agence reste en recherche (`IN_DELIVERANCE`) ou nurturing ; tout remboursement = geste admin hors système.
- [ ] **B** — Workflow litige + action admin remboursement (statut / flag dédié).
- [ ] **C** — Crédit automatique d’un nouveau matching (sans 898).

**Impact si l’architecture change :** High  
**Domaines affectés :** CGV, admin, statuts, comptabilité ops  
**Ancien ID :** D-10

#### [FND-14] Après decline 898 € + nurturing, le lien `matches` / FK `matched_*` est-il conservé comme historique ?

- [ ] **A (recommandé)** — Conservé (historique) ; unlink seulement bouton admin.
- [ ] **B** — Unlink automatique au decline.
- [ ] **C** — Pas de table `matches` au MVP (FND-05 B) : question sans objet.

**Impact si l’architecture change :** Low–Medium  
**Domaines affectés :** Matching, admin  
**Ancien ID :** D-14

#### [FND-15] L’admin doit-il pouvoir **avancer une étape** de timeline et **retarder de +7 j** (délivrance), comme dans la spec Streamlit ?

Sans délivrance (FND-04 B) cette question est sans objet.

- [ ] **A (recommandé)** — Oui : actions admin `ADVANCE_STEP` / `DELAY` via API, client read-only.
- [ ] **B** — Timeline 100 % automatique (emails datés) ; pas de boutons advance/delay.
- [ ] **C** — Delay seulement (incident ops), pas d’advance manuel.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Délivrance, emails milestone, admin  
**Ancien ID :** V-27, V-28

#### [FND-16] Comment le **paiement** s’articule-t-il avec l’onboarding et la délivrance, sans créer une quatrième machine d’état avant FND-01 ?

L’intention « PAID → ONBOARDING → ACTIVE DELIVERY » est un **enchaînement commercial**, pas forcément l’enum canonique. Le code n’a ni colonne `PAID` ni promote auto. Si vous cochez B ici **et** une autre option à FND-01, l’architecture définitive s’arrêtera pour lever la contradiction.

- [ ] **A (recommandé)** — `PAID` = **événement / enregistrement commercial** (flag ou table paiement) ; ensuite promote admin ou auto vers les états de délivrance **choisis en FND-01** — pas un rival de `lead_statut`.
- [ ] **B** — `NOT_PAID → PAID → ONBOARDING → ACTIVE` **est** la machine canonique (alors FND-01 doit être aligné ; sinon contradiction).
- [ ] **C** — Le paiement reste ops-only (INT-01 B) : onboarding / délivrance **ignorent** PAID.

**Impact si l’architecture change :** High  
**Domaines affectés :** Onboarding, INT-01, FND-01, FND-04, SAL-01  
**Lié :** INT-01, sequence_client_not_paid, sales metrics PAID

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| FND-01 | | |
| FND-02 | | |
| FND-03 | | |
| FND-04 | | |
| FND-05 | | |
| FND-06 | | |
| FND-07 | | |
| FND-08 | | |
| FND-09 | | |
| FND-10 | | |
| FND-11 | | |
| FND-12 | | |
| FND-13 | | |
| FND-14 | | |
| FND-15 | | |
| FND-16 | | |
