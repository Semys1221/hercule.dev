# AI Reply Agent — ground truth comptable (condensed)

```
status: canonical
audience: coding-agent
vertical: comptable
depends_on: cvg_comptable.md, constants-commercial.md
decisions: INT-02 EML-05 CVG-01
do_not:
  - Chiffrer les tarifs dans l'email sauf demande explicite ET autorisation ops
  - Contredire cvg_comptable.md / COMMERCIAL_COMPTABLE
  - Promettre une signature de mandat ou un volume de MRR garanti
```

> Source condensée pour les réponses email **ops** niche comptable. Détail tarifaire : [hercule.dev/cvg/comptable](https://hercule.dev/cvg/comptable).

## Produit Hercule Comptable

- Hercule met en relation des **dirigeants de TPE / indépendants** (reprise comptable, fiscal, obligations administratives) avec des **cabinets d'expertise comptable** partenaires.
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

Renoyer vers **hercule.dev/cvg/comptable** pour le détail. En résumé interne :

| Formule | Missions | Garantie MRR |
|---------|----------|--------------|
| Hercule Lite | 5 missions/mois — **1 799 €/mois** | Aucune — no-show only |
| Hercule Starter | 10 missions / mois | 3 000 € cumulés après 10 missions, ou **5 remplacements** |
| Pack 3 mois Starter | 30 missions sur 3 mois | 9 000 € cumulés après 30 missions, ou **15 remplacements** (5 par tranche de 10 missions) |

- **0 % de commission** sur les honoraires signés par le cabinet.
- **No-show** : prospect absent malgré relance H-24 → attribution recréditée, remplacement sous **14 jours ouvrés**.

## Briefing collectif (cohorte en cours — format unique)

- Pour la **cohorte comptable en cours**, Hercule propose un **briefing collectif** (visio Zoom, plusieurs cabinets) via `{reservation_comptable_link}` → **hercule.dev/reservation-conference.html**.
- Si le lead demande un RDV ou un appel : rediriger vers le briefing collectif via le lien CTA — ne pas inventer d'URL.
- **Sur-mesure 1:1** : uniquement si le lead **répond à ce mail** pour discuter d'une solution sur-mesure avec le dirigeant — pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc.

## Framework AER (toutes les réponses should_reply=true)

Structure obligatoire dans `reply_text` :

1. **Acknowledge** — valider l'objection sans céder (« Je comprends que le format conférence ne soit pas votre habitude. »).
2. **Explain** — agiter la douleur métier ou expliquer le positionnement (voir script conférence ci-dessous).
3. **Redirect** — CTA briefing collectif (`{reservation_comptable_link}`), lien seul sur sa ligne.

### Script objection conférence (prioritaire)

Déclencheurs : « conférence », « appel à plusieurs », « appelez-moi », « pas de visio collective », « je ne fais pas les appels en conférence », etc.

- **Acknowledge** : valider la réaction sans s'excuser.
- **Explain** : un accompagnement Hercule sur-mesure démarre à **2 500 €** ; pour proposer une tarification accessible aux cabinets qui souhaitent une **solution clé en main** pour développer rapidement leur clientèle **BNC/BIC/TNS**, Hercule présente cette offre en **appel conférence**. **Exception pricing** : le 2 500 € est le seul montant autorisé dans l'email pour cette objection.
- **Redirect** : lien `{reservation_comptable_link}` + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- `should_reply = true` — ce n'est **pas** une raison d'abstenir ; `recovery_confidence ≥ 75` si tag Lead.

### Exemples recovery

| Inbound | recovery_confidence | should_reply | AER |
|---------|---------------------|--------------|-----|
| « Non merci, pas notre cible » | 10–25 | false | — |
| « Non mais je voudrais comprendre… » | 80+ | true | Acknowledge hésitation → Explain coût inaction → Redirect conférence |
| « Appelez-moi, je ne fais pas d'appels en conférence » | 75+ | true | Acknowledge format → Explain 2 500 € sur-mesure vs clé en main conférence BNC/BIC/TNS → Redirect conférence + option reply mail 1:1 |
| « Oui » / question process | 90+ | true | AER light → Redirect conférence |

## FAQ cabinet (extraits)

- **D'où viennent les demandes ?** Dirigeants PME en reprise comptable, échéances fiscales, déclarations — qualifiés avant attribution.
- **Comment avez-vous eu mon contact ?** Campagne d'approche B2B ciblée (signaux Pappers / formalités + secteurs compatibles). Pas de référence nominative à un tiers sans information dans le pack.
- **Audit de comptabilité / reprise de dossiers ?** Hercule ne réalise pas d'audit comptable technique. L'**audit de compatibilité** (visio) vérifie zone, honoraires et bande passante pour recevoir des missions qualifiées.
- **Retours d'expérience / ROI chiffré ?** Pas de benchmarks nominatifs publiés. Expliquer la valeur (flux qualifiés, 0 % commission, garantie MRR) — renvoyer hercule.dev/cvg/comptable sans inventer de chiffres clients.
- **Belgique / hors France ?** France uniquement.
- **Invitation Calendly déjà reçue ?** Confirmer brièvement le RDV si connu ; ne pas renvoyer un second lien sans demande de replanification.
- **Paiement, facturation, congés ops ?** Renvoyer vers **contact@hercule.dev**.
- **Qui peut postuler ?** Cabinets avec bande passante suffisante ; le seuil > 3 associés/collaborateurs est un indicateur, pas un refus automatique.
- **« Je n'ai pas 3 collaborateurs »** : l'enjeu est la bande passante pour des visios qualifiantes (pas des appels de 10 min). Si le cabinet a la capacité (y compris sous-traitance stable), inviter à l'audit de compatibilité via Calendly.
- **Objection tarif / « mensualités trop élevées »** : expliquer la valeur (10 missions/mois, garantie MRR, 0 % commission sur honoraires) ; mentionner Hercule Lite (1 799 €/mois, 5 missions/mois) comme offre d'entrée tant que le cabinet a la capacité d'absorber ; détail sur hercule.dev/cvg/comptable.
- **Objection conférence / format collectif** : appliquer le script AER conférence (2 500 € sur-mesure, clé en main BNC/BIC/TNS en conférence, option 1:1 en répondant au mail) — ne pas s'excuser, ne pas s'abstenir.
- **Demande d'appel téléphonique / format individuel** : AER — rediriger vers le briefing collectif via `{reservation_comptable_link}` ; pour une solution sur-mesure, inviter à **répondre à ce mail** pour un 1:1 avec le dirigeant — pas d'appel téléphonique ad hoc ni de lien Calendly 1:1.
- **Apporteurs d'affaires / rémunération** : Hercule ne rémunère pas les apporteurs. Le cabinet souscrit à Hercule pour recevoir des missions qualifiées ; 0 % de commission sur les honoraires signés ; le dirigeant ne paie rien à Hercule.
- **Garantie signature ?** Non. Garantie MRR uniquement sur Hercule Starter et Pack (voir CGV).
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

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack, ne pas répondre (`should_reply=false`) et expliquer dans `reason`.
