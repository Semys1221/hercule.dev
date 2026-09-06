# 15 — Conflits entre documents (lecture seule)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · [../15-conflicts-validation.md](../15-conflicts-validation.md)  
> **Rien à cocher** — chaque conflit pointe vers la question qui le résout.

---

## Comment lire ce fichier

Deux docs (ou le code) **ne disent pas la même chose**. Ne pas trancher ici : répondre à la question indiquée dans le questionnaire simplifié correspondant.

| ID | En une phrase | Tu réponds via |
|----|---------------|----------------|
| **CF-01** | Trois listes de statuts différentes (tech-stack vs ancien doc vs base actuelle) | [FND-01](./01-foundations-validation.md) |
| **CF-02** | Streamlit seul writer vs `/internal` sans login vs ancienne session admin | [FND-02](./01-foundations-validation.md), [SEC-01](./12-security-permissions-validation.md) |
| **CF-03** | Le client peut-il payer seul (Stripe) ou seulement via admin ? | [FND-03](./01-foundations-validation.md), [INT-01](./11-integrations-validation.md) |
| **CF-04** | Paiement manuel vs lien Stripe dans un ancien doc | [INT-01](./11-integrations-validation.md) |
| **CF-05** | Suivi agence **et** entreprise vs entreprise sans dashboard | [SUR-01](./06-surfaces-validation.md) |
| **CF-06** | Un RDV vente vs plusieurs RDV livraison sur la même fiche | [SOT-01](./16-sources-and-events-validation.md) |
| **CF-07** | Table `matches` décrite mais absente du code | [FND-05](./01-foundations-validation.md) |
| **CF-08** | Ancien fichier VALIDATION vide vs règles capacity déjà cochées | [CAP-01](./17-capacity-sla-validation.md) |
| **CF-09** | `.env` parle d’un login admin ; le README dit sans login | [SEC-01](./12-security-permissions-validation.md) |
| **CF-10** | Trois arbres de documentation en parallèle | [BND-01](./14-implementation-boundaries-validation.md) |
| **CF-11** | Emails Instantly E1–E3 envoyés deux fois (Next + Streamlit) | [LEG-02](./18-legacy-ops-validation.md) |
| **CF-12** | Fin de RDV auto (webhook) vs no-show déclaré par le client 48 h | [ORCH-01](./04-orchestration-validation.md), [ADM-03](./19-internal-admin-validation.md) |
| **CF-13** | CGV en markdown vs souvenir JSON ; pricing du site en double | [CVG-01](./20-cvg-validation.md), [CVG-02](./20-cvg-validation.md) |
| **CF-14** | Statut « PAID sur l’appel » vs statut lead / livraison | [SAL-01](./21-sales-ops-validation.md), [FND-16](./01-foundations-validation.md) |
| **CF-15** | `/internal` = wiki vs cockpit ops avec boutons d’action | [ADM-01](./19-internal-admin-validation.md) |

**Détail source A / source B** → [../15-conflicts-validation.md](../15-conflicts-validation.md)
