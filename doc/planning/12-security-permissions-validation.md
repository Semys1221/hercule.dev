# 12 — Sécurité et permissions

Les **problèmes de sécurité** sont séparés des améliorations d’architecture optionnelles.

`ENG-04` (fail-closed secrets cron/webhook) n’est **pas** une question : c’est un défaut à corriger à l’implémentation.

---

## PARTIE 1 — Ce qui est valide

- Service role **uniquement** serveur / Streamlit / scripts ; pas de client anon Supabase dans Next.
- RLS enabled + 0 policy = Data API publique **ne voit rien** (si la clé anon fuit, lectures vides — défense utile mais **insuffisante** si service role fuit).
- Webhooks Resend : Svix obligatoire si secret set ; 503 si `RESEND_WEBHOOK_SECRET` manquant.
- Calendly HMAC quand la clé est présente (fenêtre replay).
- Instantly skips métier en 200 (évite la désactivation du webhook).
- Survey spec = token, pas Clerk (`ENG-12`).
- Internal `robots: noindex`.
- HTML booking : secret faible = slug 6 chars (accepté pour tracking, pas pour données sensibles).
- Pages marketing sans PII.

---

## PARTIE 2 — Problèmes de sécurité (non optionnels)

| Problème | Evidence | Gravité | vs architecture |
|----------|----------|---------|-----------------|
| `/api/admin/*` sans auth | README internal + code | **High** | Politique **volontaire** — question SEC-01 |
| Cron ouvert si `CRON_SECRET` vide | `if (!cronSecret) return true` | **High** | `ENG-04` |
| Instantly WH ouvert si bearer vide | webhook-auth | **High** | `ENG-04` |
| Calendly WH sans vérif si signing key vide | calendly route | **High** | `ENG-04` |
| `.env.example` documente `ADMIN_SECRET` alors que le code session est **supprimé** | drift | Medium | CF-09 |
| Service role dans Streamlit Cloud | nécessaire au modèle actuel | Medium | rotation, least privilege plus tard |
| Pas de middleware | — | info | auth par route |
| GA ID hardcodé | public by design | Low | — |
| Funnel/FAQ PUT sans auth = écriture **filesystem** du déploiement | `/api/admin/funnels` | **High** si URL leak | SEC-01 |

Ce n’est **pas** « on ajoutera Clerk plus tard » : SEC-01 tranche la politique **internal**.

#### [SEC-01] L’espace `/internal` et les APIs `/api/admin/*` doivent-ils rester **sans authentification applicative**, comme l’écrit [app/internal/README.md](../../app/internal/README.md) ?

L’intention documentée est : pas de login, isolation par déploiement. Le risque : quiconque atteint l’URL crée des leads, réécrit FAQ/pricing/funnels, patche le carousel.

- [ ] **A (recommandé)** — Non : ajouter une auth réelle (mot de passe partagé / SSO / Bearer ops) **au moins sur les mutations**. L’intention « pas de théâtre de login client » reste ; ce n’est pas un portail agence.
- [ ] **B** — Oui : préserver zéro auth app ; URL non publique + noindex suffisent (politique actuelle).
- [ ] **C** — Auth seulement hors production locale ; production protégée par SSO Vercel / firewall, toujours pas de login in-app.

**Impact si l’architecture change :** High  
**Domaines affectés :** `/internal`, toutes les APIs admin, `.env`  
**Conflit :** CF-09, CF-02  
**Note :** choisir B n’annule pas `ENG-04` (crons/webhooks).

#### [SEC-02] Les pages de tracking publiques (reservation / confirm) doivent-elles continuer à n’exiger que le **slug** (et email au confirm), sans compte client ?

C’est le modèle CRM actuel et la spec survey (token). Un login client changerait FND-03.

- [ ] **A (recommandé)** — Oui : capability URLs (slug / token survey) ; pas de comptes clients au MVP.
- [ ] **B** — Introduire un login client (Clerk ou autre) pour suivi + survey.
- [ ] **C** — Slug pour le booking acquisition seulement ; le suivi produit exigera un login.

**Impact si l’architecture change :** High si B  
**Domaines affectés :** Surfaces, Clerk, tokens  
**Ancien ID :** V-17

---

## Frontières client / serveur (actuel)

| Donnée | Où | OK ? |
|--------|-----|------|
| Service role | server only | oui |
| Instantly API key | server / Streamlit | oui si pas NEXT_PUBLIC |
| Slug | URL publique | voulu |
| Funnel JSON | writable via API admin | **non OK** si SEC-01 B et URL leak |
| PII leads | jamais dans le bundle marketing | oui |

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| SEC-01 | | |
| SEC-02 | | |
