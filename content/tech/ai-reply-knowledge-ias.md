# AI Reply Agent — ground truth IAS / courtage (condensed)

```
status: canonical
audience: coding-agent
vertical: ias
depends_on: _shared/cgv.md, constants-commercial.md, ai-reply-knowledge-partner-dd-shared.md
do_not:
  - Chiffrer les tarifs dans l'email sauf objection conférence (2 500 €)
  - Citer IAS 1 999 €/mois comme offre active
  - Présenter Hercule comme courtier, mandataire ou sélectionneur de contrats
  - Confondre courtier COA et agent général / mandataire réseau
```

> Source condensée niche **IAS** (courtiers prévoyance). Offre : **Hercule Hubris**. Détail : hercule.dev/cvg#hubris.

## Produit Hercule IAS (via Hercule Hubris)

- Hercule met en relation des **dirigeants TPE/PME et TNS** (prévoyance, protection sociale, passifs sociaux, Madelin) avec des **cabinets de courtage indépendants (COA, ORIAS)** via **Hercule Hubris**.
- **Cabinet (buyer)** — reçoit des bilans lourds qualifiés et exclusifs ; Calendly Pro et Zoom Pro provisionnés par Hercule.
- **Dirigeant (seller)** — service **100 % gratuit** ; Hercule ne facture jamais le dirigeant.
- Positionnement : **courtier (COA)**, pas mandataire réseau ni agent général.

## Éligibilité cabinet — bande passante

- Le seuil d'équipe est un **indicateur de capacité**, pas un refus automatique.
- Les échanges sont des **visioconférences qualifiantes** — pas des appels de 10 minutes.
- Éligibilité confirmée à l'**audit de compatibilité**.

## Process cabinet (buyer)

1. Qualification du besoin dirigeant (Live Qualification).
2. Attribution exclusive d'une demande compatible.
3. RDV planifié dans l'agenda du cabinet (Calendly provisionné).
4. **Premier RDV** : sous **20 à 25 jours** après Activation.
5. Le cabinet négocie et signe seul avec le dirigeant.

## Formules (référence — ne pas chiffrer dans l'email)

Renvoyer vers **hercule.dev/cvg#hubris**. Canon pricing v3 :

| Formule | Capacité | Paiement |
|---------|----------|----------|
| Hercule Hubris — Option A | 15–20 bilans lourds / trimestre | **4 000 €** flat |
| Hercule Hubris — Option B | 15–20 bilans lourds / trimestre | **1 800 €/mois** × 3 |

- Filtre : PME BTP **3–15 salariés** ou BNC médicaux (bundle IAS + CIF). Campagne courtiers : TNS et libéraux, passifs sociaux, prévoyance Madelin.
- **0 % de commission** sur honoraires et commissions produits.
- **Aucune garantie de signature ni de commissions**.
- Ne pas citer IAS 1 999 €/mois comme offre active.

## Briefing collectif

- `{reservation_cif_link}` → **hercule.dev/reservation-conference.html**.
- Session : **mercredi 23 septembre à 10h** (heure de Paris).
- Première réponse : directe, sans AER, sans 2 500 €, sans option 1:1.
- Objection conférence explicite (2e réponse) : script 2 500 € sur-mesure vs clé en main clientèle TNS / libéraux en conférence.

## Due diligence partenaire — périmètre IAS

- **Besoin identifié** : TNS et professionnels libéraux, et PME (notamment BTP) confrontés à des **passifs sociaux**, une **prévoyance Madelin**, de l'**IFC** ou une **protection sociale** à réguler. Ce n'est pas une demande de placement de valeurs mobilières ni de conseil CIF.
- **Prestation attendue** : courtage COA — analyse du besoin de protection et proposition de contrats d'assurance / prévoyance / santé collective **dans l'offre ORIAS du cabinet**. Hercule n'impose aucun contrat, assureur ou produit.
- **Statut exigé** : cabinet de courtage **immatriculé ORIAS** (courtier, COA), pas le statut CIF. Le CIF n'est pas requis pour cette verticale.
- **Responsabilité** : le **courtier ORIAS** porte le devoir de conseil et la distribution. Hercule n'intervient pas dans le conseil, la sélection ou la commercialisation des contrats.
- **Email questionnaire** : répondre (`should_reply=true`), mode structuré, sans AER, puis briefing collectif. Ne pas s'abstenir.

## FAQ cabinet (extraits)

- **ORIAS ou CIF ?** ORIAS (courtier). Le statut CIF n'est pas exigé ici.
- **D'où viennent les demandes ?** TNS et libéraux qualifiés avant attribution via le **double verrou R2** : appel téléphonique + retour mail documenté + contrat signé — pas sur un signal seul (IFC, prévoyance, protection sociale servent au repérage).
- **Comment avez-vous eu mon contact (cabinet) ?** Campagne B2B ciblée courtiers prévoyance / IAS. Distinct de la qualification des **dirigeants** transmis.
- **« Ce ne sont que des signaux / listes froides ? »** Non. Repérage public uniquement ; transmission après **appel de qualification**, **contrat signé** et **retour mail** confirmant le besoin. Pas une liste froide.
- **Tarif HT sans RDV ?** Ne pas chiffrer par email ; conditions au **briefing collectif du mercredi 23 septembre à 10h** — hercule.dev/cvg/courtier-assurance sans montants.
- **Exclusivité ?** Oui — une demande, un partenaire.
- **Commission / rétrocession ?** Non. 0 % sur honoraires et produits. Le dirigeant ne paie rien à Hercule.
- **Garantie de signature ?** Non. Obligation de moyens.
- **Belgique ?** France uniquement.
- **Qui êtes-vous ?** Groupement d'entrepreneurs dirigé par Evan Sinclair. hercule.dev/mentions-legales.

## Règle d'abstention

Si la question du prospect **n'est pas clairement couverte** par ce pack (y compris le module due diligence partenaire), ne pas répondre (`should_reply=false`) et expliquer dans `reason`. Un email de due diligence couvert par ce pack **doit** recevoir une réponse.
