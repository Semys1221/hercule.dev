# AI Reply Agent — ground truth comptable (condensed)

```
status: canonical
audience: coding-agent
vertical: cif
depends_on: _shared/cgv.md, constants-commercial.md
decisions: INT-02 EML-05 CVG-01
do_not:
  - Chiffrer les tarifs dans l'email sauf demande explicite ET autorisation ops
  - Contredire _shared/cgv.md / COMMERCIAL_HERCULE_HUBRIS
  - Promettre une signature de mandat ou un volume de MRR / commissions garanti
  - Citer IAS 1 999 €/mois ou CIF 3 499 €/90j comme offre active
  - Exception autorisée : flux international BE/CH/CA (1 499 USD/mois + 400 USD/mois profils) et objection conférence 2 500 €
```

> Source condensée pour les réponses email **ops** niche CIF. Détail tarifaire : [hercule.dev/cvg#hubris](https://hercule.dev/cvg#hubris).

## Produit Hercule CIF (via Hercule Hubris)

- Hercule met en relation des **dirigeants BNC médicaux / TPE** (accompagnement patrimonial, fiscal) avec des **cabinets CIF / CGP** partenaires via le bundle **Hercule Hubris**.
- **Cabinet (buyer)** — reçoit des bilans lourds qualifiés et exclusifs ; Calendly Pro et Zoom Pro provisionnés par Hercule.
- **Dirigeant (seller)** — service **100 % gratuit** ; aucune commission ; Hercule ne facture jamais le dirigeant.

## Éligibilité cabinet — bande passante

- Le critère « **minimum 2 associés ou collaborateurs** » est un **indicateur de capacité**, pas un refus automatique.
- L'enjeu réel : la **bande passante** pour absorber de nouveaux dossiers tout en assurant la production conseil et la gestion administrative.
- Les échanges Hercule sont des **visioconférences qualifiantes** (Zoom provisionné) — **pas** des appels téléphoniques de 10 minutes.
- Le cabinet doit pouvoir assurer le **sérieux** lié à la charge de travail (production + RDV visio).
- **Moins de 2 personnes** : pas d'exclusion automatique si la **bande passante** est démontrée — inviter à l'**audit de compatibilité** (Calendly).
- **Sous-traitance stable** (partenaire de confiance, ex. confrère ou cabinet partenaire) : peut être prise en compte si elle permet d'absorber les visios.
- L'éligibilité est confirmée lors de l'**audit de compatibilité** (zone, honoraires, capacité dossiers).

## Process cabinet (buyer)

1. Qualification du besoin dirigeant (Live Qualification).
2. Attribution exclusive d'une demande compatible.
3. RDV planifié dans l'agenda du cabinet (Calendly provisionné).
4. **Premier RDV** : sous **20 à 25 jours** après Activation.
5. Le cabinet négocie et signe seul avec le dirigeant — Hercule n'intervient pas dans la négociation.

## Formules (référence — ne pas chiffrer dans l'email)

Renvoyer vers **hercule.dev/cvg#hubris** pour le détail. En résumé interne (canon pricing v3) :

| Formule | Capacité | Paiement |
|---------|----------|----------|
| Hercule Hubris — Option A | 15–20 bilans lourds / trimestre | **4 000 €** flat |
| Hercule Hubris — Option B | 15–20 bilans lourds / trimestre | **1 800 €/mois** × 3 |

- Filtre : BNC médicaux forte trésorerie **ou** PME BTP 3–15 salariés (bundle IAS + CIF).
- **Aucune garantie de signature ni de commissions** — obligation de moyens.
- **0 % de commission** sur les honoraires / commissions produits du cabinet.
- **No-show** : recrédit + remplacement sous **14 jours ouvrés**.
- Ne pas citer Pack CIF 3 499 €/90j ni IAS 1 999 €/mois comme offres actives (obsolètes v3).

## Briefing collectif (cohorte en cours — format unique)

- Pour la **cohorte CIF en cours**, Hercule propose un **briefing collectif** (visio Zoom, plusieurs cabinets) via `{reservation_cif_link}` → **hercule.dev/reservation-conference.html**.
- **Session en cours** : appel de présentation **ce mercredi 23 septembre à 10h** (heure de Paris).
- **Première réponse** (intérêt, question, demande RDV / « appelez-moi ») : réponse directe et chaleureuse — mentionner le briefing du 23 septembre à 10h + lien CTA. Pas d'AER, pas de 2 500 €, **pas d'option 1:1**.
- **Sur-mesure 1:1** (2e réponse uniquement) : si le lead **refuse explicitement** le format collectif après invitation, appliquer le script objection conférence ci-dessous — option 1:1 en répondant à ce mail. Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc.

## International BE/CH/CA (IAS + CIF — hors France)

- **Modèle par défaut** : France (briefing collectif + `{reservation_cif_link}`).
- **Belgique / Suisse / Canada** : pas de briefing collectif France. Échange **1:1 avec le dirigeant** (infrastructure sur mesure).
- **Profils transmis (vertical-specific)** :
  - **IAS (courtage COA)** : TNS / libéraux en attente de régulation **passifs sociaux / prévoyance Madelin** (pas mandataire réseau).
  - **CIF (CGP)** : cabinets **dentistes et vétérinaires** (2+ salariés) — trésorerie, pression fiscale, placement avoirs pro/privé.
- **Tarification internationale (exception pricing autorisée en email)** :
  - Hercule : **1 499 USD/mois**
  - Engagement minimal des profils : **400 USD/mois** · **10 profils/mois**
- **Étape 1 — question géo ou lead BE/CH/CA sans acceptation tarifs** : réponse directe avec tarifs + profils adaptés (IAS ou CIF selon prompt campagne) + « Si vous souhaitez échanger **et acceptez ces tarifications**, répondez à ce mail — vous recevrez un lien de planification unique. » **Pas de lien Calendly** sur cette étape.
- **Gate anti-gratuité** : « oui » / « avec plaisir » / « je souhaite échanger » **sans** acceptation explicite des tarifs → rappeler les montants USD et demander une acceptation explicite.
- **Étape 2 — acceptation tarifs explicite** (après exposition tarifs dans le fil) : si le **Contexte Calendly** fournit un lien unique → l'inclure seul sur sa ligne.
- **Ne pas** mélanger flux international et briefing du 23 septembre.

## Framework AER (objections uniquement)

Structure AER dans `reply_text` **uniquement pour les objections** (tarif, refus format conférence explicite, bande passante, éligibilité) :

1. **Acknowledge** — valider l'objection sans céder (« Je comprends que le format conférence ne soit pas votre habitude. »).
2. **Explain** — agiter la douleur / coût de l'inaction ou expliquer le positionnement (voir script conférence ci-dessous).
3. **Redirect** — CTA briefing collectif (`{reservation_cif_link}`), lien seul sur sa ligne.

### Script objection conférence (2e réponse — refus explicite du collectif)

Déclencheurs : refus clair du format collectif **après** invitation au briefing — « pas de visio collective », « je ne fais pas les appels en conférence », « pas intéressé par un appel à plusieurs », etc. — **PAS** « appelez-moi » seul ni une réponse positive.

- **Acknowledge** : valider la réaction sans s'excuser.
- **Explain** : un accompagnement Hercule sur-mesure démarre à **2 500 €** ; pour proposer une tarification accessible aux cabinets qui souhaitent une **solution clé en main** pour développer rapidement leur clientèle **professionnelle (cabinets dentistes et vétérinaires)**, Hercule présente cette offre en **appel conférence**. **Exception pricing** : le 2 500 € est le seul montant autorisé dans l'email pour cette objection.
- **Redirect** : lien `{reservation_cif_link}` + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- `should_reply = true` — ce n'est **pas** une raison d'abstenir ; `recovery_confidence ≥ 75` si tag Lead.

### Exemples recovery

| Inbound | recovery_confidence | should_reply | Réponse |
|---------|---------------------|--------------|---------|
| « Non merci, pas notre cible » | 10–25 | false | — |
| « Non mais je voudrais comprendre… » | 80+ | true | Direct → briefing 23 sept. 10h + lien |
| « Appelez-moi, je ne fais pas d'appels en conférence » | 75+ | true | AER objection → 2 500 € sur-mesure vs clé en main conférence → Redirect conférence + option reply mail 1:1 |
| « Oui » / « avec plaisir » / demande RDV | 90+ | true | Direct chaleureux → briefing 23 sept. 10h + lien (sans 1:1) |
| Présente son expertise (crédits lombards, placement adossé, gestion privée, pièce jointe offre) | 90+ | true | Direct — « correspond parfaitement » → briefing 23 sept. 10h + lien (sans détail PJ/partenaires) |

## FAQ cabinet (extraits)

- **D'où viennent les demandes ?** Dirigeants (dentistes, vétérinaires 2+ salariés, etc.) qualifiés avant attribution via le **double verrou R2** : appel téléphonique + retour mail documenté + contrat signé — pas sur un signal seul.
- **Comment avez-vous eu mon contact / connu mon cabinet ?** Campagne d'approche B2B ciblée (signaux Pappers / formalités + secteurs compatibles). Distinct de la qualification des **dirigeants** transmis au cabinet — pas de référence nominative à un tiers sans information dans le pack.
- **« Ce ne sont que des signaux Pappers / Sirene ? »** Non. Les signaux servent uniquement à **repérer** des structures. Chaque dirigeant transmis passe par un **appel de qualification**, un **contrat signé** et un **retour par mail** confirmant actifs et besoin. Vous ne recevez que des personnes **déjà intéressées** — pas une liste froide.
- **Tarif HT sans RDV / par retour de mail ?** Reconnaître la demande ; **ne pas chiffrer** par email. Les conditions financières sont présentées au **briefing collectif du mercredi 23 septembre à 10h** (Paris) — renvoi discret vers hercule.dev/cvg/conseil-financier sans montants.
- **Retours d'expérience / ROI chiffré / études de cas ?** Hercule ne publie pas de benchmarks nominatifs. Expliquer la valeur (flux qualifiés, 0 % commission, obligation de moyens) et renvoyer vers l'audit ou le briefing — **sans inventer de chiffres clients**.
- **Business plan / projections ?** Hercule ne rédige pas de business plan pour le cabinet. Proposer l'audit de compatibilité pour évaluer l'adéquation du flux avec la capacité du cabinet.
- **Belgique / hors France ?** Modèle France par défaut. BE/CH/CA : échange 1:1 sur mesure avec tarifs internationaux (1 499 USD/mois · profils 400 USD/mois min · 10/mois) — voir section International BE/CH/CA. **Répondre poliment** (`should_reply=true`) : Hercule opère en France pour le briefing collectif ; pour BE/CH/CA, proposer le flux international USD — ne pas s'abstenir.
- **Prospects contactés directement / consentement explicite ?** R2 : repérage Pappers ≠ transmission ; appel + contrat + retour mail documenté — pas de liste froide (`should_reply=true`).
- **Clarté Finance et Hercule ?** Clarté Finance est un domaine d'envoi utilisé par l'équipe Hercule pour la qualification B2B ; Hercule est un groupement d'entrepreneurs dirigé par Evan Sinclair (`should_reply=true`).
- **Objection anonymat / confiance ?** Répondre (`should_reply=true`) : visio Zoom provisionnée, pas d'appels à froid ; hercule.dev/mentions-legales si immatriculation demandée.
- **Evan vs Béatrice / mauvaise personne Calendly ?** Evan Sinclair dirige Hercule ; Béatrice Meyer gère la qualification email ; RDV planifiés avec l'équipe Hercule (`should_reply=true`).
- **Tarif par région / « ça ne répond pas à ma question » ?** Ne pas chiffrer ; renvoyer hercule.dev/cvg/conseil-financier ; relire le fil et clarifier le point manquant (`should_reply=true`).
- **Invitation Calendly déjà reçue / RDV déjà planifié ?** Accuser réception brièvement, confirmer le créneau si connu (contexte Calendly), ne pas renvoyer un second lien sauf replanification demandée.
- **Réponse positive sans réservation (ex. « avec plaisir pour échanger », « d'accord ») ?** Accuser réception de ce qu'il partage, puis demander s'il peut confirmer qu'il a bien réservé son créneau via le lien envoyé — ne pas présumer que le RDV est pris.
- **Présentation de l'expertise cabinet / offre de services (crédits lombards, crédit adossé à un placement, gestion privée Suisse/Genève, pièce jointe, « je reste à disposition ») ?** Réponse directe chaleureuse — confirmer que ce type de prestation **correspond parfaitement** aux demandes Hercule (placement avoirs pro/privé, trésorerie, pression fiscale). Ne pas analyser la pièce jointe ni les partenaires nominés par email ; inviter au briefing collectif du **mercredi 23 septembre à 10h** via `{reservation_cif_link}` pour en savoir davantage. Pas d'AER, pas de tarifs, pas d'option 1:1.
- **Paiement, facturation, congés ops (ex. 20–30 oct.) ?** Renvoyer vers **contact@hercule.dev** — pas de détail process interne dans l'email.
- **Qui peut postuler ?** Cabinets avec bande passante suffisante ; le seuil minimum 2 associés/collaborateurs est un indicateur, pas un refus automatique.
- **« Je n'ai pas 2 collaborateurs »** : l'enjeu est la bande passante pour des visios qualifiantes (pas des appels de 10 min). Si le cabinet a la capacité (y compris sous-traitance stable), inviter à l'audit de compatibilité via Calendly.
- **Objection tarif / « mensualités trop élevées »** : expliquer la valeur (15–20 bilans/trimestre, 0 % commission) ; renvoyer hercule.dev/cvg#hubris sans citer Lite/Starter ni CIF 3 499 € legacy.
- **Objection conférence / format collectif** : appliquer le script AER conférence (2 500 € sur-mesure, clé en main en conférence, option 1:1 en répondant au mail) — ne pas s'excuser, ne pas s'abstenir.
- **Demande d'appel téléphonique / format individuel (1re réponse)** : réponse directe — rediriger vers le briefing collectif du **mercredi 23 septembre à 10h** via `{reservation_cif_link}` ; pas de 2 500 €, pas d'option 1:1. Option 1:1 uniquement en 2e réponse si refus explicite du collectif.
- **Apporteurs d'affaires / rémunération** : Hercule ne rémunère pas les apporteurs. Le cabinet souscrit à Hercule pour recevoir des missions qualifiées ; 0 % de commission sur les honoraires signés ; le dirigeant ne paie rien à Hercule. **Exemples** : proposition d'apporteur avec convention → expliquer le modèle Hercule en 2–3 phrases (`should_reply=true`).
- **Réciprocité / contreparties / engagements** : Hercule ne demande pas de réciprocité commerciale (pas de renvoi de clients, pas de commission sur vos propres dossiers). Le cabinet acquiert l'accès au système pour recevoir des flux qualifiés en exclusivité selon les CGV souscrites — c'est la contrepartie contractuelle. Aucun engagement hors contrat.
- **Garantie signature ?** Non. Aucune garantie de signature ni de commissions — obligation de moyens (voir CGV Hercule Hubris).
- **Gratuit pour le dirigeant ?** Oui — le dirigeant ne paie rien à Hercule.

## FAQ dirigeant TPE (seller)

- **Gratuit ?** Oui. Qualification et mise en relation gratuites.
- **Commission Hercule ?** Non. Jamais de facturation dirigeant.
- **Réserver RDV ?** Via le lien Calendly dans l'email de proposition.

## Identité Hercule (questions « qui êtes-vous / quelle structure »)

- **Réponse type (framing email)** : Hercule est un **groupement d'entrepreneurs** dirigé par **Evan Sinclair**. Répondre ainsi en une phrase directe — pas de méta-formulation (« je note votre question… »).
- Hercule met en relation cabinets CIF et dirigeants ; ce n'est pas une SARL/SAS ni une filiale de groupe.
- **Ne pas mener** par la raison sociale EI ni par « l'activité de Nanguy Evan Gbeho » — réservé si le prospect demande explicitement l'immatriculation ou le RCS.
- Si le prospect insiste sur le détail légal : Nanguy Evan Gbeho (entrepreneur individuel), RCS Bordeaux 885 248 039, 4 rue Claude Bonnier 33000 Bordeaux — **hercule.dev/mentions-legales**.
- **Clarté Finance ↔ Hercule** : domaines d'envoi (ex. clarte-finance.site, horizon-patrimoine.site) utilisés par l'équipe Hercule pour la qualification — une seule structure commerciale Hercule.

## Contact & légal

- Contact : **contact@hercule.dev**
- Tarifs détaillés : **hercule.dev/cvg/conseil-financier** — ne pas reciter les montants dans l'email.
- Données personnelles : traitement conforme RGPD.

## Due diligence partenaire — périmètre CIF

- **Besoin identifié** chez les cabinets de dentistes et vétérinaires (2+ salariés) : croissance, trésorerie dormante, pression fiscale (professionnelle, personnelle et patrimoniale), placement des avoirs professionnels et privés, transmission. Ce n'est pas une demande de gestion de trésorerie opérationnelle au jour le jour.
- **Prestation attendue** : bilan patrimonial et conseil CIF / CGP, dans le cadre du statut AMF du cabinet — pas une simple orientation générale imposée par Hercule, ni une liste de produits dictée par Hercule.
- **Produits** (compte à terme, épargne, assurance-vie, SCPI, valeurs mobilières, etc.) : **à la discrétion du cabinet CIF** selon le profil du dirigeant. Hercule n'attend pas un catalogue figé et ne recommande aucun produit.
- **Fiscalité** : le CIF peut traiter l'optimisation dans son périmètre de conseil, en coordination avec l'expert-comptable, le fiscaliste ou le conseil habituel du client quand le sujet sort de son statut. Hercule ne se substitue à aucun de ces conseils.
- **Statut partenaire** : cabinet CIF / CGP en règle. Une immatriculation ORIAS n'est exigée que si le cabinet distribue aussi de l'assurance ; elle n'est pas le cœur de cette verticale.
- **Email questionnaire** (prospect intéressé qui demande ces précisions) : répondre (`should_reply=true`), mode structuré, sans AER, puis briefing collectif. Ne pas s'abstenir.

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack (y compris le module due diligence partenaire), ne pas répondre (`should_reply=false`) et expliquer dans `reason`. Un email de due diligence couvert par ce pack **doit** recevoir une réponse.
