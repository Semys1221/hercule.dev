# Plan Landing Hercule — Options texte & composants

> **Source :** [sop-commercial.md](sop-commercial.md) (brouillon contrat.md)  
> **Instructions :** cocher `[x]` une option texte + une option composant par section.  
> **Recommandation ★ :** options alignées contrat.md — utilisées pour l'implémentation brouillon initiale.

---

## Section 1 — Navbar & Brand

### Texte proposé
- [x] ★ **Option 1 :** Marque **Hercule** · liens Méthode · Pricing · Garanties · Contact · CTA « Réserver un appel »
- [ ] **Option 2 :** Marque **Django Pipeline** · liens Comment ça marche · Pricing · Contact
- [ ] **Option 3 :** Marque **Henri Fridzi** · liens Matchmaking · Tarifs · Contact

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`navbar.tsx`](components/navbar.tsx) (rebrand + nav FR)
- [ ] **Option 2 :** Réécrire navbar + [`footer.tsx`](components/footer.tsx)
- [ ] **Option 3 :** Aucun changement

---

## Section 2 — Hero + Promesse

### Texte proposé
- [x] ★ **Option 1 (Tech/SaaS) :**  
  H1 : « L'Infrastructure Django : des rendez-vous qualifiés dans votre agenda, sans prospecter »  
  Sous-titre : 3–5 RDV/mois, budget validé de vive voix · sans engagement beta  
  CTA : Réserver un appel · secondaire : Voir comment ça marche
- [ ] **Option 2 (Matchmaking) :**  
  H1 : « Henri Fridzi — Matchmaking B2B exclusif pour agences web »  
  Sous-titre : Flux d'opportunités routées dans votre calendrier
- [ ] **Option 3 (Performance) :**  
  H1 : « 3 à 5 rendez-vous ultra-qualifiés par mois. Vous n'avez qu'à closer. »  
  Sous-titre : Moteur Django + Live Qualification humaine

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire hero dans [`hero-3d-stage.tsx`](components/hero-3d-stage.tsx)
- [ ] **Option 2 :** Option 1 + remplacer [`dashboard-mockup.tsx`](components/dashboard-mockup.tsx) par mockup pipeline
- [ ] **Option 3 :** Aucun changement

---

## Section 3 — Demo visuelle (mockup 3D)

### Texte proposé
- [x] ★ **Option 1 :** Dashboard **Pipeline Django** — signaux détectés → leads qualifiés → RDV calendrier
- [ ] **Option 2 :** Vue **Calendrier** rempli de RDV partenaires
- [ ] **Option 3 :** **Inbox** notifications projets routés

### Mise à jour composants
- [x] ★ **Option 1 :** Refondre [`dashboard-mockup.tsx`](components/dashboard-mockup.tsx) (remplacer PandaGuard)
- [ ] **Option 2 :** Nouveau composant `calendar-mockup.tsx`
- [ ] **Option 3 :** Aucun changement

---

## Section 4 — Stack / ICP (logo cloud)

### Texte proposé
- [x] ★ **Option 1 :** « Conçu pour les agences web modernes » · stacks Webflow, Shopify, WordPress, Figma
- [ ] **Option 2 :** « Propulsé par Python & Django » · logos tech backend
- [ ] **Option 3 :** Mix agences + Django + Calendly

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`logo-cloud.tsx`](components/logo-cloud.tsx)
- [ ] **Option 2 :** Garder structure, changer texte seulement
- [ ] **Option 3 :** Aucun changement

---

## Section 5 — Pain points (pourquoi Hercule)

### Texte proposé
- [x] ★ **Option 1 :** Titre « Le pipe commercial des agences web est cassé » · 3 cartes = 3 bottlenecks contrat.md
- [ ] **Option 2 :** Titre « Fini le scraping et les SDR low-cost » · focus échecs passés
- [ ] **Option 3 :** Titre positif « Concentrez-vous sur le delivery » · sans nommer douleurs

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`feature-cards-section.tsx`](components/feature-cards-section.tsx)
- [ ] **Option 2 :** Nouveau `pain-section.tsx`
- [ ] **Option 3 :** Aucun changement

