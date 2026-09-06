# 22 — Intention métier

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../22-business-intent-validation.md](../22-business-intent-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

**À remplir en premier**, avant le fichier 01.

---

## Ce qu’on garde (sans question)

- L’**agence** paie ; l’**entreprise** ne paie jamais.
- Hercule ne prend **pas de commission** sur les ventes de l’agence.
- Offres CGV : Starter **1 489 €** (5 attributions), **2 500 €/mois** (jusqu’à 4/mois), renouvellement **1 489 €**, secours **898 €** (3 attributions).
- No-show : remplacement sous **14 jours ouvrés** ; rétractation **4 jours**.

---



## Questions



### Important — à trancher en premier



#### [BIZ-01] Qu’est-ce que Hercule vend vraiment ?

La CGV dit : l’agence **close** elle-même. Le texte 2 500 € sur le site dit parfois « on signe pour vous ». Il faut choisir.

- [ ] **A (recommandé)** — Des **RDV qualifiés** ; l’agence fait la vente. Le 2 500 € = plus de volume, pas du closing Hercule.
- [x] **B** — Starter = RDV ; 2 500 € = Hercule **qualifie et close**. Mais pour le moment l'offre est vitrine uniquement
- [ ] **C** — Hercule close **toujours** (même au Starter).
- [ ] **D** — **Catalogue** : l’agence choisit et booke seule, sans assignation Hercule.

*Pourquoi ça compte : c’est l’identité du produit et tout le discours commercial.*

---



#### [BIZ-02] Quand compte-t-on qu’une attribution est « utilisée » ?

- [x] **A (recommandé)** — Dès que le **RDV est planifié**. No-show entreprise = on recrédite. **Pas de vente ≠ recrédit** (sauf garantie MRR après tout le pack).
- [ ] **B** — Seulement si le RDV a **eu lieu** (honoré). No-show ou pas de vente = recrédit.
- [ ] **C** — Seulement si un **contrat est signé**.

*Pourquoi ça compte : compteurs, garanties, offre 898 €.*

---



#### [BIZ-03] Comment une demande entreprise arrive chez une agence ?

- [x] **A (recommandé)** — **Tu assignes** (exclusif). Le carousel du site = vitrine, pas un catalogue d’achat.
- [ ] **B** — L’agence **choisit** dans un catalogue de demandes.
- [ ] **C** — **Mix** : catalogue pour la démo ; assignation une fois payé.

---



#### [BIZ-04] Quand l’agence doit payer pour que le service démarre ?

- [x] **A (recommandé)** — **Avant** toute livraison active. L’appel de vente peut montrer des exemples, ce n’est pas une livraison contractuelle.
- [ ] **B** — **Un match gratuit** avant de souscrire (audit réel).
- [ ] **C** — Dashboard possible **sans payer** ; activation plus tard.
- [ ] **D** — **Paiement en ligne** sans appel de vente.

---



#### [BIZ-05] Que peut faire l’agence **seule** dans l’app (sans t’appeler) ?

- [x] **A (recommandé)** — **Suivre** la livraison, **signaler un no-show**, **répondre au questionnaire** après RDV. Pas de paiement ni choix de demandes en self-serve.
- [ ] **B** — **Rien** dans une app : email + Calendly seulement.
- [ ] **C** — **Tout** : inscription, paiement, choix de demandes, suivi, questionnaire.

---



#### [BIZ-06] Cycle du pack payé : vente, crédits restants, offre 898 € ?

- [x] **A (recommandé)** — **Un match à la fois**. Une vente **ne finit pas** le pack. L’898 € seulement si le pack est **épuisé sans vente**. L’898 = **3 attributions**. Le 1 489 € après vente = **nouveau pack de 5**.
- [ ] **B** — Une vente **termine** le pack. L’898 € dès le **premier** RDV sans vente.
- [ ] **C** — Plusieurs matches **en parallèle**. **Pas d’898 €** ; seulement 1 489 € ou 2 500 €.
- [ ] Il n'y a pas de pack à 898

---



### Important aussi



#### [BIZ-07] Starter 1 489 € et offre 2 500 €/mois : comment ça s’articule ?

- [ ] **A (recommandé)** — **Deux offres en parallèle**. Le 2 500 € = plus de volume/mois, même logique RDV (si BIZ-01 = A).
- [ ] **B** — Starter = **entrée** ; 2 500 € = **cible** après une première réussite.
- [ ] **C** — Le 2 500 € = **autre métier** (closing Hercule) — seulement si BIZ-01 = B.
- [x] **D** — Le 2 500 € = **vitrine** ; on ne le vend pas encore vraiment.

---



#### [BIZ-08] L’entreprise : simple contact ou « utilisatrice » ? Peut-on la rematcher ailleurs ?

- [x] **A (recommandé)** — **Contact** (email + Calendly). Si le match échoue, **oui** vers une autre agence.
- [ ] **B** — **Utilisatrice** avec parcours pour refuser / demander une autre agence.
- [ ] **C** — **Une entreprise = une agence** pour toujours (sauf no-show avec la même).

---



#### [BIZ-09] Qu’est-ce que **toi** (Hercule) dois toujours faire à la main ?

- [x] **A (recommandé)** — Qualifier, décider le match, confirmer le paiement, trancher no-show / RDV douteux, valider garantie MRR. L’agence peut déclarer « j’ai vendu » au questionnaire.
- [ ] **B** — Le minimum : match et paiement pourront devenir auto plus tard ; la qualif humaine reste.
- [ ] **C** — Comme A, **plus** : tu confirmes la vente (l’agence ne déclare pas seule).

---



### Moins urgent



#### [BIZ-10] L’agence résilie un Starter payé avec des attributions restantes (après 4 j de rétractation) ?

- [x] **A (recommandé)** — **Pas de remboursement** ; crédits non utilisés **perdus** (sauf RDV déjà planifiés à honorer). Les 4 jours de rétractions durant le formulaire de l'onboarding sont proposé à être delete afin d'enclencher la machine maintenant. SI l'agence conserve ses 4j. alors le calendrier de base est avancer de 4j. Au lieu d'avoir rendezv-ous prévus entre 6-8j ouvré c 10-12j ouvrés. 
- [ ] **B** — Elle **consomme** les attributions restantes même après résiliation.
- [ ] **C** — **Remboursement ou avoir** au prorata.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| BIZ-01 | B | Starter=RDV ; 2500=closing Hercule mais vitrine |
| BIZ-02 | A | Crédit au RDV planifié ; no-show entreprise=recrédit |
| BIZ-03 | A | Assignation exclusive |
| BIZ-04 | A | Paiement avant livraison |
| BIZ-05 | A | Suivi + no-show + survey ; pas self-serve paiement |
| BIZ-06 | A* | Post-validation : 1 match ; pas 898 ; vente ne termine pas le pack — voir 23 |
| BIZ-07 | D | 2500 vitrine |
| BIZ-08 | A | Entreprise=contact ; rematch OK |
| BIZ-09 | A | Ops : qualif, match, paiement, no-show, garantie |
| BIZ-10 | A | Pas de remboursement ; proposer suppression rétractation 4j — voir 23 |


