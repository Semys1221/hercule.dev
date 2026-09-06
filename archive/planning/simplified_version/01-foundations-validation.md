# 01 — Fondations produit

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../01-foundations-validation.md](../01-foundations-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

**Avant ce fichier :** [22-business-intent-validation.md](./22-business-intent-validation.md) (`BIZ-`*).

---

## Ce qu’on garde (sans question)

- Hercule met en relation **entreprises** et **agences web** ; l’agence paie, l’entreprise non.
- Le système actuel de **vente** (email froid → lien → RDV appel commercial) reste en place.
- Les promesses **délais / volume** (3–4 RDV/mois, no-show 14 j) restent la référence CGV.

---



## Questions



#### [FND-01] Pour une agence **payante**, comment veux-tu suivre « où elle en est » ?

Trois modèles existent dans les docs ; il faut en choisir **un** principal. Le **nombre** de RDV livrés se compte à part (pas besoin de l’option « RDV 1, 2, 3… » comme statut principal).

- [x] **A (recommandé)** — Parcours complet : inscrite → recherche lancée → mise en lien → RDV → questionnaire → vente. Avant paiement = suivi « prospect qui booke un appel Hercule ».
- [ ] **B** — Seulement le suivi **vente** actuel ; pas de livraison / matching pour l’instant.
- [ ] **C** — Statut = **numéro du RDV** livré (RDV 1, RDV 2… jusqu’à 10).

*Pourquoi ça compte : dashboards, emails, compteurs.*

---



#### [FND-02] Où pilotes-tu le métier au quotidien ?

- [x] **A (recommandé)** — **Outil interne Next** (`/internal`) pour fiches, matching, paiements ; ancien outil Streamlit **temporairement** pour outreach / scraper.
- [ ] **B** — **Streamlit seul** ; `/internal` = contenu / docs seulement.
- [ ] **C** — **Les deux** sans date de fin : Streamlit = vente ; Next = livraison.

---



#### [FND-03] Que peut faire **l’agence ou l’entreprise** elles-mêmes (sans toi) ?

- [x] **A (recommandé)** — **Formulaire d’inscription** + **questionnaire** après RDV. Le reste (paiement, matching, statuts) = toi.
- [ ] **B** — **Rien** pour l’instant : tu crées toutes les fiches.
- [ ] **C** — + **Payer / s’activer** en ligne (comme le brouillon « NOT_PAID »).

---



#### [FND-04] Quand démarre la **recherche de clients** pour l’agence (délivrance) ?

- [ ] **A (recommandé)** — Seulement quand **tu cliques** « lancer la recherche » (+ emails de délivrance).
- [ ] **B** — Pas de module « recherche active » au MVP.
- [x] **C** — **Tout seul** dès inscription ou paiement confirmé.

*Note : l’email « formulaire bien reçu » peut partir à l’inscription même si A.*

---



#### [FND-05] Veux-tu un produit « **mettre en lien** agence ↔ entreprise » (email Calendly au dirigeant) ?

- [x] **A (recommandé)** — **Oui**, en plus du CRM de vente actuel ; bien séparer les deux.
- [ ] **B** — **Non**, seulement le funnel de vente actuel.
- [ ] **C** — **Plus tard** ; d’abord CRM + dashboards sans lien en base.

---



#### [FND-06] Quand une **mission** est-elle terminée pour une agence ?

- [x] **A (recommandé)** — Questionnaire : **vente** ou **embarquement entreprise** = mission réussie (pas « après 10 RDV »).
- [ ] **B** — Pas de clôture au MVP ; on s’arrête au CRM actuel.
- [ ] **C** — Terminée quand le **quota de RDV** du pack est livré (ex. 10 RDV).

---



#### [FND-07] Si **l’agence OU l’entreprise** dit « oui ça a marché » au questionnaire, est-ce que **les deux dossiers** se ferment ?

- [x] **A (recommandé)** — **Un seul oui** suffit ; tu tranches les litiges.
- [ ] **B** — Pas de questionnaire au MVP.
- [ ] **C** — Il faut **les deux** réponses (ou seulement toi).

---



#### [FND-08] Si l’**entreprise** refuse de continuer la recherche après un échec ?

- [x] **A (recommandé)** — Dossier **archivé / annulé**, plus d’emails auto.
- [ ] **B** — On laisse en l’état pour **recontact manuel**.
- [ ] **C** — On la **remet en recherche** quand même.

---



#### [FND-09] Après une **vente**, tu proposes le **renouvellement 1 489 €** comment ?

- [x] **A (recommandé)** — **Sur la page** du questionnaire seulement ; pas d’email auto « rachète » ; tu confirmes le paiement. Offre proposé est Pack de 989 par mois réglable en une fois 3x989 ou bien offre sans engagement à 1489/mois. Le dashboard du client reste le même juste il se reset à 0 et propose l'offre. 
- [ ] **B** — Pas d’upsell post-vente au MVP.
- [ ] **C** — **Email auto** 1 489 € + page.

---



#### [FND-10] L’offre **898 €** (secours si pas de vente) : où et comment ?

- [ ] **A (recommandé)** — **Page questionnaire uniquement** ; si elle dit non, l’offre disparaît **pour toujours** ; fermer l’onglet ≠ refus.
- [x] **B** — Pas d’898 € au MVP.
- [ ] **C** — 898 € aussi par **email** ou avec expiration.

---



#### [FND-11] L’offre **2 500 €/mois** sur le site et dans les CGV ?

- [x] **A (recommandé)** — **On la garde en vitrine** ; pas de parcours paiement récurrent dans le MVP produit.
- [ ] **B** — On la **retire** du site jusqu’à implémentation.
- [ ] **C** — On **implémente** l’abo 2 500 € dans le MVP.

---



#### [FND-12] Quand un **RDV entreprise↔agence** est booké, les **deux fiches** passent au statut « RDV planifié » ?

- [x] **A (recommandé)** — **Oui**, les deux. mais pour l'entreprise il faut bien garder le compte de cb de rdv livrès
- [ ] **B** — Seulement l’**entreprise** ; l’agence reste en « match proposé » en interne.
- [ ] **C** — Statut sur le **couple** agence+entreprise, pas sur chaque fiche.

---



#### [FND-13] L’agence a payé ~1 500 € et **ne vend pas** après un RDV ?

- [x] **A (recommandé)** — **Nouvelle recherche** ou nurturing ; **pas de remboursement auto** (remboursement = geste manuel).
- [ ] **B** — Parcours **litige / remboursement** dans l’outil.
- [ ] **C** — **Crédit match gratuit** automatique (sans 898 €).

---



#### [FND-14] Si l’agence **refuse l’898 €** et part en nurturing, tu gardes l’**historique** du lien avec l’entreprise ?

- [x] **A (recommandé)** — **Oui** ; tu délies seulement si tu cliques.
- [ ] **B** — **Délier automatiquement** au refus.
- [ ] **C** — Sans objet si pas de matching (FND-05 B).

---



#### [FND-15] Veux-tu pouvoir **avancer** ou **repousser de 7 jours** une étape de la timeline de livraison ?

- [x] **A (recommandé)** — **Oui**, avancer + retarder depuis l’admin.
- [ ] **B** — **100 % automatique**, pas de boutons.
- [ ] **C** — **Retard seulement**, pas avancer.

*Sans délivrance (FND-04 B), question sans objet.*

---



#### [FND-16] Le **paiement reçu** : comment ça s’articule avec inscription et livraison ?

- [x] **A (recommandé)** — « **Payé** » = info à part (date, montant) ; ensuite le parcours choisi en FND-01.
- [ ] **B** — Le statut principal devient **NOT_PAID → PAID → ONBOARDING → ACTIF** (aligné FND-01).
- [ ] **C** — Paiement **hors app** ; le produit ignore « payé ».

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| FND-01 | A | Canonique ONBOARDED…SOLD ; CRM=sous-état acquisition |
| FND-02 | A | /internal cockpit ; Streamlit temporaire outreach |
| FND-03 | A | Client : onboarding + survey seulement |
| FND-04 | C* | Auto IN_DELIVERANCE au PAID seulement — voir 23 |
| FND-05 | A | Matching produit + table matches |
| FND-06 | A | SOLD = survey positif (couple match) |
| FND-07 | A | Un oui clôt le couple match, pas le pack agence — voir 23 |
| FND-08 | A | Entreprise refuse → ARCHIVED |
| FND-09 | A* | CTA in-page optionnel ; pas de reset dashboard — voir 23 |
| FND-10 | B | Pas d’898 au MVP |
| FND-11 | A | 2500 vitrine ; pas d’abo technique MVP |
| FND-12 | A | Les deux fiches MEETING_BOOKED ; compteur RDV entreprise |
| FND-13 | A | Pas de remboursement auto |
| FND-14 | A | Override C→A : historique matches — voir 23 |
| FND-15 | A | ADVANCE + DELAY admin |
| FND-16 | A | Override B→A : paiement=événement — voir 23 |


