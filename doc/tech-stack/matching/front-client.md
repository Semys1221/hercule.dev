# Matching — Front client (React / Next.js)

> Module : [Matching](./README.md) · Lignes : [DB](./db.md) · [Front interne](./front-interne.md) · [Communication](./communication.md)

---

## 1. Intro (langage simple)

Quand statut = `MATCH_PROPOSED`, la page suivi (GET) montre « On vous a trouvé une agence » (ou inverse pour l'agence). **Read-only** — le booking se fait via le **lien Calendly dans l'email**, pas un bouton React.

---

## 2. Architecture développée (pour IA de coding)

### GET only

Extension page `/suivi/[category]/[link]` :

| statut | Affichage |
|--------|-----------|
| `IN_DELIVERANCE` | Timeline deliverance |
| `MATCH_PROPOSED` | Bandeau « Proposition reçue — consultez votre email pour réserver » |
| `MEETING_BOOKED` | RDV confirmé + date `scheduled_at` |

Données partenaire filtrées depuis `profile.match.partner_company` (set par API au link).

**Interdit** : bouton « Accepter match », embed Calendly interactif côté client (sauf si décision produit — par défaut email only pour simplicité).

---

## 3. Prompt d'action IA

```
UI matching client READ ONLY (doc/tech-stack/matching/front-client.md).

- Étendre GET suivi : états MATCH_PROPOSED, MEETING_BOOKED
- Afficher partner summary from profile.match (API filtered)
- Pas de POST ; Calendly via email uniquement

Tests : MATCH_PROPOSED → message email ; MEETING_BOOKED → date RDV visible
```
