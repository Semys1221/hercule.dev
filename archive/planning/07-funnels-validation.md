# 07 — Funnels

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Séparer **définition** (JSON / copy), **exécution** (code + DB), **séquence email**, **événement**, **état DB**.

Il y a **trois** familles appelées « funnel » dans le repo.

---

## PARTIE 1 — Ce qui est valide

### A. Funnel sales (filesystem) — built, incomplet

- SoT : `content/funnels/{audience}/{kind}/{stage}/{slug}/funnel.json`
- Builder : `/internal/funnels`
- APIs : `/api/admin/funnels*`
- Catalogs : `content/funnels/_system/{layouts,presets,design-tokens}`
- Un funnel exemple `agence/vente/discovery/my_funnel_1` : `status: published`, **`steps: []`**, `publicPath: /vente/agence/discovery` — **pas de route publique Next** correspondante.

Définition ≠ exécution publique. L’éditeur est réel ; le runtime visiteur n’existe pas.

### B. Funnel CRM acquisition — built

Entry : Instantly email → lien `reservation.html/{slug}` → click `CLICKED` → Calendly → `MEETING_BOOKED` → emails → confirm `CONFIRMED` / cancel / h20.

Audiences : agence (h20) vs entreprise (pas h20, pages post-booking).

Completion : CONFIRMED. Failure : CANCELLED. Retry : reschedule Calendly + jobs.

Ce n’est **pas** le matching agence↔entreprise.

### C. Funnel produit 4 modules — spec

Onboarding → délivrance → matching → post-RDV. Voir FND-*.

---

## PARTIE 2 — Écarts

#### [FUN-01] Le funnel sales (landing / wizard) doit-il rester une SoT **fichier** éditée dans `/internal`, sans runtime public tant que `steps` n’est pas branché à des pages ?

Aujourd’hui publish n’expose pas `/vente/agence/discovery`.

- [ ] **A (recommandé)** — Oui : fichiers = définition ; une page publique n’existe que lorsqu’on mappe explicitement `publicPath` → App Router (travail ultérieur, pas un second CMS).
- [x] **B** — Migrer les funnels sales en base Supabase (définition + runtime).
- [ ] **C** — Abandonner le builder ; landings = composants React figés (`components/agence`) seulement.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** `/internal/funnels`, `content/funnels`, marketing  
**Lié :** [COMP-02](./02-components-validation.md) (catalogue fermé — ne pas reposer FUN-01)

#### [FUN-02] « 898 € = 3 rendez-vous » signifie-t-il 3 **cycles de matching** (3 mises en lien) ou 3 **RDV Calendly** sur le dossier en cours ?

Ambiguïté D-11 ; bloque `payment-confirmed` et tout compteur.

- [ ] **A (recommandé)** — 3 cycles de matching complets (crédit de 3 mises en lien / 3 U4) après paiement 898.
- [x] **B** — Pas d’offre 898 (aligné FND-10 B) ; la question est sans objet au MVP.
- [ ] **C** — 3 RDV Calendly sur le match courant seulement, sans nouveau matching.

**Impact si l’architecture change :** High  
**Domaines affectés :** Paiement, compteurs, matching, copy  
**Ancien ID :** D-11

---

## Cartographie (à n’exécuter qu’après FND)

### CRM acquisition (réel)

| | Agence | Entreprise |
|--|--------|------------|
| Entry | Instantly + slug | Instantly + slug |
| Initial | NOTBOOKED | NOTBOOKED |
| Steps | click → book → h48/h24/h20 → confirm | click → book → h48/h24 → post-booking HTML |
| Exit OK | CONFIRMED | MEETING_BOOKED / séquence sans h20 |
| Exit fail | CANCELLED / h20 cancel event | CANCELLED |
| Emails | booking templates | booking templates |
| Pages | reservation.html, confirm, temporary | reservation-entreprise, post-booking |

### Produit matching (spec)

Entry : admin Mettre en lien. Audience : paire. État : MATCH_PROPOSED. Email Calendly entreprise. Book → MEETING_BOOKED. Fin RDV → survey. Branches survey : SOLD / continue / 898 / nurture.

### Produit not-paid (spec documentations_2)

NOT_PAID → CTA Activer → Stripe → PAID → dashboard. **Conflit** FND-03 / INT-01.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| FUN-01 | B | CMS funnels en base |
| FUN-02 | B | Pas d’898 |
