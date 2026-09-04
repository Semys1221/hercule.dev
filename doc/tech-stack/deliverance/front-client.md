# Deliverance — Front client (React / Next.js)

> Module : [Deliverance](./README.md) · Lignes : [DB](./db.md) · [Front interne](./front-interne.md) · [Communication](./communication.md)  
> Contexte : [4 lignes](../01-four-lines-model.md) · [Capacity §4](../capacity/00-deliverables.md) · [Matching front client](../matching/front-client.md) · [Post-RDV front client](../post-rdv/front-client.md)

---

## 1. Intro (langage simple)

Page suivi type DHL, accessible **après onboarding** pour agence et entreprise. **Lecture seule** : le client regarde où en est sa recherche. Aucun bouton qui modifie quoi que ce soit.

En bas de page : une **FAQ** (questions différentes selon agence ou entreprise) et un **bloc support** texte-only (email + horaires).

---

## 2. Architecture développée (pour IA de coding)

### Routes (GET only)

- `/suivi/agence/[link]`
- `/suivi/entreprise/[link]`

### Fetch

```typescript
// Server Component ou useEffect — GET uniquement
const timeline = await fetch(`/api/deliverance/${category}/by-link/${link}`);
```

**Interdit** : `POST`, `PATCH`, boutons action admin, formulaires mutation.

Polling optionnel 60s (GET).

### Affichage (données API)

- Steps : API retourne labels depuis `profile.display.timeline`
- Date estimée : `estimated_completion_at`
- Compteurs capacity (agence, si `IN_DELIVERANCE`) : voir [capacity/00-deliverables.md §4](../capacity/00-deliverables.md)
- Aucune logique métier en React

---

## 3. Structure UI

Ordre vertical fixe sur `/suivi/[category]/[link]`. Page **read-only** (sauf renvoi vers `/survey/[token]` via lien reçu par email).

| # | Bloc | Détail |
|---|------|--------|
| 1 | **En-tête** | Logo Hercule, nom société (`profile.form.company`), badge catégorie (agence / entreprise) |
| 2 | **Timeline** | Steps depuis `profile.display.timeline` + `deliverance_step` ; compteurs capacity si `IN_DELIVERANCE` |
| 3 | **Bandeau d'état** (conditionnel) | Selon `statut` — voir tableau ci-dessous |
| 4 | **FAQ** | Accordion, ancre `#faq`, contenu filtré par `category` |
| 5 | **Support** | Bloc texte, ancre `#support`, **sans bouton ni lien CTA stylé** |
| 6 | **Footer minimal** | Lien CGV futur `/cvg` (cohérent avec [cvg_site-sync.md](../cvg_site-sync.md)) |

### Bandeau d'état (conditionnel)

| statut | Affichage |
|--------|-----------|
| `ONBOARDED` | Message attente activation admin |
| `IN_DELIVERANCE` | Timeline deliverance (pas de bandeau supplémentaire) |
| `MATCH_PROPOSED` | « Proposition reçue — consultez votre email pour réserver » ([matching/front-client.md](../matching/front-client.md)) |
| `MEETING_BOOKED` | RDV confirmé + date `scheduled_at` |

Booking match : via **lien Calendly dans l'email**, pas de bouton React sur la page suivi.

### UI patterns

- Accordion FAQ : [`components/ui/accordion.tsx`](../../../components/ui/accordion.tsx) (Radix)
- Palette dark `#09090B` — alignée sur [`components/agence/`](../../../components/agence/)
- Constante email support : `HERCULE_CONTACT_EMAIL` dans [`emails/constants.ts`](../../../emails/constants.ts)

---

## 4. FAQ agence & entreprise

Une seule section FAQ sur la page. Contenu **filtré par `category`** (`agence` | `entreprise`). Contenu statique côté front (constantes ou fichier dédié).

**Règles :**

- Pas de bouton d'action dans les réponses (sauf mention « consultez votre email »)
- Copy alignée CGV — no-show **14 jours ouvrés**, pas « sans délai » ([cvg_site-sync.md](../cvg_site-sync.md))
- Pas de widget Calendly interactif dans la FAQ

### Questions agence

| # | Question | Réponse |
|---|----------|---------|
| A1 | Où en est ma recherche de clients ? | Votre page de suivi affiche la progression de votre recherche étape par étape. Chaque jalon correspond à une phase du service Hercule (activation, qualification, proposition de mise en relation, rendez-vous planifiés). Les mises à jour par email suivent le calendrier défini lors de votre onboarding. |
| A2 | D'où viennent les demandes clients ? | Hercule détecte en continu des signaux d'intention sur plus de 1 000 sites : recrutements, développements, changements d'activité, etc. Les entreprises sont qualifiées par Hercule (besoin, budget, attentes). Une fois confirmées, les demandes rejoignent notre réseau et sont proposées à l'agence la plus compatible. |
| A3 | Comment Hercule choisit-il les attributions ? | Hercule évalue la compatibilité client-agence sur cinq critères : prestations, secteur d'excellence, taille, tarifs et positionnement. Objectif : aligner budget, structure et mode d'accompagnement. |
| A4 | Que se passe-t-il quand une entreprise me est proposée ? | Votre statut passe en « proposition de match ». Vous recevez un email avec les informations de l'entreprise. La réservation du rendez-vous se fait via le lien Calendly dans cet email — pas depuis cette page. |
| A5 | Combien coûte Hercule ? | Starter : 1 489 € pour 5 attributions qualifiées. Growth : 2 500 €/mois pour jusqu'à 4 nouveaux clients signés par mois. 0 % de commission sur vos ventes. Détail : [cvg_master.md §5](../cvg_master.md). |
| A6 | Ai-je un délai de rétractation ? | Oui. Après souscription, vous disposez d'un délai de 4 jours calendaires pour vous rétracter. Détail : [cvg_master.md §8](../cvg_master.md). |
| A7 | Comment fonctionnent les emails Hercule ? | Hercule utilise plusieurs adresses et domaines dédiés à ses différentes communications. Le domaine principal de la société et de la plateforme est hercule.dev. |
| A8 | Mon prospect ne s'est pas présenté (no-show) | L'attribution n'est pas consommée. Un rendez-vous de remplacement est planifié sous 14 jours ouvrés. Détail : [cvg_master.md §10](../cvg_master.md). |

