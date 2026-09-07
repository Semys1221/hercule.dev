# Conditions Générales de Vente — Hercule

```
status: canonical
audience: coding-agent
depends_on: constants-commercial.md
decisions: CVG-01 CPY-01 CPY-04 BIZ-10 CAP-01
do_not:
  - Réintroduire 898 €, 4 jours de rétractation, pack 5×1489 one-shot, 149 €/RDV
```

> **Version :** 2026-09-06  
> **Documents associés :** [cvg_onboarding.md](./cvg_onboarding.md) · [cvg_site-sync.md](./cvg_site-sync.md) · [capacity/03-sla-client.md](./capacity/03-sla-client.md) · [constants-commercial.md](./constants-commercial.md)  
> Chiffres code : `lib/commercial/constants.ts` (ENG-16) — ne pas parser ce fichier au runtime.

---

## 1. Informations légales

**Prestataire / Vendeur**

| Champ | Valeur |
|-------|--------|
| Dénomination commerciale | **Hercule** |
| Raison sociale | **Nanguy Evan Gbeho** (entrepreneur individuel) |
| Nom commercial | Goscale France |
| Siège social / établissement | 4 Rue Claude Bonnier, 33000 Bordeaux |
| RCS | 885 248 039 R.C.S. Bordeaux (immatriculé le 22/04/2025) |
| Greffe | Tribunal de Commerce de Bordeaux — n° gestion 2025A02250 |
| TVA intracommunautaire | Non applicable — article 293 B du CGI (franchise en base) |
| Email contact | contact@hercule.dev |
| Directeur de la publication | Evan Nanguy |

**Client**

Agence web ou prestataire digital professionnel (B2B) souscrivant aux formules Hercule, agissant dans le cadre de son activité commerciale et disposant de la capacité juridique pour contracter.

---

## 2. Champ d'application

Les présentes Conditions Générales de Vente (« **CGV** ») s'appliquent à toute commande, souscription ou renouvellement de prestations proposées par Hercule au Client.

Elles prévalent sur tout document contradictoire du Client, sauf dérogation expresse et écrite acceptée par Hercule (devis ou avenant signé).

Hercule se réserve le droit de refuser toute commande pour des motifs légitimes (capacité opérationnelle, incompatibilité ICP, impayés antérieurs).

---

## 3. Définitions

| Terme | Définition |
|-------|------------|
| **Attribution** | Mise à disposition exclusive d'une **Demande client qualifiée** à l'agence partenaire, comprenant la qualification téléphonique, la proposition de mise en relation et la planification d'un rendez-vous commercial dans l'agenda du Client. |
| **Attribution consommée** | Attribution dont le RDV a été planifié dans l'agenda du Client. En cas de no-show (article 10.1), l'Attribution est recréditée. |
| **Demande client qualifiée** | Besoin d'une entreprise (PME/TPE) validé selon les critères Hercule : taille, durée souhaitée, horizon de résultat, budget, historique avec les agences. |
| **RDV planifié** | Créneau réservé dans l'agenda du Client avec le décideur ou représentant habilité de l'entreprise, confirmé via l'outil de prise de rendez-vous Hercule. |
| **RDV honoré** | RDV planifié au cours duquel le décideur (ou mandataire habilité) est **effectivement présent** en visioconférence pendant au moins **15 minutes**. |
| **No-show** | Absence du prospect qualifié au RDV planifié, malgré une relance de confirmation envoyée au minimum **24 heures** avant l'horaire prévu (H-24). |
| **MRR** | Revenu récurrent mensuel (Monthly Recurring Revenue) généré par le Client auprès de l'entreprise rencontrée via Hercule, au titre d'un contrat de prestation signé post-RDV. |
| **Activation** | Date à laquelle Hercule démarre la recherche et la prospection entreprises pour le compte du Client (statut opérationnel « service actif »), après **paiement reçu** et onboarding complet. |
| **Live Qualification** | Appel téléphonique ou échange vocal mené par Hercule (ou prestataire mandaté) pour valider le budget, le besoin et la pertinence du match avant attribution. |
| **Période de service** | Intervalle entre l'Activation et la fin ou la résiliation du contrat. |
| **Demande planifiée** | Demande client dont la fenêtre de mise en relation est fixée à l'avance (ex. septembre–novembre). |
| **Mandat de délégation** | Accord signé par le dirigeant autorisant Hercule à proposer une mise en relation avec une agence compatible pour la période indiquée. |