---

## Section 6 — Méthodologie 3 étapes

### Texte proposé
- [x] ★ **Option 1 :** Capture → Filter → Deliver (libellés contrat.md §3)
- [ ] **Option 2 :** Détecter → Qualifier → Closer (vocabulaire agence)
- [ ] **Option 3 :** Timeline visuelle avec délais (signal → appel → RDV)

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`workflows-section.tsx`](components/workflows-section.tsx) (3 cartes fixes)
- [ ] **Option 2 :** Nouveau `methodology-section.tsx`
- [ ] **Option 3 :** Aucun changement

---

## Section 7 — Preuve / Démo tech

### Texte proposé
- [x] ★ **Option 1 :** « La preuve par le code » — démo live Django en 1 clic, zéro faux avis
- [ ] **Option 2 :** Option 1 + chiffre « 6 partenaires actifs »
- [ ] **Option 3 :** Témoignages partenaires (si disponibles)

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`ai-section.tsx`](components/ai-section.tsx) → contenu preuve Django
- [ ] **Option 2 :** Nouveau `proof-section.tsx`, retirer ai-section
- [ ] **Option 3 :** Aucun changement

---

## Section 8 — Pricing + Beta

### Texte proposé
- [x] ★ **Option 1 :** 250 €/mois + 149 €/RDV honoré · badge « 9 places beta restantes » · tarif fondateur bloqué à vie
- [ ] **Option 2 :** Option 1 + tier 750 €/mois full closing (pricing.md)
- [ ] **Option 3 :** ROI ×5 uniquement, prix sur appel

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`product-direction-section.tsx`](components/product-direction-section.tsx) → pricing
- [ ] **Option 2 :** Nouveau [`pricing-section.tsx`](components/pricing-section.tsx)
- [ ] **Option 3 :** Aucun changement

---

## Section 9 — Garanties

### Texte proposé
- [x] ★ **Option 1 :** Bloc dédié no-show — non facturé + remplacement immédiat
- [ ] **Option 2 :** Mention intégrée section pricing
- [ ] **Option 3 :** Mention footer + pricing seulement

### Mise à jour composants
- [x] ★ **Option 1 :** Intégrer dans section pricing (product-direction-section)
- [ ] **Option 2 :** Nouveau `guarantee-section.tsx`
- [ ] **Option 3 :** Aucun changement

---

## Section 10 — CTA final

### Texte proposé
- [x] ★ **Option 1 :** « Prêt à remplir votre agenda ? » · CTA Réserver · urgence 9/15 places
- [ ] **Option 2 :** « ROI ×5 dès le premier contrat signé » · CTA Réserver un appel
- [ ] **Option 3 :** Minimal « Contactez-nous »

### Mise à jour composants
- [x] ★ **Option 1 :** Réécrire [`cta-section.tsx`](components/cta-section.tsx)
- [ ] **Option 2 :** Option 1 + [`footer.tsx`](components/footer.tsx) liens légaux FR
- [ ] **Option 3 :** Aucun changement

---

## Sections à supprimer / retirer du flux

- [x] ★ Retirer contenu Sprint pur (Sprint MCP, Figma integration, product roadmap AI)
- [ ] Garder structure visuelle Sprint, texte Hercule uniquement

---

## Récap implémentation brouillon (★ cochées ci-dessus)

| Composant | Action |
|-----------|--------|
| `navbar.tsx` | Rebrand Hercule, nav FR |
| `hero-3d-stage.tsx` | Hero + CTAs contrat.md |
| `dashboard-mockup.tsx` | Pipeline Django |
| `logo-cloud.tsx` | Stacks agences |
| `feature-cards-section.tsx` | 3 bottlenecks |
| `workflows-section.tsx` | Méthodologie 3 étapes |
| `ai-section.tsx` | Preuve démo Django |
| `product-direction-section.tsx` | Pricing + garantie + beta |
| `cta-section.tsx` | CTA final |
| `footer.tsx` | Liens FR agence |

---

## Prochaine étape

Cocher les options souhaitées → confirmer → implémenter `components/`.

Si aucune modification : l'implémentation brouillon suit les options ★.
