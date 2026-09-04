# Post-RDV — Front client (React / Next.js)

> Module : [Post-RDV](./README.md) · Lignes : [DB](./db.md) · [Front interne](./front-interne.md) · [Communication](./communication.md) · [Agence commercial](./agence-commercial.md)  
> Contexte : [4 lignes](../01-four-lines-model.md)

---

## 1. Intro (langage simple)

Même URL `/survey/[token]`, **deux expériences différentes** selon agence ou entreprise.

- **Entreprise** : embarqué oui/non → félicitations si oui. **Rien à payer.**
- **Agence** : vente oui/non → 1489€ ou 898€ exclusif sur la **même page**. Pas de redirect.

C'est la **2e exception** write client (avec onboarding).

---

## 2. Architecture développée (pour IA de coding)

### Route

`/survey/[token]` — wizard same-page (steps React state)

### Flow entreprise (read-only après submit sauf 1 POST)

1. GET token → `category=entreprise`
2. Question : « Avez-vous embarqué avec cette agence ? »
3. Si oui → écran félicitations (statique) — **fin contact commercial**
4. Si non → « Continuer la recherche ? » → POST `{ embarked, continue_search }`

### Flow agence — voir [agence-commercial.md](./agence-commercial.md)

1. GET token → init `discount_898_eligible` si true
2. Question : « **Avez-vous fait la vente ?** »
3. **Oui** → félicitations + CTA **1 489 €** recommencer (same page)
4. **Non** → offre **898 €** (3 RDV) badge « **Offre exclusive — cette page uniquement** »
5. Refus 898 → « Non merci » → POST `{ sale_made: false, offer_choice: 'decline' }` → message au revoir
6. Accept 898 ou 1489 → POST `{ sale_made, offer_choice: '898' | '1489' }` → instruction paiement

### UI rules

| Règle | Détail |
|-------|--------|
| 898 exclusive | Masquer offre si GET retourne `discount_898_eligible=false` |
| Same page | Pas de navigation externe entre steps — `useState step` |
| Token single-use | POST final marque `used_at` |
| Pas d'autres POST | Suivi pages restent GET only |

### POST body

```typescript
// Agence — peut nécessiter 2 POST (réponse vente + choix offre) ou 1 POST combiné
{ token, sale_made: boolean, offer_choice?: "1489" | "898" | "decline" }

// Entreprise
{ token, embarked: boolean, continue_search?: boolean }
```

---

## 3. Prompt d'action IA

```
Page survey /survey/[token] — 2 UX (doc/tech-stack/post-rdv/front-client.md).

Agence :
- Wizard same-page : sale_made → 1489 CTA ou 898 exclusive ou decline
- Badge "offre exclusive cette page" sur 898
- Hide 898 if discount_898_eligible=false

Entreprise :
- embarked question → congrats if yes (no upsell)
- continue_search if no

GET validate token ; POST token-guarded only.

Réutiliser : onboarding form patterns (RHF + Zod)

Tests :
- agence sale yes → 1489 CTA, no 898 after decline once
- entreprise embarked yes → congrats, no price UI
- expired token → error
```
