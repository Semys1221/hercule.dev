# 09 — Copywriting

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Copy ≠ workflow. Ici : textes business-facing, pas les CHECK SQL.

---

## PARTIE 1 — Ce qui est valide

| Zone | SoT actuelle | Notes |
|------|----------------|-------|
| CGV | `doc/tech-stack/cvg_master.md` | B2B, SLA, no-show 14 j ouvrés, rétractation 4 j |
| Mentions / confidentialité | `doc/tech-stack/` + pages `/cvg` `/confidentialite` `/mentions-legales` | |
| Landing agence | `components/agence/*` | aligné cvg_site-sync (no-show wording) |
| Landing entreprise | `components/entreprise/*` | gratuit, matching |
| FAQ site | `content/faq` / `lib/site/faq.ts` + éditeur internal | vérifier vs markdown tech-stack |
| Pricing site | `content/pricing` / `doc/sop/pricing.md` | deux chemins possibles |
| Booking emails | `booking_email_templates` + `emails/` React Email | HTML vs text |
| Bypass Instantly | tables templates | E1–E3, no-show |
| AI prompts | `app/streamlit_reply_agent/prompts/*.md` | par niche buyer/seller |
| Outreach | `doc/email_outreach_copy/{Formation,comptable,conseil_financier,nettoyage,renovation,transport}` | campagnes |
| Timeline profile | labels dans `buildDefaultProfile()` | 4 steps agence / entreprise |

Terminologie **alignée CGV** à préserver : Attribution (pas « signature garantie »), no-show 14 jours ouvrés, pack Starter vs rythme 3–4/mois.

---

## PARTIE 2 — Conflits de copy / termes

| Sujet | Variantes | Risque |
|-------|-----------|--------|
| Prix entrée | ~1 500 € vs 1 489 € renouvellement vs 898 vs 998 (3 mois, sequence_not_paid) vs 2 500 €/mois | templates faux montant |
| 898 € | « 3 RDV » ambigu | FUN-02 |
| Onboarding J+7 | mot « onboarding » après match | confusion D-04 |
| Statuts UI | NOTBOOKED vs « recherche lancée » vs MEETING_n | dashboards |
| Pack 5 attributions vs 3–4 honorés/mois | cvg_site-sync dit harmonisé | à ne pas recasser |
| Placeholders SOP | `doc/sop/contrat.md` stub | obsolète |
| « Livraison DHL » timeline | spec deliverance | pas d’UI |
| Mockup demandes | `agence_demandes` titres | marketing vs réel matching |

#### [CPY-01] Faut-il conserver **deux** tarifs agence distincts (entrée ~1 500 € et renouvellement 1 489 €) dans toute la copy ?

- [ ] **A (recommandé)** — Oui : deux montants, templates et CTA séparés (entrée vs renew).
- [x] **B** — Harmoniser tout à **1 489 €**.
- [ ] **C** — Harmoniser tout à **1 500 €** (ou un autre montant unique à préciser).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Landing, CGV, emails, survey CTA  
**Ancien ID :** D-15

#### [CPY-02] Le mot « onboarding » dans l’email J+7 entreprise (après RDV + embarquement) doit-il rester ?

- [x] **A (recommandé)** — Remplacer par « collaboration / démarrage avec l’agence » (évite le choc avec l’onboarding formulaire).
- [ ] **B** — Garder « onboarding » tel que documenté.
- [ ] **C** — Wording neutre type « Comment s’est passé votre projet ? »

**Impact si l’architecture change :** Low  
**Domaines affectés :** Template `entreprise_onboarding_check_j7`  
**Ancien ID :** D-04

#### [CPY-03] Quelle SoT pour le copy **réutilisable** du site (FAQ, pricing, légal) : fichiers `content/` édités par `/internal`, ou markdown `doc/tech-stack` ?

Les deux existent ; les éditeurs internal écrivent plutôt `content/` / doc selon le composant.

- [x] **A (recommandé)** — Site public = `content/` (FAQ, pricing) ; CGV légales = `cvg_master.md` (pas d’édition légère qui diverges du contrat).
- [ ] **B** — Un seul arbre markdown `doc/` alimente le site et l’éditeur.
- [ ] **C** — CMS en base (nouvelle table).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Internal editors, pages légales, FAQ  
**Lié :** [CVG-01](./20-cvg-validation.md) / [CVG-02](./20-cvg-validation.md) — contrat vs copy marketing (ne pas reposer CPY-03)

#### [CPY-04] L’offre « 998 € / mois × 3 mois » de `sequence_client_not_paid` est-elle une offre réelle à documenter, ou un brouillon à ignorer ?

Elle n’existe ni en CGV ni en V-35 (898 one-shot).

- [ ] **A (recommandé)** — Ignorer / brouillon : **pas** dans le produit ; 898 one-shot + 1489 + 2500 CGV seulement.
- [x] **B** — C’est une offre produit à ajouter (préciser HT, durée).
- [ ] **C** — Remplace 898.

**Impact si l’architecture change :** High si B/C  
**Domaines affectés :** Pricing, CGV, Stripe, survey

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| CPY-01 | B | 1489/mois ou 989×3=2967 / 15 RDV |
| CPY-02 | A | Pas le mot onboarding côté entreprise |
| CPY-03 | A | content/ site ; cvg_master contrat |
| CPY-04 | B | Offre réelle 1489 + 989×3 ; 2500 vitrine |
