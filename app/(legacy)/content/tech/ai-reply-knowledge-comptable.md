# AI Reply Agent — ground truth comptable (condensed)

```
status: canonical
audience: coding-agent
vertical: comptable
depends_on: cvg_comptable.md, constants-commercial.md
decisions: INT-02 EML-05 CVG-01
do_not:
  - Chiffrer les tarifs dans l'email sauf demande explicite ET autorisation ops
  - Contredire _shared/cgv.md / COMMERCIAL_COMPTABLE
  - Promettre une signature de mandat ou un volume de MRR garanti
  - Réintroduire Lite 1 799 € / Starter 2 199 € / garantie MRR
  - Exception autorisée : flux international BE/CH/CA (1 499 USD/mois + 400 USD/mois profils) et objection conférence 2 500 €
```

> Source condensée pour les réponses email **ops** niche comptable. Détail tarifaire : [hercule.dev/cvg/comptable](https://hercule.dev/cvg/comptable) (#dec).

## Produit Hercule Comptable (Mercantile)

- Hercule met en relation des **dirigeants de TPE / indépendants** (reprise comptable, fiscal, obligations administratives) avec des **cabinets d'expertise comptable** partenaires via **Hercule Mercantile**.
- **Cabinet (buyer)** — reçoit des missions qualifiées et exclusives ; Calendly Pro et Zoom Pro provisionnés par Hercule.
- **Dirigeant TPE (seller)** — service **100 % gratuit** ; aucune commission ; Hercule ne facture jamais le dirigeant.

## Éligibilité cabinet — bande passante

- Le critère « **plus de 3 associés ou collaborateurs** » est un **indicateur de capacité**, pas un refus automatique.
- L'enjeu réel : la **bande passante** pour absorber de nouveaux dossiers tout en assurant la production comptable et la gestion administrative.
- Les échanges Hercule sont des **visioconférences qualifiantes** (Zoom provisionné) — **pas** des appels téléphoniques de 10 minutes.
- Le cabinet doit pouvoir assurer le **sérieux** lié à la charge de travail (production + RDV visio).
- **Moins de 3 personnes** : pas d'exclusion automatique — inviter à l'**audit de compatibilité** (Calendly) si le cabinet démontre la capacité d'absorber les visios.
- **Sous-traitance stable** (partenaire de confiance, ex. confrère ou cabinet partenaire) : peut être prise en compte si elle permet d'absorber les visios.
- L'éligibilité est confirmée lors de l'**audit de compatibilité** (zone, honoraires, capacité dossiers).

## Process cabinet (buyer)

1. Qualification du besoin dirigeant (Live Qualification).
2. Attribution exclusive d'une demande compatible.
3. RDV planifié dans l'agenda du cabinet (Calendly provisionné).
4. **Premier RDV** : sous **20 à 25 jours** après Activation.
5. Le cabinet négocie et signe seul avec le dirigeant — Hercule n'intervient pas dans la négociation.

## Formules (référence — ne pas chiffrer dans l'email)

Renvoyer vers **hercule.dev/cvg/comptable** (#dec) pour le détail. En résumé interne (canon pricing v3) :

| Formule | Capacité | Engagement |
|---------|----------|------------|
| Hercule Mercantile (DEC) | 10 RDV / mois — restaurants +3 salariés | **1 499 €/mois** · trimestriel (3 mois) |

- **Aucune garantie de signature ni de MRR** — obligation de moyens sur les crédits.
- **0 % de commission** sur les honoraires signés par le cabinet.
- **No-show** : prospect absent malgré relance H-24 → attribution recréditée, remplacement sous **14 jours ouvrés**.
- Ne pas réintroduire Lite 1 799 €, Starter 2 199 €, ni garantie MRR.

## Briefing collectif (cohorte en cours — format unique)

- Pour la **cohorte comptable en cours**, Hercule propose un **briefing collectif** (visio Zoom, plusieurs cabinets) via `{reservation_comptable_link}` → **hercule.dev/reservation-conference.html**.
- **Session en cours** : appel de présentation **ce mercredi 23 septembre à 10h** (heure de Paris).
- **Première réponse** (intérêt, question, demande RDV / « appelez-moi ») : réponse directe et chaleureuse — mentionner le briefing du 23 septembre à 10h + lien CTA. Pas d'AER, pas de 2 500 €, **pas d'option 1:1**.
- **Sur-mesure 1:1** (2e réponse uniquement) : si le lead **refuse explicitement** le format collectif après invitation, appliquer le script objection conférence ci-dessous — option 1:1 en répondant à ce mail. Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc.

## International BE/CH/CA (DEC — hors France)

- **Modèle par défaut** : France (briefing collectif + `{reservation_comptable_link}`).
- **Belgique / Suisse / Canada** : pas de briefing collectif France. Échange **1:1 avec le dirigeant** (infrastructure sur mesure).
- **Profils transmis** : restaurants **+3 salariés** en chaos opérationnel (tenue comptable / social-paie).
- **Tarification internationale (exception pricing autorisée en email)** :
  - Hercule : **1 499 USD/mois**
  - Engagement minimal des profils : **400 USD/mois** · **10 profils/mois**
- **Étape 1 — question géo ou lead BE/CH/CA sans acceptation tarifs** : réponse directe avec tarifs ci-dessus + « Si vous souhaitez échanger **et acceptez ces tarifications**, répondez à ce mail — vous recevrez un lien de planification unique. » **Pas de lien Calendly** sur cette étape.
- **Gate anti-gratuité** : « oui » / « avec plaisir » / « je souhaite échanger » **sans** acceptation explicite des tarifs → rappeler les montants USD et demander une acceptation explicite (pas de RDV gratuit implicite).
- **Étape 2 — acceptation tarifs explicite** (après exposition tarifs dans le fil) : si le **Contexte Calendly** fournit un lien unique → l'inclure seul sur sa ligne. Sinon inviter à répondre en confirmant l'acceptation.
- **Ne pas** mélanger flux international et briefing du 23 septembre.

## Framework AER (objections uniquement)

Structure AER dans `reply_text` **uniquement pour les objections** (tarif, refus format conférence explicite, bande passante, éligibilité) :

1. **Acknowledge** — valider l'objection sans céder (« Je comprends que le format conférence ne soit pas votre habitude. »).
2. **Explain** — agiter la douleur métier ou expliquer le positionnement (voir script conférence ci-dessous).
3. **Redirect** — CTA briefing collectif (`{reservation_comptable_link}`), lien seul sur sa ligne.

### Script objection conférence (2e réponse — refus explicite du collectif)

Déclencheurs : refus clair du format collectif **après** invitation au briefing — « pas de visio collective », « je ne fais pas les appels en conférence », « pas intéressé par un appel à plusieurs », etc. — **PAS** « appelez-moi » seul ni une réponse positive.

- **Acknowledge** : valider la réaction sans s'excuser.
- **Explain** : un accompagnement Hercule sur-mesure démarre à **2 500 €** ; pour proposer une tarification accessible aux cabinets qui souhaitent une **solution clé en main** pour développer rapidement leur clientèle **BNC/BIC/TNS**, Hercule présente cette offre en **appel conférence**. **Exception pricing** : le 2 500 € est le seul montant autorisé dans l'email pour cette objection.
- **Redirect** : lien `{reservation_comptable_link}` + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- `should_reply = true` — ce n'est **pas** une raison d'abstenir ; `recovery_confidence ≥ 75` si tag Lead.

### Exemples recovery

| Inbound | recovery_confidence | should_reply | Réponse |
|---------|---------------------|--------------|---------|
| « Non merci, pas notre cible » | 10–25 | false | — |
| « Non mais je voudrais comprendre… » | 80+ | true | Direct → briefing 23 sept. 10h + lien |
| « Appelez-moi, je ne fais pas d'appels en conférence » | 75+ | true | AER objection → 2 500 € sur-mesure vs clé en main conférence BNC/BIC/TNS → Redirect conférence + option reply mail 1:1 |
| « Oui » / « avec plaisir » / demande RDV | 90+ | true | Direct chaleureux → briefing 23 sept. 10h + lien (sans 1:1) |

## FAQ cabinet (extraits)

- **D'où viennent les demandes ?** Dirigeants (restaurants +3 salariés, etc.) qualifiés avant attribution via le **double verrou R2** : appel téléphonique + retour mail documenté + contrat signé — pas sur un signal Pappers/Sirene seul.
- **Comment avez-vous eu mon contact (cabinet) ?** Campagne d'approche B2B ciblée (signaux Pappers / formalités + secteurs compatibles). Distinct de la qualification des **dirigeants** transmis au cabinet. Pas de référence nominative à un tiers sans information dans le pack.
- **« Ce ne sont que des signaux Pappers / Sirene ? »** Non. Les signaux publics servent uniquement à **repérer** des structures. Chaque dirigeant transmis passe par un **appel de qualification**, un **contrat signé** et un **retour par mail** confirmant actifs et besoin (recherche d'un cabinet d'expertise comptable). Vous ne recevez que des personnes **déjà intéressées** — pas une liste froide.
- **Tarif HT sans RDV / par retour de mail ?** Reconnaître la demande ; **ne pas chiffrer** par email. Les conditions financières (Mercantile DEC, engagement trimestriel) sont présentées au **briefing collectif du mercredi 23 septembre à 10h** (Paris) — renvoi discret vers hercule.dev/cvg/comptable sans montants (`should_reply=true`).
- **Tarif par région / audit comptable ?** Ne pas chiffrer ; audit de compatibilité (visio) ≠ audit comptable technique ; renvoyer hercule.dev/cvg/comptable (`should_reply=true`).
- **Audit de comptabilité / reprise de dossiers ?** Hercule ne réalise pas d'audit comptable technique. L'**audit de compatibilité** (visio) vérifie zone, honoraires et bande passante pour recevoir des missions qualifiées.
- **Retours d'expérience / ROI chiffré ?** Pas de benchmarks nominatifs publiés. Expliquer la valeur (flux qualifiés, 0 % commission, obligation de moyens) — renvoyer hercule.dev/cvg/comptable sans inventer de chiffres clients.
- **Belgique / hors France ?** Modèle France par défaut. BE/CH/CA : échange 1:1 sur mesure avec tarifs internationaux (1 499 USD/mois · profils 400 USD/mois min · 10/mois) — voir section International BE/CH/CA. **Répondre poliment** (`should_reply=true`) : Hercule opère en France pour le briefing collectif ; pour BE/CH/CA, proposer le flux international USD — ne pas s'abstenir.
- **Invitation Calendly déjà reçue ?** Confirmer brièvement le RDV si connu ; ne pas renvoyer un second lien sans demande de replanification.
- **Réponse positive sans réservation (ex. « avec plaisir pour échanger », « d'accord ») ?** Accuser réception de ce qu'il partage, puis demander s'il peut confirmer qu'il a bien réservé son créneau via le lien envoyé — ne pas présumer que le RDV est pris.
- **Paiement, facturation, congés ops ?** Renvoyer vers **contact@hercule.dev** (`should_reply=true`, message court).
- **Prospects contactés directement / consentement explicite ?** R2 : repérage Pappers ≠ transmission ; chaque dirigeant passe par appel téléphonique + contrat signé + retour mail documenté confirmant actifs et besoin — pas de liste froide (`should_reply=true`).
- **Apporteurs d'affaires / rémunération inverse ?** Hercule ne rémunère pas les apporteurs ; le cabinet souscrit pour recevoir des missions qualifiées ; 0 % sur honoraires ; dirigeant ne paie rien (`should_reply=true`, 2–3 phrases).
- **Objection anonymat / confiance (« je ne vous fais pas confiance ») ?** Répondre (`should_reply=true`) : Hercule est un groupement d'entrepreneurs (Evan Sinclair), échanges en visio Zoom provisionnée — pas d'appels téléphoniques à froid ; hercule.dev/mentions-legales si immatriculation demandée.
- **Evan vs Béatrice / mauvaise personne sur Calendly ?** Clarifier : Evan Sinclair dirige Hercule ; Béatrice Meyer gère la qualification par email ; les RDV peuvent être planifiés avec l'équipe Hercule (`should_reply=true`).
- **Qui peut postuler ?** Cabinets avec bande passante suffisante ; le seuil > 3 associés/collaborateurs est un indicateur, pas un refus automatique.
- **« Je n'ai pas 3 collaborateurs »** : l'enjeu est la bande passante pour des visios qualifiantes (pas des appels de 10 min). Si le cabinet a la capacité (y compris sous-traitance stable), inviter à l'audit de compatibilité via Calendly.
- **Objection tarif / « mensualités trop élevées »** : expliquer la valeur (10 RDV/mois, engagement 3 mois, 0 % commission sur honoraires) ; renvoyer vers hercule.dev/cvg/comptable (#dec) sans chiffrer Lite/Starter legacy.
- **Objection conférence / format collectif** : appliquer le script AER conférence (2 500 € sur-mesure, clé en main BNC/BIC/TNS en conférence, option 1:1 en répondant au mail) — ne pas s'excuser, ne pas s'abstenir.
- **Demande d'appel téléphonique / format individuel (1re réponse)** : réponse directe — rediriger vers le briefing collectif du **mercredi 23 septembre à 10h** via `{reservation_comptable_link}` ; pas de 2 500 €, pas d'option 1:1. Option 1:1 uniquement en 2e réponse si refus explicite du collectif.
- **Apporteurs d'affaires / rémunération** : Hercule ne rémunère pas les apporteurs. Le cabinet souscrit à Hercule pour recevoir des missions qualifiées ; 0 % de commission sur les honoraires signés ; le dirigeant ne paie rien à Hercule.
- **Garantie signature ?** Non. Aucune garantie de signature ni de MRR — obligation de moyens (voir CGV).
- **Gratuit pour le dirigeant ?** Oui — le dirigeant ne paie rien à Hercule.

## FAQ dirigeant TPE (seller)

- **Gratuit ?** Oui. Qualification et mise en relation gratuites.
- **Commission Hercule ?** Non. Jamais de facturation dirigeant.
- **Réserver RDV ?** Via le lien Calendly dans l'email de proposition.

## Identité Hercule (questions « qui êtes-vous / quelle structure »)

- **Réponse type (framing email)** : Hercule est un **groupement d'entrepreneurs** dirigé par **Evan Sinclair**. Répondre ainsi en une phrase directe — pas de méta-formulation (« je note votre question… »).
- Hercule met en relation cabinets EC et dirigeants TPE ; ce n'est pas une SARL/SAS ni une filiale de groupe.
- **Ne pas mener** par la raison sociale EI ni par « l'activité de Nanguy Evan Gbeho » — réservé si le prospect demande explicitement l'immatriculation ou le RCS.
- Si le prospect insiste sur le détail légal : Nanguy Evan Gbeho (entrepreneur individuel), RCS Bordeaux 885 248 039, 4 rue Claude Bonnier 33000 Bordeaux — **hercule.dev/mentions-legales**.

## Contact & légal

- Contact : **contact@hercule.dev**
- Tarifs détaillés : **hercule.dev/cvg/comptable** — ne pas reciter les montants dans l'email.
- Données personnelles : traitement conforme RGPD.

## Due diligence partenaire — périmètre DEC

- **Besoin identifié** chez les restaurants indépendants de plus de 3 salariés : fort turnover, volonté de s'étendre, rentabilité pénalisée par une comptabilité qui ignore le turnover, le suivi des heures et le ratio matière. Ils cherchent une **tenue comptable** et un accompagnement **social / paie**.
- **Prestation attendue** : production comptable d'un cabinet d'expertise comptable, dans la lettre de mission du cabinet. Hercule ne fait pas d'audit comptable technique.
- **Fiscalité** : principalement la fiscalité **professionnelle** du dirigeant (BIC), traitée par l'expert-comptable. Hercule ne demande pas au cabinet de recommander des placements ou des produits financiers.
- **Statut partenaire** : cabinet d'expertise comptable en règle (Ordre). Pas d'exigence CIF ni ORIAS pour cette verticale.
- **Email questionnaire** (prospect intéressé qui demande ces précisions) : répondre (`should_reply=true`), mode structuré, sans AER, puis briefing collectif. Ne pas s'abstenir.

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack (y compris le module due diligence partenaire), ne pas répondre (`should_reply=false`) et expliquer dans `reason`. Un email de due diligence couvert par ce pack **doit** recevoir une réponse.
