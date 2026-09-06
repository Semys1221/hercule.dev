# 09 — Surfaces

```
status: canonical
audience: coding-agent
depends_on: 06-components.md, 12-security.md
decisions: SUR-01 SUR-02 SUR-03 UI-01 SEC-02 FND-02 ADM-01
do_not:
  - Unifier les pages HTML vente avec le Calendly match
  - Pages client avant l’étape 2 du roadmap
  - Login client
```

UI : **un** langage shadcn, **y compris marketing** (UI-01 C).

---

## Live

| Surface | URL | Auth | Notes |
|---------|-----|------|-------|
| Marketing agence / entreprise | `/` `/entreprise` | public | |
| FAQ / CGV / légal | `/faq` `/cvg` … | public | CGV charge markdown |
| Réservation vente | `reservation.html/{slug}` etc. | slug | **Famille Calendly vente** |
| Internal | `/internal` | none + noindex | Builder funnels, wiki, registry |

HTML public vente : **garder** au MVP (SUR-02 A). Ne pas réécrire en Next « pour faire propre » avant parité.

---

## NEW

| Surface | URL | Auth | Étape |
|---------|-----|------|-------|
| Onboarding public | `/onboarding/agence` `/onboarding/entreprise` | public | 5 |
| Suivi agence | `/suivi/agence/[slug]` | slug | 9 |
| Suivi entreprise | `/suivi/entreprise/[slug]` | slug | 9 |
| Survey | `/survey/[token]` | token | 8 |
| Internal leads | `/internal/leads` | none | 4 |
| Internal RDV | `/internal/appointments` | none | 8 |
| Internal sales | `/internal/sales` | none | 10 |

Suivi agence : date RDV, lien visio, bouton no-show (BIZ-05).  
Book livraison → **email + MAJ page** (SUR-03).

Deuxième famille Calendly (event type distinct) pour le match. URLs HTML **séparées** ou query `kind=delivery` — ne pas réutiliser `utm_content` vente sans brancher l’event type.
