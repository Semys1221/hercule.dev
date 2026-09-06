# 00 — Registre des décisions (architecture définitive)

```
status: canonical
audience: coding-agent
depends_on: ../../archive/planning/23-clarifications-post-validation.md
do_not:
  - Réinterpréter une case simplified si une clarification existe
  - Implémenter un ID REJECTED ou DEPRECATED
```

**Source :** `archive/planning/simplified_version/` (2026-09-06) + clarifications session.  
**Légende :** CONFIRMED · REJECTED · DEPRECATED · NEW · UNCHANGED · MIGRATION REQUIRED

Une ligne = une vérité. Si deux docs se disputent, **celle-ci gagne**.

---

## Clarifications qui écrasent une case

| ID | Case brute | Fait foi |
|----|------------|----------|
| FND-16 | B | **A** — paiement = événement, pas la machine livraison |
| FND-04 | C | Auto `IN_DELIVERANCE` **au PAID seulement**, pas à l’inscription |
| BIZ-06 | (vide) | 1 match à la fois ; pas d’898 ; **vente ne termine pas le pack** |
| FND-14 | C | **A** — historique `matches` ; unlink manuel |
| FND-09 | A + note reset | A **sans** reset dashboard |

---

## DEPRECATED (ne plus écrire, ne plus promettre)

- Machine `NOT_PAID → PAID → MEETING_1…10 → COMPLETED` comme `lead_statut`
- Offre **898 €** (3 RDV / 3 cycles)
- Two-price **~1 500 € entrée vs 1 489 € renouvellement**
- Rétractation commerciale **4 jours**
- Streamlit = **seul** cockpit d’écriture produit
- Table `communications`
- Facturation **149 € / RDV honoré** (ancien modèle)
- Dashboard agence **reset à 0** après une vente
- Promote délivrance **manuel** comme unique chemin (le clic admin peut rester en override, le happy path est auto-PAID)
- Fin de RDV livraison **automatique** via webhook Calendly « meeting ended »

---

## BIZ — intention métier

| ID | Choix | Tag | Sens pour le build |
|----|-------|-----|-------------------|
| BIZ-01 | B | CONFIRMED | Starter = RDV ; 2500 = closing Hercule **mais vitrine** |
| BIZ-02 | A | CONFIRMED | Attribution consommée au **RDV planifié** ; no-show entreprise = recrédit |
| BIZ-03 | A | CONFIRMED | Assignation exclusive ; carousel = vitrine |
| BIZ-04 | A | CONFIRMED | Paiement **avant** livraison active |
| BIZ-05 | A | CONFIRMED | Client : suivi + no-show + survey. Pas de self-serve paiement / catalogue |
| BIZ-06 | A* | CONFIRMED | 1 match ; pack **continue** après vente ; pas d’898 |
| BIZ-07 | D | CONFIRMED | 2500 = vitrine, pas vendu |
| BIZ-08 | A | CONFIRMED | Entreprise = contact ; rematch vers autre agence OK |
| BIZ-09 | A | CONFIRMED | Ops humain : qualif, match, confirmer paiement, no-show, garantie MRR |
| BIZ-10 | A | CONFIRMED | Pas de remboursement post-rétractation ; crédits perdus sauf RDV déjà planifiés |

---

## FND — fondations

| ID | Choix | Tag | Sens |
|----|-------|-----|------|
| FND-01 | A | CONFIRMED + MIGRATION REQUIRED | `product_statut` : ONBOARDED → … → SOLD. CRM `statut` reste acquisition |
| FND-02 | A | CONFIRMED | `/internal` = cockpit produit ; Streamlit temporaire outreach |
| FND-03 | A | CONFIRMED | Writes client = onboarding POST + survey token |
| FND-04 | C* | CONFIRMED | Auto délivrance **si PAID** |
| FND-05 | A | NEW + MIGRATION REQUIRED | Table `matches` + action Mettre en lien |
| FND-06 | A | CONFIRMED | SOLD = survey positif **du couple match** |
| FND-07 | A | CONFIRMED | Un oui clôt le **match**, pas le pack agence |
| FND-08 | A | MIGRATION REQUIRED | Entreprise refuse → `ARCHIVED` |
| FND-09 | A* | CONFIRMED | CTA renouvellement in-page **optionnel** |
| FND-10 | B | REJECTED | Pas d’898 |
| FND-11 | A | CONFIRMED | 2500 vitrine ; pas d’abo technique MVP |
| FND-12 | A | CONFIRMED | Les deux fiches `MEETING_BOOKED` (livraison) ; compteur RDV entreprise dérivé |
| FND-13 | A | CONFIRMED | Pas de remboursement auto |
| FND-14 | A | CONFIRMED | Historique matches |
| FND-15 | A | NEW | Admin ADVANCE_STEP / DELAY +7 j |
| FND-16 | A | CONFIRMED + NEW | Table `payments` ; PAS un 4e enum canonique |

