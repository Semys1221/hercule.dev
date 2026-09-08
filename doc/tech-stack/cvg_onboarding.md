# CGV Hercule — Version onboarding (checkbox)

```
status: canonical
audience: coding-agent
depends_on: cvg_master.md, constants-commercial.md
decisions: CVG-01 CVG-02
do_not:
  - Mentionner 898 €, 149 €/RDV, offre 2 500 € souscriptible
```

> **Version CGV :** 2026-09-08  
> **Document complet :** [/cvg](/cvg)

---

## Résumé (11 points)

1. **Objet** — Hercule met en relation votre agence avec des **contrats**, après validation téléphonique. Obligation de **moyens**, pas de garantie de vente.
2. **Formule d'entrée** — **Starter : 1 489 €** (montant net, TVA non applicable) pour **5 Attributions**. **0 % de commission**. Renouvellement optionnel : **1 489 € / mois** ou **989 € × 3 = 2 967 €** (15 Attributions). L'offre **2 500 €/mois** est une vitrine, non souscriptible.
3. **Attribution** — Contrat + mise en relation exclusive + RDV **planifié**. Un RDV honoré = présence décideur visio ≥ 15 min. Une vente **ne clôt pas** le pack / le mois.
4. **Démarrage** — Onboarding sous **48 h** · Activation dès **paiement + onboarding** · Premier RDV honoré sous **21 j** @ 30 inbox (28 j si contraint), file d'attente +15 j max · ~**6 j ouvrés** pour le 1er RDV en audit pré-paiement (CGV §4.2).
5. **Volume** — Starter : **5 Attributions** · Mensuel : **3–4 RDV honorés / mois** · Pack : **15 Attributions** / 3 mois.
6. **No-show** — Prospect absent malgré relance H-24 : **attribution recréditée**, remplacement sous **14 jours ouvrés**. Signalement sous 48 h.
7. **Garantie Starter** — Si MRR &lt; **1 500 €** après 5 Attributions : jusqu'à **5 remplacements** (conditions CGV § 5.1).
8. **Garantie pack** — Si CA &lt; **4 500 €** sur 3 mois : jusqu'à **15 remplacements** (conditions CGV § 5.3).
9. **Rétractation** — **4 jours calendaires** après souscription, tant que l'Activation n'a pas démarré.
10. **Résiliation** — Mensuel : **préavis 30 jours**. Crédits non utilisés forclos sauf RDV déjà planifiés.
11. **Données** — RGPD · Politique de confidentialité : `/confidentialite`.

---

## Texte checkbox (UI)

```
☐ J'accepte les Conditions Générales de Vente de Hercule
  (version du 8 septembre 2026) et je confirme être un professionnel
  agissant dans le cadre de mon activité.
```

**Libellé lien :** « Lire les CGV complètes » → `/cvg`

---

## Champs techniques

| Champ | Type |
|-------|------|
| `cvg_version` | `text` ex. `2026-09-08` |
| `cvg_accepted_at` | `timestamptz` |
| `cvg_accepted_ip` | `text` optionnel |
| `cvg_accepted_by` | `text` |

Refuser `POST /api/onboarding` si `cvg_accepted !== true` ou version ≠ courante.
