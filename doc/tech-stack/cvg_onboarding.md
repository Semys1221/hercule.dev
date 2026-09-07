# CGV Hercule — Version onboarding (checkbox)

```
status: canonical
audience: coding-agent
depends_on: cvg_master.md, constants-commercial.md
decisions: CVG-01 CVG-02
do_not:
  - Mentionner 898, 4 jours, 1500 €, 5 attributions one-shot
```

> **Version CGV :** 2026-09-06  
> **Document complet :** [cvg_master.md](./cvg_master.md)

---

## Résumé (11 points)

1. **Objet** — Hercule met en relation votre agence avec des **contrats**, après validation téléphonique. Obligation de **moyens**, pas de garantie de vente.
2. **Formules** — **1 489 € TTC / mois** sans engagement · **ou** **989 € × 3 = 2 967 € TTC** pour **15 Attributions**. **0 % de commission**. L’offre 2 500 €/mois est une vitrine, non souscriptible.
3. **Attribution** — Contrat + mise en relation exclusive + RDV **planifié**. Un RDV honoré = présence décideur visio ≥ 15 min. Une vente **ne clôt pas** le pack / le mois.
4. **Démarrage** — Onboarding sous **48 h** · Activation dès **paiement + onboarding** · Premier RDV honoré sous **21 j** @ 30 inbox (28 j si contraint), file d’attente +15 j max.
5. **Volume** — Mensuel : **3–4 RDV honorés / mois** en allocation standard · Pack : **15 Attributions** / 3 mois.
6. **No-show** — Prospect absent malgré relance H-24 : **attribution recréditée**, remplacement sous **14 jours ouvrés**. Signalement sous 48 h.
7. **Garantie pack** — Si CA &lt; **4 500 €** sur 3 mois : jusqu’à **15 remplacements** (conditions CGV § 5.2). L’offre mensuelle n’emporte pas de garantie de CA.
8. **Rétractation** — **Aucune** politique commerciale 4 jours. Commande ferme à l’acceptation + paiement.
9. **Résiliation** — Mensuel : **préavis 30 jours**. Crédits non utilisés forclos sauf RDV déjà planifiés.
10. **Données** — RGPD · Politique de confidentialité : `/confidentialite`.
11. **Planification anticipée** — Demandes visibles = mandat dirigeant. Détail CGV § 4.1–4.2.

---

## Texte checkbox (UI)

```
☐ J'accepte les Conditions Générales de Vente de Hercule
  (version du 6 septembre 2026) et je confirme être un professionnel
  agissant dans le cadre de mon activité.
```

**Libellé lien :** « Lire les CGV complètes » → `/cvg`

---

## Champs techniques

| Champ | Type |
|-------|------|
| `cvg_version` | `text` ex. `2026-09-06` |
| `cvg_accepted_at` | `timestamptz` |
| `cvg_accepted_ip` | `text` optionnel |
| `cvg_accepted_by` | `text` |

Refuser `POST /api/onboarding` si `cvg_accepted !== true` ou version ≠ courante.