---

## Données, orch, API, surfaces

| ID | Choix | Tag | Sens |
|----|-------|-----|------|
| DB-01 | A | MIGRATION REQUIRED | Deux champs : `statut` + `product_statut` |
| DB-02 | A | UNCHANGED + CONFIRMED | `profile` JSONB = config/UI/offres ; colonnes = identité/CRM/FK |
| SOT-01 | A | NEW + MIGRATION REQUIRED | Table `appointments` (livraison) ; compteur dérivé |
| SOT-02 | C | NEW | Stats Instantly persistées en base |
| SOT-03 | A | CONFIRMED | Délais produit dans `profile` ; délais vente en code |
| ORCH-01 | A | CONFIRMED | Fin RDV / no-show = admin ou client, pas auto Calendly |
| ORCH-02 | A | CONFIRMED | Deux familles email, même moteur `booking_email_jobs` |
| ORCH-03 | A | CONFIRMED | Stop nurturing **immédiat** au paiement |
| API-01 | B | CONFIRMED | `/api/admin/*` sans login (URL non publique) |
| SUR-01 | A | NEW | Suivi agence + entreprise (secret link) + survey |
| SUR-02 | A | CONFIRMED | Calendly vente ≠ Calendly livraison |
| SUR-03 | A | NEW | Book livraison → email agence + page suivi |
| UI-01 | C | CONFIRMED | Un kit UI (shadcn) y compris marketing |
| FUN-01 | B | NEW + MIGRATION REQUIRED | Funnels en CMS DB |
| FUN-02 | B | REJECTED | 898 hors MVP |
| EML-01 | A | NEW | Nouveaux `email_type` produit sur la file existante |
| EML-02 | A | NEW | Nurturing **plein tarif** si sales_call NOT_PAID |
| EML-03 | A | NEW | Entreprise succès : 1 email J+7, pas d’upsell |
| EML-04 | A | UNCHANGED | Copy Instantly dans Instantly / `archive/email_outreach_copy/` |
| EML-05 | A | NEW | Constantes CGV + tests ; pas de parseur markdown |
| CPY-01 | B | CONFIRMED | **1 489 €/mois** sans engagement **ou** **989×3 = 2 967 € / 15 attributions** |
| CPY-02 | A | CONFIRMED | Entreprise : « collaboration / démarrage », pas « onboarding » |
| CPY-03 | A | CONFIRMED | Site = `content/` ; contrat = `cvg_master.md` |
| CPY-04 | B | CONFIRMED | 989×3 réelle ; 2500 vitrine |
| SET-01 | A | NEW | Toggle global file 15 j — **plus tard** avec agenda client |
| SET-02 | A | UNCHANGED | Toggles ops (Instantly/IA) restent Streamlit pour l’instant |
| INT-01 | C | NEW + MIGRATION REQUIRED | Stripe Payment Link / Checkout + webhook ; **ops envoie le lien** |
| INT-02 | A | UNCHANGED | Instantly + AI reply = **ops**, hors modules livraison |
| INT-03 | A | UNCHANGED | Scraper hors `/internal` |
| SEC-01 | B | CONFIRMED | Zéro login `/internal` |
| SEC-02 | A | CONFIRMED | Pas de compte client ; slug / token |
| BND-01 | A | CONFIRMED | Canon = ce dossier `tech-stack/` |
| BND-02 | A | CONFIRMED | Data truth **avant** pages client, puis onboarding, puis matching |
| CAP-01 | A | CONFIRMED | C-01…C-06 restent la vérité volume/délais (adapter copy, pas les casser) |
| LEG-01 | A | CONFIRMED | Streamlit CRM/emails déprécié **après** parité Next |
| LEG-02 | A | CONFIRMED | Next envoie Instantly E1–E3 ; Streamlit lecture/config |
| LEG-03 | A | UNCHANGED | `BOOKING_GO_LIVE_AT` tant que des leads concernés existent |
| ADM-01 | A | CONFIRMED | `/internal` = édition live + docs + triggers |
| ADM-02 | A | NEW | Édition templates booking dans `/internal` |
| ADM-03 | A | NEW | Table RDV interne (no-show, RDV fait, renvoyer survey) |
| CVG-01 | A | CONFIRMED | Markdown `cvg_master.md` = SoT contrat |
| CVG-02 | A | CONFIRMED | Pricing/FAQ **dérivent** du contrat |
| SAL-01 | A | NEW + MIGRATION REQUIRED | `sales_calls` en Supabase ; domaine séparé |
| SAL-02 | A | CONFIRMED | Entreprise jamais payante |
| COMP-01 | A | CONFIRMED | `/internal/components` = vue du registre doc |
| COMP-02 | A | CONFIRMED | Catalogue blocs funnel **fermé** (code, pas UI) |