### Questions entreprise

| # | Question | Réponse |
|---|----------|---------|
| E1 | Ce service est-il vraiment gratuit ? | Oui. La qualification de votre besoin et la mise en relation avec une agence adaptée sont gratuites pour vous. Les agences partenaires financent l'accès au service de matching et à la qualification Hercule. |
| E2 | Comment Hercule sélectionne-t-il mon agence ? | Hercule évalue la compatibilité entre votre besoin et le profil des agences partenaires : prestations, secteur, taille, tarifs et positionnement. Votre projet est d'abord qualifié par téléphone avant toute proposition. |
| E3 | Où en est ma recherche d'agence ? | Votre page de suivi affiche la progression de votre recherche étape par étape. Les mises à jour par email suivent le calendrier défini lors de votre inscription (`profile.communication.delays`). |
| E4 | Comment réserver un RDV avec l'agence proposée ? | Lorsqu'une agence compatible vous est proposée, vous recevez un email avec un lien Calendly pour choisir un créneau. La réservation se fait depuis cet email — pas depuis cette page. |
| E5 | Dois-je payer une commission à Hercule ? | Non. Hercule ne facture jamais les entreprises. Il n'y a aucun upsell commercial après la mise en relation. Détail : [00-overview.md](../00-overview.md). |
| E6 | Puis-je continuer ma recherche si ça ne convient pas ? | Oui. Après votre rendez-vous, un questionnaire vous permet d'indiquer si vous souhaitez continuer la recherche. Détail : [post-rdv/front-client.md](../post-rdv/front-client.md). |
| E7 | Comment fonctionnent les emails Hercule ? | Hercule utilise plusieurs adresses et domaines dédiés à ses différentes communications. Le domaine principal de la société et de la plateforme est hercule.dev. |

---

## 5. Contact support

Placé **sous la FAQ**, dernier bloc avant le footer. **Identique** pour agence et entreprise.

### Copy

> **Une question ?**  
> Écrivez-nous à **contact@hercule.dev**. Si vous avez une question, répondez directement à l'un de nos emails — nous traitons les réponses **du lundi au samedi, entre 9 h et 12 h**.

### Contraintes UI

| Règle | Détail |
|-------|--------|
| Pas de bouton | Aucun `<button>`, `<a>` stylé CTA, ni widget Calendly |
| Email | `HERCULE_CONTACT_EMAIL` (`contact@hercule.dev`) — `mailto:` discret ou texte sélectionnable, sans style bouton |
| Horaires | **Lundi–samedi, 9 h–12 h** (pas le dimanche) |
| Mutation | Aucune — bloc 100 % statique |

---

## 6. Prompt d'action IA

```
Pages suivi deliverance — READ ONLY (doc/tech-stack/deliverance/front-client.md).

Routes :
- /suivi/agence/[link]
- /suivi/entreprise/[link]

Data :
- GET /api/deliverance/[category]/by-link/[slug] uniquement
- Composant DeliveranceTimeline dumb (steps, dates, bandeau statut)
- Compteur capacity agence si IN_DELIVERANCE (capacity/00-deliverables.md §4)

Layout (ordre vertical) :
1. Header (logo, company, badge category)
2. DeliveranceTimeline
3. StateBanner conditionnel (ONBOARDED / MATCH_PROPOSED / MEETING_BOOKED)
4. DeliveranceFaq — prop category: "agence" | "entreprise"
5. DeliveranceSupportBlock — texte statique, pas de bouton
6. Footer minimal (lien /cvg futur)

FAQ :
- Contenu statique filtré par category (voir §4 du doc)
- Accordion Radix (components/ui/accordion.tsx)
- Pas de bouton d'action dans les réponses

Support :
- Copy exact §5 du doc
- HERCULE_CONTACT_EMAIL depuis emails/constants.ts
- mailto: discret OK, pas de style CTA

Interdit :
- POST / PATCH côté client
- Boutons admin, embed Calendly interactif, formulaires mutation

Réutiliser : components/agence/ (style dark #09090B)

Cross-ref :
- MATCH_PROPOSED / MEETING_BOOKED → matching/front-client.md
- Survey post-RDV → lien email token, pas sur page suivi

Tests :
- pas de mutation network aside GET
- DB change → UI change au refresh
- FAQ visible avec bon set selon category
- support block sans bouton
- bandeau MATCH_PROPOSED sans bouton booking
```
