# 14 — Frontières d’implémentation

Après vos réponses : un plan définitif, **puis** infra `/internal`, **puis** un module à la fois. Pas tout en parallèle.

---

## PARTIE 1 — Ce qui est valide comme méthode

L’ordre imposé par le brief reste le bon :

1. Validation (ce package)
2. Architecture définitive + doc canonique
3. Infra dashboard interne (auth selon SEC-01, clients API, loading/error) **sans** workflows métier complets
4. Modules un par un + tests (happy, duplicate, invalid, external fail, partial, retry)
5. Vous testez ; on n’enchaîne pas sans feu vert

Règles d’implémentation déjà `ENG-*` : SoT unique, règles serveur, webhooks idempotents, pas de nouvelle archi silencieuse.

---

## PARTIE 2 — Périmètre

#### [BND-01] Après validation, quel arbre `/doc` est **canonique** pour les agents (les autres archivés) ?

Trois arbres actifs (CF-10) garantissent la dérive.

- [ ] **A (recommandé)** — `doc/tech-stack/` réécrit pour matcher vos réponses + le code ; `documentations_2` / `documentation_2` archivés (`doc/_archive/`) ; SOP commerciaux restent à part (`doc/sop/`).
- [ ] **B** — `documentations_2` devient canonique ; tech-stack archivé.
- [ ] **C** — Nouveau `doc/architecture/` uniquement ; tout le reste archive.

**Impact si l’architecture change :** High (pour les agents, pas le runtime)  
**Domaines affectés :** toute future implémentation  
**Conflit :** CF-10

#### [BND-02] Quel est le **premier module produit** à implémenter après l’infra `/internal` (une fois FND répondu) ?

Le tech-stack ordonnait onboarding → délivrance → matching → post-RDV. Le live est le CRM. Un mauvais premier module crée des statuts orphelins.

- [ ] **A (recommandé)** — Infra interne + **modèle de statuts / SoT** (DB-01, SOT-01) **avant** toute UI client ; puis onboarding (public ou admin selon FND-03) ; matching seulement si FND-05 ≠ B.
- [ ] **B** — D’abord parité Streamlit → Next (CRM links/templates) sans modules produit.
- [ ] **C** — D’abord dashboard client / MEETING_n (documentations_2), CRM inchangé.

**Impact si l’architecture change :** High  
**Domaines affectés :** roadmap, tests, FND

Hors MVP **sauf** si vous cochez le contraire ailleurs : Stripe (INT-01 C), abo 2500 (FND-11 C), Clerk (SEC-02 B), avis J+14 (EML-03 C), n8n, table communications, builder de séquences générique (ORCH-02 C).

---

## Tests exigés (rappel — pas une question)

Pour chaque workflow retenu : happy path, duplicate event, invalid, échec Calendly/Resend/Stripe/Instantly/Supabase, partial (DB ok email fail et inverse), retry sans double effet.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| BND-01 | | |
| BND-02 | | |