---

## ENG (déjà tranchés — ne pas reposer)

| ID | Tag | Sens |
|----|-----|------|
| ENG-01 | CONFIRMED | Pas de table `communications` |
| ENG-02 | CONFIRMED | Envoi email = TypeScript (`lib/booking-communication`) |
| ENG-03 | CONFIRMED | Service-role serveur seulement ; RLS deny-by-default anon |
| ENG-04 | MIGRATION REQUIRED | Fail-closed : cron/webhook sans secret → 401 |
| ENG-05 | UNCHANGED | Idempotency keys ; Instantly ACK HTTP 200 |
| ENG-06 | CONFIRMED | Transitions métier **serveur** ; React ne duplique pas |
| ENG-07 | CONFIRMED | Taxonomie doc (component/api/webhook/cron/job) sans nouveau runtime |
| ENG-08 | CONFIRMED | Soft FK `lead_id` jobs jusqu’à `appointments` ; ensuite FK livraison OK |
| ENG-09 | CONFIRMED | Ne pas supprimer Streamlit avant LEG-* |
| ENG-10 | CONFIRMED | Archive docs faite dans cette phase |
| ENG-11 | CONFIRMED | Primitives shadcn = partagées, pas documentées champ à champ |
| ENG-12 | CONFIRMED | Pas Clerk / n8n / Inngest |
| ENG-13 | UNCHANGED | cron-job.org (Hobby, pas de `crons` Vercel) |
| ENG-14 | UNCHANGED | Enum `BOOKED` = `MEETING_BOOKED` côté code |
| ENG-15 | CONFIRMED | Pas de `streamlit_funnels` |
| ENG-16 | NEW | Module constantes commerciales + tests |
| ENG-17 | CONFIRMED | Un kit UI ; sales-ops en base si in-scope (SAL-01 A) |

---

## CF — conflits résolus

| ID | Résolution |
|----|------------|
| CF-01 | DB-01 A + FND-01 A — deux champs, pas MEETING_n |
| CF-02 | FND-02 A + SEC-01 B — `/internal` writer, zéro login |
| CF-03 / CF-04 | INT-01 C + FND-03 A — Stripe ops-link, pas self-serve dashboard |
| CF-05 | SUR-01 A — suivi agence **et** entreprise |
| CF-06 | SOT-01 A — table `appointments` |
| CF-07 | FND-05 A — créer `matches` |
| CF-08 | CAP-01 A |
| CF-09 | SEC-01 B — pas d’ADMIN_SECRET / session |
| CF-10 | BND-01 A — ce dossier |
| CF-11 | LEG-02 A — Next envoie |
| CF-12 | ORCH-01 A + ADM-03 A |
| CF-13 | CVG-01 A + CVG-02 A |
| CF-14 | SAL-01 A + FND-16 A — PAID sur appel/paiement, pas `lead_statut` |
| CF-15 | ADM-01 A |

---

## Offres (chiffres à coder dans ENG-16)

| Offre | Statut | Chiffres |
|-------|--------|----------|
| Mensuel sans engagement | CONFIRMED / NEW | **1 489 € / mois** · SLA 3–4 RDV honorés/mois @ 30 inbox |
| Pack 3 mois | CONFIRMED / NEW | **989 € × 3 = 2 967 €** · **15 attributions** · jusqu’à **15 remplacements** si CA &lt; **4 500 €** / 3 mois |
| 2 500 € / mois | DEPRECATED commercial / vitrine copy | Pas de webhook abo, pas de vente réelle |
| 898 € | REJECTED | — |
| Rétractation 4 j | DEPRECATED | Retirée ; Activation = paiement + onboarding |
