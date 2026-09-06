# 11 — Intégrations

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Stripe, Clerk, n8n : **absents du code**. Ne pas les « brancher pour plus tard » sans question.

---

## PARTIE 1 — Ce qui est valide (live)

| Service | Pourquoi ça existe | Auth | Direction | Qualité |
|---------|-------------------|------|-----------|---------|
| Supabase | SoT | service role | bi | OK ; RLS sans policies |
| Calendly | booking acquisition | token + HMAC | in webhook, out API | OK pour created/canceled |
| Resend | emails booking | API + Svix | out send, in engagement | OK ; fail → job failed |
| Instantly | outreach + interest + replies | API + bearer webhook | bi | OK ; ACK 200 |
| xAI/Grok | décisions reply agent | GROK/XAI_API_KEY | out | ops |
| cron-job.org | scheduler Hobby | CRON_JOB_ORG_API_KEY | out register | ops |
| Vercel | host Next | projet | — | Analytics prod |
| GA | `G-GSVWNPPTM2` hardcodé | public | out | marketing |
| Outscraper | scraper leads | OUTSCRAPER_API_KEY | out | Streamlit |
| Pappers | enrichissement SIREN | PAPPERS_API_KEY | out | scraper optionnel |
| MyEmailVerifier | clean emails | MYEMAILVERIFIER_API_KEY | out | Streamlit clean |

Caching : availability Calendly côté API. Stats Instantly : fetch explicite, pas de cron stats.

---

## PARTIE 2 — Décisions produit

#### [INT-01] Le paiement agence au MVP est-il manuel (admin) ou Stripe (ou les deux selon l’offre) ?

V-38 = manuel. `sequence_client_not_paid` = Stripe. **Aucun** des deux n’est dans le code. Introduire Stripe change PCI, webhooks, idempotence.

- [ ] **A (recommandé)** — Manuel au MVP : l’admin confirme 1489 / 898 (et l’entrée ~1500) ; **pas** de Stripe tant que FND-11 C n’est pas choisi.
- [ ] **B** — Préserver « pas de paiement dans le code » (le plus proche du live) : même pas de route `payment-confirmed`.
- [x] **C** — Stripe (Payment Link ou Checkout) pour not-paid / upsell, avec webhook `payment_intent.succeeded` idempotent.

**Impact si l’architecture change :** High  
**Domaines affectés :** Post-RDV, onboarding, sécurité, jobs  
**Ancien ID :** V-38, D-12, CF-04  
**Lié :** FND-16 (comment PAID se connecte à l’onboarding / délivrance)

#### [INT-02] Instantly, le bypass subsequence et l’AI reply agent font-ils partie du **produit** Hercule (dashboards, docs d’archi) ou d’une **stack ops** séparée ?

Ils sont live et critiques pour l’acquisition, mais hors des 4 modules tech-stack.

- [x] **A (recommandé)** — Stack **ops** : documentée, maintenue, hors modules matching/délivrance ; le produit consomme les leads déjà `CONFIRMED` / payés.
- [ ] **B** — Tout est un seul produit : internal dashboard doit piloter Instantly/AI comme le matching.
- [ ] **C** — Sortir Instantly/AI du repo /internal à moyen terme (outil externe only).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Internal, Streamlit, doc, FND-02  
**Ancien ID :** D-08

#### [INT-03] Le scraper (Outscraper / Pappers) et le cleaner (MyEmailVerifier) restent-ils des outils Streamlit hors plateforme Next ?

- [x] **A (recommandé)** — Oui : hors `/internal` Next ; pas d’API Next pour scraper.
- [ ] **B** — Les migrer dans `/internal` comme le funnel builder.
- [ ] **C** — Les abandonner / remplacer (autre fournisseur).

**Impact si l’architecture change :** Low–Medium  
**Domaines affectés :** Streamlit, env, LEG

---

## Fiches d’intégration

### Supabase

- **Où :** `lib/link-tracking/supabase.ts`, `lib/instantly-bypass/supabase.ts`, `lib/ai-reply-agent/supabase.ts`, Python `crm/supabase_repo.py`, Streamlit repos
- **Pourquoi :** vérité leads / jobs / ops
- **Auth :** `SUPABASE_SERVICE_ROLE_KEY` + URL
- **Webhooks :** optionnel `supabase-link-tracking`
- **Cron :** poll jobs
- **DB :** toutes les tables app
- **Échec :** throw ; pas de queue outbox
- **Idempotence :** upserts clés
- **Cache :** non métier
- **Actuel vs visé :** CRM built ; matching spec

### Calendly

- **Où :** `lib/calendly.ts`, webhook, availability, meeting-links, `crm/calendly_client.py`
- **Pourquoi :** book / cancel / liens visio
- **Auth :** `CALENDLY_API_TOKEN` ; webhook `CALENDLY_WEBHOOK_SIGNING_KEY` (180s replay)
- **Flow :** HTML → Calendly ; webhook → DB
- **DB :** colonnes calendly_* + jobs
- **Échec :** skip signature si clé vide ; cron retry unsynced links
- **Visé :** matching + fin RDV (non built)

### Resend

- **Où :** `lib/resend.ts`, `send.ts`, webhook, Streamlit booking
- **From :** `BOOKING_RESEND_FROM` / `RESEND_FROM`
- **Idempotence :** Resend `idempotencyKey` = job key
- **Visé :** séquences produit (non built)

### Instantly

- **Où :** `lib/instantly.ts`, bypass, link-tracking instantly, AI send, Python clients
- **Webhooks :** interested + reply
- **429 :** 5 retries Retry-After
- **Visé :** inchangé ops si INT-02 = A

### Stripe / Clerk / n8n

Non implémentés. Clerk mentionné seulement pour « pas d’auth survey » (token). n8n : zéro référence repo.

### Autres

Grok : `lib/ai-reply-agent/grok.ts`. GA composant `components/google-analytics.tsx`. Vercel Analytics `app/layout.tsx` prod only.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| INT-01 | C | Stripe lien/checkout + webhook ; ops envoie le lien |
| INT-02 | A | Instantly/IA = outils ops hors livraison |
| INT-03 | A | Scraper hors Next |