---

## 4. Description des prestations

Hercule fournit un service de **mise en relation B2B** entre des entreprises ayant un besoin digital (site web, refonte, SEO, etc.) et des agences web partenaires.

Le processus comprend notamment :

1. **Capture** — identification de signaux et de demandes entreprises dans la niche ciblée ;
2. **Filter (Live Qualification)** — validation téléphonique du besoin, du budget et de la compatibilité ;
3. **Deliver** — attribution exclusive du contrat et planification du RDV dans l'agenda du Client.

Hercule met à disposition, ou mettra à disposition, une **page de suivi** permettant au Client de consulter l'avancement de son service (roadmap produit).

**Hercule n'est pas une agence de vente aux résultats garantis.** Le Client reste seul responsable de la négociation, de la proposition commerciale et de la signature avec l'entreprise rencontrée. Hercule s'engage sur une **obligation de moyens** dans la qualification et l'attribution, aux délais et volumes décrits aux présentes CGV. L'offre « 2 500 € / mois » éventuellement affichée sur le site est une **vitrine** : elle n'est pas commercialisée et ne peut pas être souscrite au titre des présentes.

Les entreprises mises en relation **ne paient aucune commission à Hercule**.

### 4.1 Demandes visibles et planification anticipée

Une demande **visible** sur hercule.dev correspond à un accord obtenu **à l'instant de sa publication** avec le dirigeant de l'entreprise concernée. Le dirigeant a signé un **mandat de délégation** autorisant Hercule à proposer une mise en relation avec une agence compatible pour une **date cible** (ex. novembre).

Les dirigeants qui anticipent leurs besoins marketing structurent leur acquisition à l'avance ; ils ne gèrent pas leur visibilité digitale au coup par coup.

Les fenêtres calendaires affichées sur chaque demande (`disponibilite`, dates `available_from` / `available_until`) matérialisent cette planification.

### 4.2 Mise en relation post-audit de compatibilité

Ce parcours concerne la mise en relation avant souscription Starter (audit de compatibilité). Les délais post-souscription sont définis à l'article 9.

Ce parcours s'applique après complétion de la **fiche agence** (audit de compatibilité), distinct du service actif post-souscription (article 9) :

1. L'agence complète sa fiche agence lors de l'audit de compatibilité ;
2. Hercule identifie les dirigeants **éligibles** dont la demande entre dans la **timeframe du mois** affichée ;
3. Ces dirigeants reçoivent un **email de proposition de mise en relation** ;
4. **Délai indicatif :** environ **6 jours ouvrés** pour voir le **premier RDV** apparaître dans l'agenda de l'agence, sous réserve des disponibilités respectives.

---

## 5. Formules et tarifs

Les prix sont indiqués en **euros TTC**. Hercule bénéficie de la franchise en base de TVA (article 293 B du CGI) : aucune TVA n'est facturée ni mentionnée sur les factures.

Le Client ne consomme une Attribution que lorsqu'un RDV de mise en relation est **planifié**. Un no-show entreprise recrédite l'Attribution conformément à l'article 10.1. Une vente signée par le Client **n'éteint pas** les Attributions ou la période mensuelle restantes.

### 5.1 Offre mensuelle sans engagement

| Élément | Détail |
|---------|--------|
| **Prix** | **1 489 € / mois** |
| **Contenu** | Service actif de mise en relation ; rythme opérationnel **3 à 4 RDV honorés / mois** en allocation inbox standard (article 9) |
| **Commission Hercule** | **0 %** |
| **Engagement** | Aucun. Résiliation : article 13 |

### 5.2 Pack 3 mois

| Élément | Détail |
|---------|--------|
| **Prix** | **989 € × 3 = 2 967 €** (payable en une fois) |
| **Contenu** | **15 Attributions** |
| **Commission Hercule** | **0 %** |
| **Durée** | Jusqu'à consommation des 15 Attributions, expiration de 3 mois calendaires de service actif, ou résiliation |

