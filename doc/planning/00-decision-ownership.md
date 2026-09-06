# Propriété des décisions — Produit vs ingénierie

Ce fichier n’est **pas** un questionnaire. Il fixe qui décide quoi. Les `ENG-*` sont tranchés. Ne les recochez pas. Si une `ENG-*` viole une intention produit que vous n’aviez pas exprimée, signalez-le en commentaire sous la décision concernée — ce n’est pas une question A/B/C.

## Règle

| Appartient au product owner | Appartient à l’ingénierie |
|-----------------------------|---------------------------|
| Intention métier (`BIZ-*`) : ce que le produit et l’ops doivent faire | Traduction en architecture, schéma, routes |
| Qui paie, qui ne paie pas | Gestion d’erreur, retries, idempotence |
| Ce qu’agence / entreprise voient | Shadcn vs HTML brut, Server vs Client Components |
| Règles commerciales (1489, 898, nurturing, upsell) | Routes API vs Server Actions |
| Quelles surfaces existent | Vérification de signature webhook |
| Quelle machine d’état est canonique | Isolation des clients externes dans `lib/*` |
| Streamlit vs Next comme cockpit ops | Index, contraintes, pas de table `communications` |
| Paiement manuel vs Stripe | Secrets fail-closed, service role serveur |
| Auth applicative de `/internal` | Granularité des inventaires, docs en français |
| Promesses SLA / CGV | Ne pas inventer une table `appointments` tant que le produit ne l’a pas choisi |
| `/internal` = ops (édition / docs / triggers) | Ne pas ressusciter `streamlit_funnels` (`ENG-15`) |
| SoT contrat CGV | Pas de parseur markdown runtime (`ENG-16`) |
| Sales-ops in-scope ; langage visuel | Persist en Supabase si oui ; un kit UI (`ENG-17`) |

Une exigence métier **incohérente, incomplète ou techniquement risquée** est posée en question de validation. Elle n’est pas réécrite « pour faire plus propre ».

Les `BIZ-*` ([22-business-intent-validation.md](./22-business-intent-validation.md)) sont le **sas produit** : à cocher **avant** les `FND-*`. L’ingénierie n’invente pas l’offre, l’unité livrée, ni le rôle du client dans le logiciel. Si une `FND-*` contredit un `BIZ-*` déjà coché, l’architecture définitive s’arrête.

## Décisions d’ingénierie (ENG) — déjà tranchées

### ENG-01 — Pas de table `communications`

`booking_email_jobs` (quand) + `booking_email_templates` (quoi) + `profile` (délais / variables) suffisent. Une 6ᵉ table dupliquerait la config. Ancien **V-05**.

### ENG-02 — Orchestration email en TypeScript

[`lib/booking-communication/orchestrator.ts`](../../lib/booking-communication/orchestrator.ts) est le chemin d’envoi. Streamlit ne doit pas appeler Resend en direct pour le travail nouveau. Ancien **V-18**.

### ENG-03 — Supabase service-role côté serveur uniquement

Pas de `SUPABASE_SERVICE_ROLE_KEY` exposée au navigateur. Pas de client anon dans l’app. RLS sans policies = deny-by-default pour `anon` / `authenticated`. Ancien **V-03** (la partie « vérité en base », pas le schéma produit).

### ENG-04 — Fail-closed sur les secrets d’orchestration

Aujourd’hui, si `CRON_SECRET` est vide les crons sont ouverts ; si la clé Calendly est vide la signature est ignorée ; si le bearer Instantly est vide le webhook est ouvert. En production ces routes **doivent rejeter**. Ce n’est pas une question produit.

### ENG-05 — Idempotence des jobs et ACK Instantly HTTP 200

Les `idempotency_key` des jobs booking / bypass restent. Les skips métier Instantly restent en HTTP 200 (Instantly désactive le webhook après des non-2xx répétés).

### ENG-06 — Règles métier côté serveur

