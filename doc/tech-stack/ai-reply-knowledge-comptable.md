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
| Hercule Lite | 5 missions/mois — **998 €/mois** | Aucune — no-show only |
| Hercule Starter | 10 missions / mois | 3 000 € cumulés après 10 missions, ou **5 remplacements** |
| Pack 3 mois Starter | 30 missions sur 3 mois | 9 000 € cumulés après 30 missions, ou **15 remplacements** (5 par tranche de 10 missions) |

- **0 % de commission** sur les honoraires signés par le cabinet.
- **No-show** : prospect absent malgré relance H-24 → attribution recréditée, remplacement sous **14 jours ouvrés**.

## FAQ cabinet (extraits)

- **D'où viennent les demandes ?** Dirigeants PME en reprise comptable, échéances fiscales, déclarations — qualifiés avant attribution.
- **Qui peut postuler ?** Cabinets avec bande passante suffisante ; le seuil > 3 associés/collaborateurs est un indicateur, pas un refus automatique.
- **« Je n'ai pas 3 collaborateurs »** : l'enjeu est la bande passante pour des visios qualifiantes (pas des appels de 10 min). Si le cabinet a la capacité (y compris sous-traitance stable), inviter à l'audit de compatibilité via Calendly.
- **Objection tarif / « mensualités trop élevées »** : expliquer la valeur (10 missions/mois, garantie MRR, 0 % commission sur honoraires) ; mentionner Hercule Lite (998 €/mois, 5 missions/mois) comme offre d'entrée tant que le cabinet a la capacité d'absorber ; détail sur hercule.dev/cvg/comptable.
- **Demande d'appel téléphonique** : demander « à quelles heures seriez-vous disponible cette semaine ? », proposer des créneaux Calendly (visio) — pas d'appel téléphonique ad hoc.
- **Apporteurs d'affaires / rémunération** : Hercule ne rémunère pas les apporteurs. Le cabinet souscrit à Hercule pour recevoir des missions qualifiées ; 0 % de commission sur les honoraires signés ; le dirigeant ne paie rien à Hercule.
- **Garantie signature ?** Non. Garantie MRR uniquement sur Hercule Starter et Pack (voir CGV).
- **Gratuit pour le dirigeant ?** Oui — le dirigeant ne paie rien à Hercule.

## FAQ dirigeant TPE (seller)

- **Gratuit ?** Oui. Qualification et mise en relation gratuites.
- **Commission Hercule ?** Non. Jamais de facturation dirigeant.
- **Réserver RDV ?** Via le lien Calendly dans l'email de proposition.

## Identité légale Hercule (questions « qui êtes-vous / quelle structure »)

- **Raison sociale** : **Nanguy Evan Gbeho** — **entrepreneur individuel (EI)**.
- **Dénomination commerciale** : **Hercule** (nom commercial alternatif : Goscale France).
- **Siège / établissement** : 4 rue Claude Bonnier, 33000 Bordeaux.
- **RCS** : 885 248 039 R.C.S. Bordeaux (immatriculation : 22/04/2025).
- **Greffe** : Tribunal de Commerce de Bordeaux — n° de gestion 2025A02250.
- **TVA** : non applicable — art. 293 B du CGI (franchise en base).
- **Directeur de publication** : Evan Nanguy.
- Hercule **n'est pas** une société (SARL, SAS, etc.) ni une filiale d'un groupe : c'est l'activité B2B exploitée par l'EI ci-dessus.
- Détail : **hercule.dev/mentions-legales**.

## Contact & légal

- Contact : **contact@hercule.dev**
- Tarifs détaillés : **hercule.dev/cvg/comptable** — ne pas reciter les montants dans l'email.
- Données personnelles : traitement conforme RGPD.

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack, ne pas répondre (`should_reply=false`) et expliquer dans `reason`.
