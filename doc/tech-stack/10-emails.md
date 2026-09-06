# 10 — Emails (deux familles, un moteur)

```
status: canonical
audience: coding-agent
depends_on: 05-events.md, constants-commercial.md
decisions: EML-01 EML-02 EML-03 EML-04 EML-05 ORCH-02 ORCH-03 ENG-01 ENG-02 ENG-16
do_not:
  - Resend depuis Streamlit pour du travail nouveau
  - Nurturing à prix cassé / 898
  - Email auto « rachète 1489 » à SOLD
  - Upsell entreprise
  - Contredire les délais CGV
```

Moteur : `booking_email_jobs` + `booking_email_templates` + cron. Pas de table `communications`.

---

## Famille VENTE (live)

Types : `immediate`, `h48_confirm`, `h24_relance`, `h20_cancel`, `role_seq_48`, `role_seq_24`.  
Déclencheur : Calendly **vente**. Délais **en code**.

Copy Instantly : Instantly + `doc/email_outreach_copy/` (EML-04). Next envoie E1–E3 (LEG-02).

---

## Famille PRODUIT (NEW types)

Préfixe `product_*` / `nurture_*`.

| email_type | Quand | Stop |
|------------|-------|------|
| `product_onboarding_received` | POST onboarding | — |
| `product_deliverance_started` | PAID → IN_DELIVERANCE | — |
| `product_match_proposal` | Mettre en lien | match cancelled |
| `product_meeting_booked_agence` | Book livraison | — |
| `product_survey_invite` | RDV marqué fait | survey submitted |
| `product_entreprise_j7` | Match SOLD + J+7 | un seul ; wording CPY-02 |
| `nurture_fullprice_*` | `sales_calls.not_paid` | **immédiat** si paiement succeeded |

Nurturing = plein tarif 1 489 / 989×3. Pas d’étape 898.

Tests : sujets/corps **sans** `898`, `4 jours` de rétractation, `1500 €` d’entrée, `MEETING_10`.
