# AI Reply Agent — ground truth (condensed)

```
status: legacy-ops
audience: coding-agent
vertical: agence
decisions: INT-02 EML-05
do_not:
  - Contredire cvg_master.md / constants-commercial.md sur les prix
  - Mentionner 898 € ou offre 2 500 € souscriptible
  - Utiliser ce fichier pour la niche comptable — voir ai-reply-knowledge-comptable.md
```

> Source condensée pour les réponses email **ops** (agence / entreprise). Prix : [/cvg/constants-commercial](/cvg/constants-commercial).  
> **Comptable :** [`ai-reply-knowledge-comptable.md`](./ai-reply-knowledge-comptable.md) · CGV [/cvg/comptable](/cvg/comptable).

## Produit Hercule

- Hercule met en relation des **entreprises** (PME, TPE) avec des **agences web** partenaires.
- **Agence (buyer)** — entrée : **Starter 1 489 €** pour **5 Attributions** (montant net, TVA non applicable). Renouvellement optionnel : **1 489 € / mois** ou **pack 989×3 = 2 967 €** (15 Attributions).
- **Entreprise (seller)** : service **100 % gratuit** — jamais de frais, **aucune commission**, **aucun upsell** après mise en relation.

## Promesse agence (capacity)

- **Starter** : 5 Attributions sur la durée du pack.
- **Mensuel** (renouvellement) : environ **3 à 4 RDV honorés / mois** @ allocation standard (30 inbox).

## Process entreprise (seller)

1. Qualification du besoin (téléphone ou formulaire onboarding).
2. Recherche d'une agence compatible (prestations, secteur, taille, budget, positionnement).
3. Proposition par email avec **lien Calendly** pour réserver un RDV.
4. RDV direct avec l'agence — Hercule n'intervient pas dans la négociation commerciale.

## FAQ entreprise (extraits)

- **Gratuit ?** Oui. Qualification et mise en relation gratuites ; les agences financent le matching Hercule.
- **Sélection agence ?** Compatibilité besoin ↔ profil agence (prestations, secteur, taille, tarifs, positionnement). Qualification téléphonique avant proposition.
- **Commission Hercule ?** Non. Jamais de facturation entreprise, pas d'upsell après mise en relation.
- **Continuer la recherche ?** Oui, possible après RDV via le questionnaire post-RDV.
- **Réserver RDV ?** Via le lien Calendly dans l'email de proposition — pas depuis une page de suivi seule.

## Agence — post-RDV (résumé)

- Question survey agence : « Avez-vous fait la vente ? »
- Renouvellement typique : **mensuel 1 489 €** ou **pack 989×3** — proposition **optionnelle** in-page ou par ops. **Pas d'offre 898 €.**

## Contact & légal (résumé)

- Contact : **contact@hercule.dev**
- Tarifs détaillés : renvoyer vers **hercule.dev/cvg** sans reciter les montants dans l'email sauf demande explicite.
- Données personnelles : traitement conforme RGPD (voir politique confidentialité site).
- Ne pas promettre de délais, prix ou garanties non listés ici.

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack, ne pas répondre (`should_reply=false`) et expliquer dans `reason`.
