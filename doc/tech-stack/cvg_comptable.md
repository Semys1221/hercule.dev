# Conditions Générales de Vente — Hercule Comptable

```
status: canonical
audience: coding-agent
depends_on: constants-commercial.md
decisions: CVG-01 CPY-01 CPY-04 BIZ-10 CAP-01
vertical: comptable
do_not:
  - Réintroduire 898 €, 4 jours de rétractation, garantie MRR, 2 500 € vitrine
```

> **Version :** 2026-09-08  
> **Documents associés :** [cvg_master.md](./cvg_master.md) · [constants-commercial.md](./constants-commercial.md)  
> Chiffres code : `lib/commercial/constants.ts` → `COMMERCIAL_COMPTABLE` (ENG-16).

---

## 1. Informations légales

**Prestataire / Vendeur**

| Champ | Valeur |
|-------|--------|
| Dénomination commerciale | **Hercule** |
| Raison sociale | **Nanguy Evan Gbeho** (entrepreneur individuel) |
| Siège social | 4 Rue Claude Bonnier, 33000 Bordeaux |
| Email contact | contact@hercule.dev |

**Client**

Cabinet d'expertise comptable professionnel (B2B) souscrivant aux formules Hercule Comptable, comptant **plus de 3 associés ou collaborateurs**, agissant dans le cadre de son activité et disposant de la capacité juridique pour contracter.

---

## 2. Champ d'application

Les présentes CGV s'appliquent à toute commande ou souscription aux prestations Hercule Comptable proposées au Client (cabinet partenaire).

Elles prévalent sur tout document contradictoire du Client, sauf dérogation expresse et écrite acceptée par Hercule.

---

## 3. Définitions

| Terme | Définition |
|-------|------------|
| **Attribution** | Mise à disposition exclusive d'une **Demande TPE qualifiée** au cabinet partenaire, comprenant la qualification, la proposition de mise en relation et la planification d'un rendez-vous dans l'agenda du Client. |
| **Attribution consommée** | Attribution dont le RDV a été planifié dans l'agenda du Client. En cas de no-show (article 10.1), l'Attribution est recréditée. |
| **Demande TPE qualifiée** | Besoin d'un indépendant ou dirigeant de TPE validé par Hercule : reprise de comptabilité, échéances fiscales, déclarations, obligations administratives. |
| **Mission** | Contrat annuel de tenue comptable et fiscale que le cabinet peut proposer au dirigeant rencontré via Hercule. |
| **RDV planifié** | Créneau réservé dans l'agenda du Client avec le dirigeant ou mandataire habilité, confirmé via l'outil Calendly provisionné par Hercule. |
| **RDV honoré** | RDV planifié au cours duquel le dirigeant est **effectivement présent** en visioconférence pendant au moins **15 minutes**. |
| **No-show** | Absence du prospect qualifié au RDV planifié, malgré relance H-24. |
| **Activation** | Date à laquelle Hercule démarre l'attribution de demandes TPE au Client, après paiement reçu et onboarding complet. |
| **Live Qualification** | Échange mené par Hercule pour valider le besoin, la compatibilité cabinet-TPE et la pertinence du match avant attribution. |

---

## 4. Description des prestations

Hercule fournit un service de **mise en relation B2B** entre des indépendants et dirigeants de TPE ayant un besoin de reprise comptable, fiscale et administrative, et des cabinets d'expertise comptable partenaires éligibles.

Le processus comprend :

1. **Capture** — identification de demandes TPE dans la niche ciblée ;
2. **Filter (Live Qualification)** — validation téléphonique du besoin et de la compatibilité cabinet ;
3. **Deliver** — attribution exclusive et planification du RDV dans l'agenda du Client.

**Hercule n'est pas une agence de vente aux résultats garantis.** Le Client reste seul responsable de la négociation, de la proposition d'honoraires et de la signature avec le dirigeant rencontré. Hercule s'engage sur une **obligation de moyens** aux délais et volumes des présentes. **Aucune garantie de signature** n'est offerte.

Les dirigeants TPE mis en relation **ne paient aucune commission à Hercule**.

### 4.1 Provisionnement technique

Pour l'exécution du service, Hercule provisionne pour le Client :

- un compte **Calendly Pro** ;
- un compte **Zoom Pro** ;

Les identifiants sont détenus et administrés par Hercule. Toute prise de rendez-vous et visioconférence de mise en relation passe par ces outils provisionnés.

### 4.2 Audit de compatibilité

Avant souscription, le cabinet peut être invité à un **audit de compatibilité** (rendez-vous Calendly). Ce parcours permet d'évaluer l'éligibilité (> 3 associés ou collaborateurs), la zone, les honoraires et la capacité à absorber de nouveaux dossiers.

---

## 5. Formules et tarifs

Les prix sont indiqués en **euros TTC**. Franchise en base de TVA (article 293 B du CGI).

Le Client ne consomme une Attribution que lorsqu'un RDV est **planifié**. Un no-show recrédite l'Attribution conformément à l'article 10.1.

### 5.1 Offre mensuelle sans engagement

