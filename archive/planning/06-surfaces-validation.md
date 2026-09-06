# 06 — Surfaces

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Quatre familles réelles : **marketing Next**, **HTML public booking**, **internal Next**, **Streamlit ops**. **Zéro** dashboard client agence/entreprise.

---

## PARTIE 1 — Ce qui est valide

| Surface | URL | Rôle | Auth |
|---------|-----|------|------|
| Landing agence | `/` | acquisition | public |
| Landing entreprise | `/entreprise` | acquisition (gratuit) | public |
| À propos, FAQ, CGV, légal | `/a-propos` `/faq` `/cvg` `/confidentialite` `/mentions-legales` | contenu | public |
| Réservation | `/reservation.html/:slug` (rewrite) | CRM book agence | secret = slug |
| Réservation entreprise | `/reservation-entreprise.html/:slug` | CRM book | slug |
| Confirm / temporary / post-booking | HTML public | CRM | slug + email |
| Internal hub | `/internal` | archi + funnels | **aucune** + noindex |
| Funnel builder | `/internal/funnels/...` | édition contenu | aucune |
| Inventaires | `/internal/components` `/internal/database` | doc vivante | aucune |
| Streamlit * | local / Streamlit Cloud | ops CRM | secrets env |

`robots: noindex` sur layout internal : valide pour le référencement, **pas** une auth.

---

## PARTIE 2 — Écarts

Tech-stack promet `/suivi/...` read-only. documentations_2 promet dashboard agence delivery **sans** dashboard entreprise. Code : rien.

#### [SUR-01] Quelles surfaces client faut-il construire dans le prochain palier produit ?

Sans ça on ne sait pas si `/suivi` entreprise existe.

- [x] **A (recommandé)** — Suivi **agence et entreprise** (tech-stack) + survey tokenisé ; marketing reste public. Pas de portail login (token / slug).
- [ ] **B** — Dashboard **agence seulement** (documentations_2) ; entreprise = emails + Calendly, pas d’app.
- [ ] **C** — Aucun dashboard client tant que matching n’existe pas ; seulement marketing + HTML booking.

**Impact si l’architecture change :** High  
**Domaines affectés :** App Router, tokens, emails liens, FND-03  
**Ancien ID :** V-25, CF-05

#### [SUR-02] Les pages HTML `public/*.html` restent-elles le front de **prise de RDV d’acquisition**, distinct d’un futur Calendly de matching ?

Réécrire ces pages en React sans décision mélangerait acquisition et délivrance (mêmes colonnes Calendly).

- [x] **A (recommandé)** — Oui : HTML (ou équivalent Next) = funnel Instantly → Calendly Hercule ; le matching aura **d’autres** URLs / event types.
- [ ] **B** — Unifier plus tard toutes les prises de RDV sur les mêmes pages / mêmes event types Calendly.
- [ ] **C** — Remplacer dès maintenant les HTML par des pages App Router, même comportement CRM.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** vercel.json rewrites, Instantly vars, Calendly event types

#### [SUR-03] Quand un RDV de matching est booké, l’agence est-elle informée **par email seulement**, ou aussi par un badge / étape sur son suivi in-app ?

La spec matching envoie `match_booking_confirm_agence` sans imposer de bump de timeline.

- [x] **A (recommandé)** — Email **et** mise à jour du suivi agence (étape / date / lien visio).
- [ ] **B** — Email seulement (spec minimale actuelle).
- [ ] **C** — In-app seulement, pas d’email de confirm agence.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Emails matching, dashboard agence  
**Ancien ID :** D-09, V-30

#### [UI-01] Quel **périmètre** pour le langage visuel unique (typographie, spacing, cards, tables, états — inspiré d’une UI type Grok, **sans** la cloner) ?

Aujourd’hui : shadcn + tokens (`app/globals.css`), marketing custom, HTML public, Streamlit thème défaut. Cohérence des primitives = `ENG` (pas de second kit, pas de thème Grok sur Streamlit). La question est **quelles surfaces** partagent le système.

- [ ] **A (recommandé)** — Un système de tokens / shadcn pour **internal + futur client** ; le marketing peut garder une mise en page distincte mais **les mêmes tokens**.
- [ ] **B** — Trois looks jusqu’à la fin de Streamlit (marketing / internal / Streamlit).
- [x] **C** — Restyler **tout** (y compris marketing et HTML booking) pour imiter le chrome Grok.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** `components/ui`, `/internal`, landings, SUR-02  
**Lié :** ADM-01, SUR-01

---

## Permissions / visibilité (actuel)

| Surface | Qui voit | Qui mute |
|---------|----------|----------|
| Marketing | tout Internet | CMS fichiers via /internal |
| HTML booking | possesseur du slug | click/confirm APIs |
| /internal | quiconque a l’URL | APIs admin |
| Streamlit | ops | service role |
| Client suivi | N/A | N/A |

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| SUR-01 | A | Suivi agence + entreprise + survey |
| SUR-02 | A | Calendly vente ≠ Calendly livraison |
| SUR-03 | A | Email + page suivi |
| UI-01 | C | Même langage visuel y compris marketing |