Le frontend consomme l’état serveur. Pas de duplication des transitions de statut dans React.

### ENG-07 — Taxonomie technique dans la doc, pas un nouveau runtime

Chaque implémentation est classée : composant, route API, server action (aucune aujourd’hui), webhook, cron, job, service, trigger DB, appel API externe, événement métier, workflow, séquence email, action UI. Le registry actuel (5 kinds) est trop pauvre ; la doc utilise la taxonomie complète **sans** changer le code dans cette phase.

### ENG-08 — Soft FK `booking_email_jobs.lead_id`

Pas de FK SQL tant que le produit n’a pas choisi matching / appointments. Ne pas inventer `matches` ou `appointments` « pour la propreté ».

### ENG-09 — Ne pas supprimer Streamlit / tables CRM sur apparence

Aucune suppression tant que les références ne sont pas vérifiées **et** que les questions `LEG-*` / `FND-*` sont répondues.

### ENG-10 — Archivage des docs contradictoires après validation seulement

Cette phase crée `doc/planning/` et marque l’ancien questionnaire comme remplacé. La réécriture de `doc/tech-stack/` attend vos réponses.

### ENG-11 — Composants documentés = surfaces de domaine

Les primitives Shadcn (`components/ui/*`) sont listées comme partagées, pas documentées champ par champ.

### ENG-12 — Pas de Clerk / n8n / Inngest introduits silencieusement

Absents du code. Les introduire serait un choix produit (auth client) ou d’infra (moteur de workflow). Le moteur actuel = webhook + table job + cron.

### ENG-13 — cron-job.org tant que le projet Vercel n’a pas de crons natives

[`vercel.json`](../../vercel.json) n’a pas de clé `crons` (Hobby). Garder cron-job.org jusqu’à un changement de plan — décision d’infra, pas produit.

### ENG-14 — Enum `BOOKED` traité comme `MEETING_BOOKED`

Le code le fait déjà (`isMeetingBookedStatus`). Nettoyage d’enum = migration technique ultérieure, pas un choix métier.

### ENG-15 — Ne pas ressusciter `app/streamlit_funnels`

Le dossier est **absent** ; le builder Next réutilise déjà l’arbre de nav. Toute nouvelle édition funnel / FAQ / pricing / légal va dans `/internal` (selon ADM-*). Ne pas remettre la CGV dans `funnel.json`.

### ENG-16 — Constantes commerciales + tests, pas un parseur markdown CGV

Si EML-05 / CVG-02 l’exigent : un petit module de constantes (montants, délais de garantie, 14 j, 48 h no-show) + tests de non-divergence. **Ne pas** parser `cvg_master.md` au runtime. Le markdown reste le contrat lisible (CVG-01 A) ; le code ne le « comprend » pas.

### ENG-17 — Un kit UI ; sales-ops en base si in-scope

Pas de second design system. Ne pas « Grok-thémer » Streamlit. Tokens / shadcn existants (`app/globals.css`, `components/ui`) = extension, pas un clone chrome. Si [SAL-01](./21-sales-ops-validation.md) = A : persister appels / notes / issues en **Supabase** (métriques dérivées) — pas un JSON sur laptop. Mapping sales-call ↔ Calendly = jointure produit, pas un second calendrier.

## Ce que l’ancien VALIDATION.md mélangeait

[`doc/tech-stack/VALIDATION.md`](../tech-stack/VALIDATION.md) posait 55 questions Oui / Non / Partiel, **non remplies** sauf C-01–C-06 (capacity, pré-cochés).

Beaucoup de `V-*` étaient de la confirmation de doc, pas un choix d’architecture. Celles qui sont de l’ingénierie deviennent `ENG-*`. Celles qui restent produit sont réécrites ici (A/B/C). Mapping : [00-index.md](./00-index.md).

## Comment signaler un désaccord sur une ENG

Sous la décision : une phrase « Intention produit : … ». L’agent traitera cela comme une **nouvelle question de validation**, pas comme un override silencieux.