| Élément | Détail |
|---------|--------|
| **Prix** | **1 499 € / mois** |
| **Contenu** | Service actif de mise en relation ; **5 missions / mois** ; cycle **30 jours** |
| **Premier RDV** | Sous **15 jours** après Activation |
| **Commission Hercule** | **0 %** sur les honoraires signés |
| **Engagement** | Aucun. Résiliation : article 13 |

**Garantie volume :** **15 rendez-vous planifiés en 90 jours** à compter de l'Activation, ou **continuité du service sans frais supplémentaires** jusqu'à atteinte de ce volume, sous réserve du respect des obligations du Client (article 11). Cette garantie ne couvre **pas** la signature d'un mandat par le dirigeant rencontré.

### 5.2 Pack 3 mois

| Élément | Détail |
|---------|--------|
| **Prix** | **3 598 € TTC** (payable en une fois) |
| **Contenu** | **3 mois** de service actif au rythme de l'article 5.1 |
| **Bonus** | **5 RDV offerts** en sus du volume contractuel |
| **Commission Hercule** | **0 %** |

Même garantie volume (15 RDV / 90 jours) et exclusions que l'article 5.1.

### 5.3 Offres non commercialisées

Ne font pas l'objet des présentes : offres agence web (1 489 €, 2 500 € vitrine, etc.) décrites dans [cvg_master.md](./cvg_master.md).

---

## 6. Commande, paiement et facturation

La commande est ferme lorsque le Client accepte les présentes CGV et que le paiement intégral est reçu par Hercule.

- Paiement par lien Stripe ou virement sur facture.
- Offre mensuelle : facturation mensuelle à date anniversaire.
- Retard de paiement : pénalités au taux légal ; suspension après **7 jours** sans régularisation.

---

## 7. Acceptation des CGV

Cocher « J'accepte les Conditions Générales de Vente de Hercule » lors de l'onboarding ou du paiement. Version applicable : celle **en vigueur à la date de commande**.

---

## 8. Droit de rétractation

Le Client est un **professionnel**. Aucun délai de rétractation de 4 jours n'est offert. La commande est ferme dès acceptation des CGV et réception du paiement.

---

## 9. Délais et modalités de livraison

À partir de l'**Activation** :

| Jalon | Délai |
|-------|-------|
| Accès onboarding après paiement | **48 heures** |
| Premier RDV planifié | **≤ 15 jours** |
| Rythme en service actif | **5 missions / mois** (cycle 30 jours) |
| Garantie volume | **15 RDV en 90 jours** ou continuité sans frais |

---

## 10. Garanties

### 10.1 Garantie no-show

Prospect absent malgré relance H-24 : Attribution recréditée ; remplacement sous **14 jours ouvrés**. Signalement no-show sous **48 h**.

### 10.2 Garantie volume (15 RDV / 90 jours)

Si, à l'issue de **90 jours** de service actif, moins de **15 RDV** ont été planifiés du fait de Hercule (hors manquements Client), Hercule prolonge le service **sans frais supplémentaires** jusqu'à atteinte de 15 RDV planifiés.

**Exclusions :** absence Client, refus de recevoir une Demande pour motif autre que non-qualification, informations erronées à l'onboarding, force majeure.

### 10.3 Absence de garantie de signature

Hercule **ne garantit pas** qu'un dirigeant rencontré signera un mandat avec le Client.

### 10.4 Absence de commission

0 % de commission sur les honoraires signés par le Client.

---

## 11. Obligations du Client

1. Compléter l'onboarding dans les 48 h (zone, honoraires, capacité dossiers, spécialités) ;
2. Maintenir le calendrier Calendly provisionné à jour ;
3. Honorer les RDV ou annuler avec **24 h** de préavis ;
4. Ne pas contourner Hercule pendant la Période de service et **12 mois** après la dernière Attribution ;
5. Respecter la confidentialité des informations TPE ;
6. Payer les factures aux échéances.

---

## 12. Obligations du Prestataire

Hercule s'engage à mettre en œuvre les moyens raisonnables pour qualifier et attribuer des Demandes compatibles, respecter les délais de l'article 9, traiter les no-shows (article 10.1) et provisionner Calendly Pro et Zoom Pro.

---

## 13. Durée, résiliation et suspension

**Offre mensuelle :** durée indéterminée ; résiliation Client avec **30 jours** de préavis par email à contact@hercule.dev.

**Pack 3 mois :** jusqu'à expiration des 3 mois ou résiliation.

Suspension sans préavis en cas d'impayé > 7 jours ou manquement grave.

---

## 14. Responsabilité, force majeure, confidentialité

Responsabilité totale de Hercule limitée au montant payé sur les **12 derniers mois**. Pas de responsabilité sur dommages indirects ni sur le résultat commercial des RDV.

Droit **français**. Tribunaux du ressort du siège de Hercule.

---

## 15. Données personnelles

Traitement conforme RGPD. Contact : contact@hercule.dev. Détail : [confidentialite.md](./confidentialite.md).

---

## Annexe — Historique

| Version | Date | Changements |
|---------|------|-------------|
| 2026-09-08 | 8 sept. 2026 | Création CGV vertical comptable — 1 499 €/mois, pack 3 598 €, 15 RDV/90 j, provisionnement Calendly/Zoom |
