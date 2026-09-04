# CGV Hercule — Version onboarding (checkbox)

> **Version CGV :** 2026-09-04  
> **Document complet :** [cvg_master.md](./cvg_master.md)

Document court pour le formulaire d'onboarding agence. Le texte de la checkbox doit pointer vers la version datée des CGV complètes (URL publique future ou lien interne).

---

## Résumé (10 points)

1. **Objet** — Hercule met en relation votre agence avec des **demandes clients qualifiées** (entreprises PME/TPE), après validation téléphonique. Obligation de **moyens**, pas de garantie de vente.

2. **Formules** — **Hercule Starter** : **1 489 €** pour **5 Attributions** · **Hercule** (récurrent) : **2 500 € / mois** pour jusqu'à **4 Attributions / mois**. **0 % de commission** sur vos ventes.

3. **Attribution** — Demande qualifiée + mise en relation exclusive + RDV planifié dans votre agenda. Un **RDV honoré** = présence du décideur en visio ≥ 15 min.

4. **Démarrage** — Onboarding sous **48 h** · Activation sous **4 jours** · Premier RDV honoré sous **21 jours ouvrés** (allocation standard), sous réserve de file d'attente éventuelle (+15 j max).

5. **Volume** — Starter = **pack de 5 Attributions** · Récurrent = jusqu'à **4 / mois** · Rythme opérationnel stable : **3 à 4 RDV honorés / mois** en allocation standard.

6. **No-show** — Prospect absent malgré relance H-24 : **non facturé / recrédité**, remplacement sous **14 jours ouvrés**. Signalement sous 48 h.

7. **Garanties MRR** — Starter : **1 500 € MRR** min ou 5 attributions supplémentaires · Récurrent : **3 000 € MRR / mois** min ou 1 attribution reportée — conditions dans les CGV complètes.

8. **Rétractation** — **4 jours calendaires** post-souscription (politique commerciale B2B), remboursement intégral si exercée dans ce délai.

9. **Résiliation** — Récurrent **résiliable à tout moment** avec **préavis de 30 jours** · Pas de pénalité de résiliation.

10. **Données** — Traitement conforme **RGPD** · Politique de confidentialité : `[URL À CRÉER]`.

---

## Texte checkbox (UI)

```
☐ J'accepte les Conditions Générales de Vente de Hercule
  (version du 4 septembre 2026) et je confirme être un professionnel
  agissant dans le cadre de mon activité.
```

**Libellé lien :** « Lire les CGV complètes » → `[URL /cvg ou cvg_master.md publié]`

---

## Champs techniques (implémentation future)

À persister lors de l'acceptation (table `agence` / `profile` ou table dédiée `cvg_acceptances`) :

| Champ | Type | Description |
|-------|------|-------------|
| `cvg_version` | `text` | Ex. `2026-09-04` |
| `cvg_accepted_at` | `timestamptz` | Horodatage UTC |
| `cvg_accepted_ip` | `text` | IP du signataire (optionnel, consentement) |
| `cvg_accepted_by` | `text` | Email ou identifiant utilisateur |

**Validation backend :** refuser `POST /api/onboarding` si `cvg_accepted !== true` ou si `cvg_version` ≠ version courante.

---

## Renouvellements et offres post-RDV

| Contexte | Offre | Prix |
|----------|-------|------|
| Renouvellement cycle | 5 Attributions | **1 489 €** |
| Survey agence (decline upsell principal) | 3 Attributions | **898 €** (exclusive page survey) |

Détail : [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · CGV § 5.3.

---

*Ne pas dupliquer le corps juridique ici — renvoyer systématiquement vers [cvg_master.md](./cvg_master.md).*