**Garantie pack 3 mois :** si, à l'issue des 3 mois de service actif, le chiffre d'affaires (CA) généré par le Client auprès des entreprises rencontrées via Hercule est inférieur à **4 500 €**, Hercule attribue jusqu'à **15 Attributions de remplacement**, dans la limite des règles de qualification et de no-show des présentes.

Conditions de cette garantie :
- onboarding complété dans les **48 heures** suivant le paiement ;
- retours post-RDV transmis dans les **7 jours** suivant chaque RDV ;
- RDV honorés ou no-shows traités conformément à l'article 10 ;
- la garantie ne couvre pas l'absence de compétences commerciales du Client ni un positionnement tarifaire incompatible avec le marché.

### 5.3 Renouvellement

À l'issue d'un match ou à tout moment pendant le service, Hercule peut proposer au Client, **sur la page de questionnaire ou par échange ops**, de souscrire à nouveau l'offre 5.1 ou 5.2. Cette proposition est **optionnelle**. Elle n'est pas envoyée automatiquement par email du seul fait d'une vente.

### 5.4 Offres non commercialisées

Ne font **pas** l'objet des présentes et ne peuvent pas être souscrites :

- **2 500 € / mois** (éventuellement visible à titre de vitrine marketing) ;
- **898 €** / pack 3 Attributions ;
- **1 500 €** forfait d'entrée historique ;
- **250 € / mois + 149 € par RDV honoré** (ancien modèle). Les clients encore sous un contrat antérieur restent régis par ce contrat jusqu'à renégociation.

---

## 6. Commande, paiement et facturation

### 6.1 Commande

La commande est ferme lorsque :

1. le Client accepte les présentes CGV (voir [cvg_onboarding.md](./cvg_onboarding.md)) ;
2. le paiement intégral (ou l'acompte convenu) est reçu par Hercule ;
3. Hercule confirme la prise en charge (email ou accès onboarding).

### 6.2 Paiement

- Paiement par **lien Stripe** (carte) envoyé par Hercule, ou virement sur facture.
- Pour l'offre mensuelle : facturation **mensuelle à date anniversaire**, sauf accord contraire.
- **Retard de paiement :** pénalités au taux légal + indemnité forfaitaire de recouvrement (40 €). Suspension du service après **7 jours** de retard sans régularisation.
- Le service de recherche active ne démarre qu'après **paiement reçu** (Activation).

### 6.3 Facturation

Facture émise au nom du Client professionnel. Le Client garantit l'exactitude de ses informations de facturation (raison sociale, SIRET, adresse, TVA).

---

## 7. Acceptation des CGV

L'acceptation des CGV est matérialisée par :

- cocher la case « J'accepte les Conditions Générales de Vente de Hercule » lors de l'onboarding ou du paiement ;
- et/ou signature électronique ou manuscrite d'un devis référencant la version des CGV en vigueur.

La version acceptée est celle **en vigueur à la date de commande**, identifiée par la date en en-tête du présent document.

Champs techniques recommandés : `cvg_version`, `cvg_accepted_at`, `cvg_accepted_ip` (voir [cvg_onboarding.md](./cvg_onboarding.md)).

---

## 8. Droit de rétractation

Le Client est un **professionnel** agissant dans le cadre de son activité. Les dispositions du Code de la consommation relatives au droit de rétractation des consommateurs **ne s'appliquent pas**.

**Politique commerciale :** aucun délai de rétractation de 4 jours n'est offert. La commande est ferme dès acceptation des CGV et réception du paiement. L'Activation peut intervenir dès le paiement et l'onboarding.

(La politique antérieure de geste commercial « 4 jours » est **abrogée** à compter de la version 2026-09-06.)

---

## 9. Délais et modalités de livraison

Les délais ci-dessous s'appliquent à partir de l'**Activation** du service (paiement reçu et onboarding complet).

Référence ops : [capacity/03-sla-client.md](./capacity/03-sla-client.md).

### 9.1 Démarrage

| Étape | Délai maximum |
|-------|---------------|
| Accès onboarding après paiement | **48 heures** |
| Activation (démarrage recherche) | **J+0** après paiement + onboarding (sous réserve de file d'attente) |
| File d'attente (capacité infrastructure) | **+15 jours** maximum — position et date estimée communiquées |

### 9.2 Premiers livrables (allocation standard)

| Jalon | Délai après Activation |
|-------|------------------------|
| Première proposition de mise en relation | **14 à 21 jours ouvrés** |
| Premier RDV planifié | **21 à 35 jours ouvrés** |
| Premier RDV honoré | **≤ 21 jours** @ 30 inbox ; **≤ 28 jours** @ 15 inbox (C-01) |

En **phase de montée en charge**, les délais peuvent être allongés de **7 jours** ; le Client en est informé.

### 9.3 Rythme en service actif

| Formule | Volume |
|---------|--------|
| **Mensuel 1 489 €** | Rythme opérationnel **3 à 4 RDV honorés / mois** @ allocation standard |
| **Pack 2 967 €** | **15 Attributions** sur 3 mois, sans que le rythme mensuel C-02 soit une obligation inférieure au pack |

Le plafond marketing « 3–5 » n'est **pas** un minimum contractuel (C-02).

### 9.4 Délais entre étapes

| Transition | Délai |
|------------|-------|
| Mise en relation → RDV planifié | **5 à 10 jours ouvrés** (selon disponibilité entreprise) |

---

## 10. Garanties

### 10.1 Garantie no-show

Si un prospect **qualifié** ne se présente pas au RDV planifié en visioconférence (no-show), **malgré une relance H-24** :

- l'Attribution concernée **n'est pas consommée** (ou est recréditée) ;
- Hercule planifie un **RDV de remplacement** sous **14 jours ouvrés** à compter de la confirmation du no-show.

Le Client doit signaler tout no-show dans les **48 heures** suivant l'horaire prévu du RDV.

### 10.2 Garantie pack 3 mois

Voir article 5.2. L'offre mensuelle 5.1 n'emporte pas de garantie de CA ; elle emporte les délais et volumes de l'article 9.

### 10.3 Absence de commission

Hercule ne prélève **aucune commission** sur les contrats signés par le Client avec les entreprises rencontrées via le service.

### 10.4 Exclusions communes

Ne donnent pas lieu à recrédit ou prolongation :
- absence ou retard du Client au RDV ;
- refus du Client de recevoir une Demande pour motif autre que non-qualification avérée ;
- informations erronées ou incomplètes fournies par le Client à l'onboarding ;
- force majeure (article 14).

---

## 11. Obligations du Client

Le Client s'engage à :

1. **Compléter l'onboarding** dans les 48 h et fournir des informations exactes (spécialités, stack, zone, capacité de delivery, calendrier) ;
2. **Maintenir un calendrier à jour** et des créneaux disponibles pour les RDV planifiés ;
3. **Honorer les RDV** planifiés ou les annuler avec un préavis minimum de **24 heures** ;
4. **Répondre aux sollicitations Hercule** (post-RDV survey, retours qualité) dans des délais raisonnables ;
5. **Ne pas contourner Hercule** en sollicitant directement les entreprises identifiées via le service en dehors du cadre contractuel pendant la Période de service et **12 mois** après la dernière Attribution ;
6. **Respecter la confidentialité** des informations entreprises communiquées ;
7. **Payer les factures** aux échéances convenues.

---

## 12. Obligations du Prestataire

Hercule s'engage à :

1. Mettre en œuvre les moyens humains et techniques raisonnables pour identifier, qualifier et attribuer des Demandes compatibles avec le profil du Client ;
2. Respecter les délais de l'article 9, sous réserve des files d'attente et cas de force majeure ;
3. Informer le Client de l'avancement via la page de suivi et/ou email ;
4. Traiter les no-shows conformément à l'article 10.1 ;
5. Respecter la réglementation applicable en matière de protection des données.

Hercule **ne garantit pas** un volume de signatures commerciales, un chiffre d'affaires minimum autre que les garanties MRR expressément prévues, ni la conclusion d'un contrat avec toute entreprise rencontrée.

---

## 13. Durée, résiliation et suspension

### 13.1 Offre mensuelle (article 5.1)

Contrat à **durée indéterminée**, facturation mensuelle.

**Résiliation par le Client :** à tout moment, **préavis de 30 jours calendaires** par email à contact@hercule.dev, sans pénalité. Les Attributions **déjà planifiées** restent dues. Les crédits / période non consommés sont **forclos** (pas de remboursement), sauf geste commercial écrit de Hercule.

**Résiliation par Hercule :** même préavis de 30 jours, ou **immédiatement** en cas de manquement grave (impayé, contournement, fraude, atteinte à l'image).

### 13.2 Pack 3 mois (article 5.2)

Le contrat court jusqu'à **consommation des 15 Attributions**, **expiration des 3 mois**, ou résiliation. Même régime de non-remboursement et d'Attributions déjà planifiées à honorer.

### 13.3 Suspension

Hercule peut suspendre le service **sans préavis** en cas de :
- impayé supérieur à 7 jours ;
- manquement aux obligations de l'article 11 ;
- capacité infrastructure saturée (file d'attente) — avec information du Client.

---

## 14. Responsabilité, force majeure, propriété intellectuelle, confidentialité

### 14.1 Limitation de responsabilité

La responsabilité totale de Hercule, toutes causes confondues, est limitée au **montant HT payé par le Client au cours des 12 derniers mois** précédant le fait générateur.

Hercule n'est pas responsable des **dommages indirects** (perte de chiffre d'affaires, perte de clientèle, perte d'image) ni du résultat commercial des RDV.

### 14.2 Force majeure

Aucune partie n'est responsable d'un manquement dû à un événement imprévisible, irrésistible et extérieur (pannes majeures, catastrophes, restrictions légales, etc.). Les délais sont suspendus pendant la durée de l'événement.

### 14.3 Propriété intellectuelle

Hercule reste titulaire de ses outils, marques, processus et contenus. Aucune cession de propriété intellectuelle n'est consentie au Client au-delà d'une licence d'usage limitée aux fins du service.

### 14.4 Confidentialité

Chaque partie s'engage à garder confidentielles les informations non publiques reçues de l'autre partie pendant la relation contractuelle et **3 ans** après sa fin.

---

## 15. Données personnelles (RGPD)

Hercule traite les données du Client et des contacts entreprises conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.

Finalités principales : exécution du contrat, qualification des demandes, prise de RDV, facturation, support.

Le Client agit en qualité de responsable de traitement pour les données qu'il collecte auprès des entreprises rencontrées ; Hercule agit en qualité de sous-traitant ou responsable conjoint selon les flux — détail dans la [Politique de confidentialité](/confidentialite).

Pour exercer vos droits : contact@hercule.dev.

---

## 16. Litiges et droit applicable

Les présentes CGV sont soumises au **droit français**.

En cas de litige, les parties recherchent une solution amiable préalable.

À défaut d'accord amiable dans un délai de **30 jours**, compétence exclusive des **tribunaux du ressort du siège social de Hercule**, sauf règles impératives contraires.

Le Client professionnel peut recourir à un médiateur de la consommation si applicable — `[À COMPLÉTER]`.

---

## 17. Modification des CGV

Hercule peut modifier les présentes CGV. La version applicable est celle **en vigueur à la date de commande** pour les contrats en cours, sauf modification légale impérative.

Pour les contrats récurrents, Hercule informe le Client **30 jours** avant l'entrée en vigueur d'une nouvelle version. En cas de désaccord, le Client peut résilier sans frais avant la date d'effet.

---

## Annexe A — Description opérationnelle (référence interne)

| Document | Contenu |
|----------|---------|
| [capacity/README.md](./capacity/README.md) | Capacité inbox, funnel, files d'attente |
| [01-product.md](./01-product.md) | Offres, Attribution, pack qui continue |
| [modules/post-rdv.md](./modules/post-rdv.md) | Survey, nurturing plein tarif |

---

## Annexe B — Historique des versions

| Version | Date | Changements |
|---------|------|-------------|
| 2026-09-06 | 6 sept. 2026 | Offres 1 489 €/mois et 989×3 / 15 Attributions ; suppression 898 €, 4 j de rétractation, pack 5×1489 ; 2 500 € vitrine |
| 2026-09-05 | 5 sept. 2026 | Prix TTC · Attribution consommée · forfait Starter (version archivée) |
| 2026-09-18 | 18 sept. 2026 | §4.1–4.2 planification anticipée |
| 2026-09-04 | 4 sept. 2026 | Création CGV |

---

*Document interne / base contractuelle. Faire valider par un conseil juridique avant publication publique et signature clients.*
