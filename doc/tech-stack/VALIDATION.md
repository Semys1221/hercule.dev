# Validation doc tech-stack Hercule

> Ce document synthétise toute la doc du dossier [`doc/tech-stack/`](./README.md) (26 fichiers).  
> **Mode d'emploi :** pour chaque question, **coche une seule case**. Recopie le libellé coché (ou l'ID question) dans la [Partie 3](#partie-3--réponses--à-remplir). L'IA mettra à jour la doc et le code selon tes réponses.  
> **Format :** chaque question résume une **décision** — ton intention (X), le choix technique documenté (Y), et son impact (H). Coche **Oui** si la doc reflète bien ce que tu veux. Coche **Non** ou **Partiellement** et décris en Partie 3 ce que tu voulais à la place — l'IA en déduira les changements doc/code.  
> *Ne coche qu'une case par question — si tu changes d'avis, décoche l'ancienne.*

---

## Partie 1 — Validation point par point

### A. Fondations

### V-01 — Scope : 4 modules produit

**Doc :** [00-overview.md](./00-overview.md) — onboarding → deliverance → matching → post-RDV.

**Intention :** Vous vouliez un produit matchmaking structuré en étapes claires, sans parcours parallèle à maintenir.

**Choix technique doc :** 4 modules séquentiels documentés — Onboarding, Deliverance, Matching, Post-RDV — chacun avec ses 4 lignes (DB, client, admin, comm).

**Impact :** Toute feature hors ces 4 blocs n'a pas de doc ni de statuts dédiés ; l'implémentation suit cet ordre strict.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-02 — Modèle des 4 lignes

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md).

**Intention :** Vous vouliez une architecture lisible où chaque responsabilité a sa place (base, client, admin, emails).

**Choix technique doc :** DB Supabase · Front client React · Front interne Streamlit · Communication Resend via jobs — avec tableau trigger/action par ligne.

**Impact :** Chaque feature doit s'assigner à une ligne ; pas de logique email Python, pas de write client hors exceptions.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-03 — Supabase = source de vérité unique

**Doc :** [00-overview.md](./00-overview.md) · [01-four-lines-model.md](./01-four-lines-model.md).

**Intention :** Vous vouliez que admin, agence et entreprise voient la même réalité — pas de désync entre écrans.

**Choix technique doc :** Une row Supabase par lead alimente les 3 progressions ; pas de cache métier séparé documenté.

**Impact :** Toute modification admin se reflète au prochain refresh client ; pas de « vérité locale » côté React.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-04 — Écritures admin via API Next.js

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) — Streamlit → `crm_api.post_json`.

**Intention :** Vous vouliez un seul point d'écriture contrôlé pour les actions service (match, promote, SOLD).

**Choix technique doc :** Streamlit appelle les routes API Next.js ; pas de write Supabase direct pour promote, match, paiement.

**Impact :** Toute logique métier vit en TypeScript côté API ; Streamlit reste un cockpit fin.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-05 — Pas de table `communications`

**Doc :** [02-data-model.md](./02-data-model.md) · [01-four-lines-model.md](./01-four-lines-model.md).

**Intention :** Vous vouliez éviter une table comms séparée — tout sur la fiche client.

**Choix technique doc :** Délais et variables email dans `profile` JSON ; planification dans `booking_email_jobs` ; corps dans `booking_email_templates`.

**Impact :** Pas de table `communications` ; historique d'envoi = rows jobs ; pas de requête cross-table comms.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### B. Données & statuts

### V-06 — Deux tables `agence` et `entreprise`

**Doc :** [02-data-model.md](./02-data-model.md).

**Intention :** Vous vouliez une base simple — une fiche par agence, une fiche par entreprise.

**Choix technique doc :** Tables `public.agence` et `public.entreprise` avec `statut`, `profile` JSONB, `link` slug.

**Impact :** Pas de table lead générique ; category = nom de table ; pas de polymorphisme SQL.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-07 — Table `matches` + FK lien

**Doc :** [matching/db.md](./matching/db.md) · [02-data-model.md](./02-data-model.md).

**Intention :** Vous vouliez tracer quel agence a été mise en lien avec quelle entreprise.

**Choix technique doc :** Admin « Mettre en lien » → INSERT `matches` + FK `matched_agence_id` / `matched_entreprise_id` sur les deux rows.

**Impact :** Historique des matchs conservé ; unlink = clear FK + éventuellement garder row `matches`.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-08 — Chaîne enum `lead_statut`

**Doc :** [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez des étapes produit explicites du formulaire jusqu'à la clôture.

**Choix technique doc :** `ONBOARDED` → `IN_DELIVERANCE` → `MATCH_PROPOSED` → `MEETING_BOOKED` → `POST_RDV_SURVEY` → `SOLD` (+ rollback entreprise → `IN_DELIVERANCE`).

**Impact :** Chaque transition = PATCH statut documenté ; pas d'état intermédiaire hors enum sans migration.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-09 — Queue `booking_email_jobs`

**Doc :** [02-data-model.md](./02-data-model.md) · cron `/api/cron/booking-emails`.

**Intention :** Vous vouliez des emails automatiques programmés, pas d'envoi manuel systématique.

**Choix technique doc :** `insertJob({ leadId, emailType, scheduledFor })` puis cron Resend via orchestrateur TypeScript.

**Impact :** Tous les envois datés passent par la queue ; pas d'appel Resend ad hoc hors jobs (sauf secours admin).

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-10 — Entreprise relance recherche après survey

**Doc :** [00-overview.md](./00-overview.md) · [post-rdv/db.md](./post-rdv/db.md).

**Intention :** Vous vouliez qu'une entreprise non embarquée puisse continuer à chercher une agence.

**Choix technique doc :** Si `survey.continue_search = true` → entreprise `statut → IN_DELIVERANCE` + unlink match.

**Impact :** Retour au module Deliverance ; agence peut rester en statut post-match selon doc ; pas de SOLD entreprise.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### C. Profile JSON

### V-11 — Colonne `profile` JSONB centrale

**Doc :** [02-profile-json.md](./02-profile-json.md).

**Intention :** Vous vouliez centraliser formulaire, délais, UI et offres — pas 20 colonnes SQL.

**Choix technique doc :** Tout vit dans `profile` : `form`, `communication.delays`, `display.timeline`, `survey.*`, `offers.*` (agence).

**Impact :** PATCH profile = seule source pour UI + emails + offres ; pas de colonnes redondantes documentées.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-12 — `buildDefaultProfile()` à l'onboarding

**Doc :** [02-profile-json.md](./02-profile-json.md).

**Intention :** Vous vouliez des defaults cohérents dès l'inscription (délais, timeline, match).

**Choix technique doc :** INSERT onboarding appelle `buildDefaultProfile(form, category)` — init `form`, `communication.delays`, `display.timeline`, `match.active_rdv=false` ; pas `offers` à ce stade.

**Impact :** Deliverance et emails calculent depuis profile dès J0 ; offers agence seulement à l'ouverture survey.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-13 — Champs survey distincts par category

**Doc :** [02-profile-json.md](./02-profile-json.md) · [post-rdv/db.md](./post-rdv/db.md).

**Intention :** Vous vouliez des questions et logiques différentes agence vs entreprise post-RDV.

**Choix technique doc :** Agence → `survey.sale_made`, `survey.offer_choice` ; Entreprise → `survey.embarked`, `survey.continue_search` — POST body Zod distinct.

**Impact :** Pas de champ survey générique ; evaluateMatchOutcome lit les bons champs par table.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-14 — `profile.offers` agence uniquement

**Doc :** [02-profile-json.md](./02-profile-json.md) · [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md).

**Intention :** Vous vouliez gérer l'offre 898€ et le nurturing côté agence seulement.

**Choix technique doc :** `offers.discount_898_eligible`, `discount_898_declined_at`, `nurturing_started_at` — init au GET survey agence, absent côté entreprise.

**Impact :** Entreprise SOLD n'a pas de champs offers ; nurturing jobs calculés depuis `nurturing_started_at` agence.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### D. Règles client / admin

### V-15 — Client read-only sauf 2 POST

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) · [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez que seul l'admin pilote le service — clients observateurs.

**Choix technique doc :** Client React = GET suivi + `POST /api/onboarding/[category]` + `POST /api/post-rdv/survey` — pas de boutons statut/match/mail.

**Impact :** Zéro mutation React hors ces 2 routes ; garde-fous API bloquent le reste.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-16 — Onboarding crée row `ONBOARDED`

**Doc :** [onboarding/db.md](./onboarding/db.md) · [onboarding/front-client.md](./onboarding/front-client.md).

**Intention :** Vous vouliez qu'une inscription crée immédiatement une fiche exploitable en admin.

**Choix technique doc :** `POST /api/onboarding/[category]` → INSERT avec `statut = ONBOARDED`, `profile` complet, `link` slug, `onboarding_completed_at` ; duplicate email → 409.

**Impact :** Fiche visible en admin filtre ONBOARDED ; pas encore en deliverance jusqu'au promote admin.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-17 — Survey tokenisé post-RDV

**Doc :** [post-rdv/db.md](./post-rdv/db.md) · [post-rdv/front-client.md](./post-rdv/front-client.md).

**Intention :** Vous vouliez un accès survey sécurisé reçu par email, sans login client.

**Choix technique doc :** Page `/survey/[token]` + `POST /api/post-rdv/survey` avec body différencié agence/entreprise.

**Impact :** Pas d'auth Clerk sur survey ; token = seule autorisation d'écriture post-onboarding.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-18 — Pas de Resend depuis Streamlit

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) — règles interdites.

**Intention :** Vous vouliez une seule stack email maintenable (TypeScript, pas Python).

**Choix technique doc :** Streamlit → API → `booking_email_jobs` → cron Resend ; interdit Streamlit → Resend direct.

**Impact :** Templates et orchestration centralisés en TS ; pas de divergence Python/Node sur les emails.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### E. Communication

### V-19 — Cron envoi emails

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) · [lib/booking-communication/orchestrator.ts](../../lib/booking-communication/orchestrator.ts).

**Intention :** Vous vouliez des envois fiables à la date prévue sans intervention manuelle.

**Choix technique doc :** Cron `/api/cron/booking-emails` → `listDueJobs()` → render template vars `profile.form.*` → Resend send.

**Impact :** Retard cron = retard emails ; idempotency recommandée sur jobs pour éviter doubles envois.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-20 — Délais depuis `profile.communication.delays`

**Doc :** [02-profile-json.md](./02-profile-json.md) · [deliverance/communication.md](./deliverance/communication.md).

**Intention :** Vous vouliez personnaliser les délais par fiche (ex. rétractation) sans redeploy.

**Choix technique doc :** Dates calculées depuis `base_match_days`, `retraction_days`, `search_start_offset_days` — pas hardcodées en React.

**Impact :** Changer un délai = PATCH profile ou form onboarding ; pas de constantes UI pour les dates d'envoi.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-21 — Offset rétractation 4 jours

**Doc :** [02-profile-json.md](./02-profile-json.md).

**Intention :** Vous vouliez respecter un délai de rétractation avant le premier email « recherche lancée ».

**Choix technique doc :** Si `profile.form.droit_retractation = true` → `retraction_days = 4`, `search_start_offset_days = 4` → premier job deliverance à J+4.

**Impact :** Timeline client peut afficher l'étape ; email part plus tard ; admin peut override via profile.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### F. Module Onboarding

### V-22 — Email confirmation immédiat

**Doc :** [onboarding/communication.md](./onboarding/communication.md).

**Intention :** Vous vouliez rassurer l'inscrit tout de suite après le formulaire.

**Choix technique doc :** Insert onboarding → job `onboarding_confirm`, `scheduled_for = NOW()`, vars `profile.form.*` + `suivi_url`.

**Impact :** 1 email immédiat ; template dans `booking_email_templates` ; pas de config email séparée.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-23 — Promote manuel admin → deliverance

**Doc :** [onboarding/front-interne.md](./onboarding/front-interne.md) — `POST /api/deliverance/promote`.

**Intention :** Vous vouliez lancer la recherche active seulement quand vous êtes prêt — pas auto à l'inscription.

**Choix technique doc :** Bouton Streamlit « Passer en délivrance » → `statut → IN_DELIVERANCE` + init séquence emails deliverance.

**Impact :** Fiches ONBOARDED restent en attente admin ; promote déclenche timeline + jobs datés.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-24 — Vue admin unifiée agence + entreprise

**Doc :** [onboarding/front-interne.md](./onboarding/front-interne.md) · [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez gérer agences et entreprises depuis un seul cockpit admin.

**Choix technique doc :** `list_all_leads()` — tableau consolidé avec colonne `category`, filtres statut, preview `profile.form`.

**Impact :** Pas d'écran Streamlit séparé par type ; même panel pour promote et actions suivantes.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### G. Module Deliverance

### V-25 — Timeline client GET-only

**Doc :** [deliverance/front-client.md](./deliverance/front-client.md) · [deliverance/README.md](./deliverance/README.md).

**Intention :** Vous vouliez un suivi type DHL rassurant — regarder, pas agir.

**Choix technique doc :** Pages suivi SSR/fetch GET ; rendu depuis `profile.display.timeline` + step actuel ; zéro bouton mutation.

**Impact :** Client ne peut pas avancer/retarder sa timeline ; seul admin via Streamlit.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-26 — Emails deliverance datés

**Doc :** [deliverance/communication.md](./deliverance/communication.md).

**Intention :** Vous vouliez tenir informés agence/entreprise pendant la recherche sans effort manuel.

**Choix technique doc :** Jobs `deliverance_search_started`, `deliverance_d7_update`, `deliverance_step_milestone` — dates depuis profile + promote.

**Impact :** Séquence auto post-promote ; annulation/reschedule jobs si admin delay/advance (selon implémentation).

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-27 — Admin advance / delay timeline

**Doc :** [deliverance/front-interne.md](./deliverance/front-interne.md).

**Intention :** Vous vouliez ajuster la timeline manuellement (avancer étape, retarder +7j).

**Choix technique doc :** Boutons Streamlit `ADVANCE_STEP`, `DELAY` → API Next.js ; preview agence + entreprise côte à côte.

**Impact :** Modifications admin only ; client voit la mise à jour au refresh ; pas de write client.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-28 — Email milestone à chaque step

**Doc :** [deliverance/communication.md](./deliverance/communication.md).

**Intention :** Vous vouliez notifier le client à chaque avance d'étape admin.

**Choix technique doc :** Chaque `ADVANCE_STEP` enqueue `deliverance_step_milestone` immédiat avec `step_label` depuis `profile.display.timeline`.

**Impact :** Plus de steps admin = plus d'emails ; pas de milestone si admin ne advance pas.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### H. Module Matching

### V-29 — Admin « Mettre en lien »

**Doc :** [matching/db.md](./matching/db.md) · [matching/front-interne.md](./matching/front-interne.md).

**Intention :** Vous vouliez déclencher le match manuellement quand agence + entreprise sont compatibles.

**Choix technique doc :** `POST /api/matching/link` → transaction INSERT `matches` + statut `MATCH_PROPOSED` + job `match_proposal_entreprise` (lien Calendly).

**Impact :** Entreprise reçoit email Calendly ; agence pas encore en RDV booké ; pas SOLD.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-30 — Webhook Calendly book RDV

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) · [matching/communication.md](./matching/communication.md).

**Intention :** Vous vouliez que le book Calendly mette à jour la base automatiquement.

**Choix technique doc :** `invitee.created` → entreprise `MEETING_BOOKED` ; agence `profile.match.active_rdv = true` (statut enum peut rester `MATCH_PROPOSED`) + emails `match_booking_confirm_*`.

**Impact :** Statuts miroir partiels possibles ; agence « tiré 1 » = flag JSON, pas nouveau statut.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-31 — Matching n'est pas terminal

**Doc :** [matching/README.md](./matching/README.md) · [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez qu'un match + RDV ne clôture pas le parcours — il reste le survey post-RDV.

**Choix technique doc :** `MATCH_PROPOSED` / `MEETING_BOOKED` → webhook fin RDV → `POST_RDV_SURVEY` — pas de SOLD direct après Calendly.

**Impact :** Survey obligatoire avant clôture ; pas de skip post-RDV documenté.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-32 — Fin RDV → survey tokens

**Doc :** [post-rdv/db.md](./post-rdv/db.md) · [01-four-lines-model.md](./01-four-lines-model.md).

**Intention :** Vous vouliez envoyer le survey automatiquement après le RDV match.

**Choix technique doc :** Webhook fin RDV → `POST_RDV_SURVEY` + génération tokens + jobs `post_rdv_survey_agence` / `post_rdv_survey_entreprise`.

**Impact :** Réutilisation `lib/link-tracking/book-lead.ts` ; pas de trigger manuel admin requis (sauf resend).

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### I. Module Post-RDV

### V-33 — Entreprise embarquée : fin du commercial

**Doc :** [post-rdv/README.md](./post-rdv/README.md) · [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez qu'une entreprise embarquée ne reçoive **aucun upsell** après le RDV.

**Choix technique doc :** `survey.embarked = true` → statut `SOLD` + enqueue `entreprise_onboarding_check_j7` à J+7.

**Impact :** Pas de `renewal_*`, pas d'email avis J+14, pas de relance commerciale auto — page félicitations + 1 email J+7 seulement.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-34 — Agence vente oui : CTA 1489€ in-page

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez proposer le renouvellement 1 489 € sur la page survey, pas par email auto.

**Choix technique doc :** `sale_made=true` → CTA 1489€ on `/survey/[token]` ; `survey.offer_choice = '1489'` ; pas de job `renewal_agence_1489` auto à SOLD.

**Impact :** Upsell visible uniquement in-page ; paiement via admin `payment-confirmed` ; pas d'email renewal automatique.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-35 — Agence vente non : offre 898€ page-only

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md).

**Intention :** Vous vouliez une offre de secours 898 € (3 RDV) exclusive à la page survey agence.

**Choix technique doc :** `sale_made=false` → affichage offre 898€ ; GET survey retourne `offers.discount_898_eligible` ; **jamais** d'email avec offre 898€.

**Impact :** Si l'agence ne revient pas sur la page, elle ne voit pas 898€ par mail ; offre = one-shot UI.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-36 — Refus 898€ : disparition permanente

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [02-profile-json.md](./02-profile-json.md).

**Intention :** Vous vouliez que l'offre 898 € disparaisse à jamais si l'agence dit « non merci ».

**Choix technique doc :** Clic decline → `discount_898_eligible = false`, `discount_898_declined_at = now()` permanent ; même token ne remonte plus l'offre.

**Impact :** Ensuite seul 1 489 € par nurturing email ; pas de seconde chance 898€ documentée.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-37 — Nurturing agence 60 jours

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez relancer les agences qui refusent tout, sans spam immédiat agressif.

**Choix technique doc :** Decline → `nurturing_started_at = now()` + jobs `nurture_agence_1489_j7`, `nurture_agence_conseil_j14`, `nurture_agence_weekly_1`…`_6` (~8 emails / 60j).

**Impact :** ~8 emails sur 2 mois ; annulation jobs si admin confirme paiement 1489€ ou 898€.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-38 — Paiement MVP sans Stripe

**Doc :** [post-rdv/front-interne.md](./post-rdv/front-interne.md) · [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md).

**Intention :** Vous vouliez valider les paiements offline au MVP — pas de checkout en ligne tout de suite.

**Choix technique doc :** CTA survey → instruction paiement ; admin `POST /api/post-rdv/admin/payment-confirmed` `{ amount: 1489 | 898 }` — pas de Stripe.

**Impact :** Charge opérationnelle manuelle ; puis `statut → ONBOARDED` nouveau cycle selon doc.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-39 — Abonnement 2 500 € — commercialisé, implémentation hors MVP

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [cvg_master.md](./cvg_master.md) § 5.2 · [00-overview.md](./00-overview.md).

**Intention :** L'offre **Hercule 2 500 €/mois** est active sur la landing et dans les CGV ; le **flux post-RDV / paiement récurrent** reste hors MVP (focus 1489€ / 898€).

**Choix technique doc :** Commercialisé (CGV + landing) — **pas de routes, templates, champs `profile` abo 2500€** au MVP.

**Impact :** Code et doc produit ne prévoient pas encore le parcours abo ; ajout = module post-MVP.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

### V-40 — Panel admin post-RDV

**Doc :** [post-rdv/front-interne.md](./post-rdv/front-interne.md).

**Intention :** Vous vouliez piloter les surveys, offres et paiements depuis Streamlit.

**Choix technique doc :** Filtres `POST_RDV_SURVEY` / `SOLD` ; colonnes `profile.survey.*`, `profile.offers.*` ; boutons `force-sold`, `payment-confirmed`, `resend-survey`.

**Impact :** Admin peut trancher désaccords, confirmer paiements offline, relancer surveys ; count jobs nurturing visible.

**Confirmez-vous ?**

- [ ] Oui — intention et impact confirmés, doc correcte
- [ ] Non — je voulais plutôt ___ (conséquence : ___ — préciser en Partie 3)
- [ ] Partiellement — doc OK sauf ___ (préciser en Partie 3)

---

## Partie 2 — Décisions ouvertes (implémentation)

### D-01 — Moment du statut `SOLD` vs paiement 1489€

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez clôturer le match quand l'agence confirme la vente.

**Choix technique doc :** `SOLD` dès `sale_made=true` (vente confirmée) ; upsell 1 489 € affiché in-page ensuite ; paiement admin séparé via `payment-confirmed`.

**Impact :** Mission « terminée » (SOLD) **avant** paiement renouvellement — pas de lien auto renouvellement à SOLD.

**Confirmez-vous ?**

- [ ] Oui — SOLD à la vente, upsell 1489€ = nouveau cycle séparé
- [ ] Non — je voulais SOLD seulement après `payment-confirmed` (conséquence : retarder statut SOLD — préciser en Partie 3)
- [ ] Partiellement — deux niveaux : statut intermédiaire match réussi puis SOLD après paiement (préciser en Partie 3)

---

### D-02 — Clôture match : une ou deux réponses survey ?

**Doc :** [post-rdv/db.md](./post-rdv/db.md) · logique `evaluateMatchOutcome`.

**Intention :** Vous vouliez fermer le dossier match quand le RDV a « réussi » côté produit.

**Choix technique doc :** Une réponse positive suffit — `embarked=true` (entreprise) **OU** `sale_made=true` (agence) → **les deux** rows passent SOLD.

**Impact :** Pas besoin d'attendre les deux surveys ; risque de clôture si une seule partie répond positivement.

**Confirmez-vous ?**

- [ ] Oui — une réponse positive clôt les deux fiches
- [ ] Non — je voulais attendre survey agence **et** entreprise (conséquence : bloquer SOLD jusqu'aux deux — préciser en Partie 3)
- [ ] Partiellement — admin tranche via `force-sold` si désaccord (préciser règle en Partie 3)

---

### D-03 — Entreprise non embarquée, ne veut pas relancer

**Doc :** [post-rdv/db.md](./post-rdv/db.md) · [00-overview.md](./00-overview.md).

**Intention :** Vous vouliez une sortie propre si l'entreprise abandonne après un RDV raté.

**Choix technique doc :** `embarked=false` + `continue_search=false` — doc ne définit pas clairement le statut terminal ni les emails (pas de nurturing entreprise).

**Impact :** Ambiguïté implémentation : rester `POST_RDV_SURVEY`, archiver, ou nouveau statut `CANCELLED` ?

**Confirmez-vous ?**

- [ ] Oui — statut terminal/archivé, plus d'emails auto (conséquence : ajouter statut si absent)
- [ ] Non — je voulais rester `POST_RDV_SURVEY` pour recontact admin manuel (conséquence : pas de statut terminal — préciser en Partie 3)
- [ ] Partiellement — autre statut ex. `CANCELLED` (préciser en Partie 3)

---

### D-04 — Wording email J+7 entreprise

**Doc :** [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez un check bienveillant J+7 après embarquement entreprise.

**Choix technique doc :** Template `entreprise_onboarding_check_j7` — copy « Votre onboarding s'est bien passé ? » (terme « onboarding »).

**Impact :** Entreprise a vécu match + RDV + embarquement — mot « onboarding » peut prêter à confusion côté copy.

**Confirmez-vous ?**

- [ ] Oui — garder « onboarding » tel que documenté
- [ ] Non — je voulais « collaboration avec l'agence » / « démarrage projet » (conséquence : renommer template + variables — préciser en Partie 3)
- [ ] Partiellement — wording neutre « Comment s'est passé votre projet ? » (préciser en Partie 3)

---

### D-05 — Statuts décalés agence vs entreprise post-Calendly

**Doc :** [01-four-lines-model.md](./01-four-lines-model.md) · [matching/db.md](./matching/db.md).

**Intention :** Vous vouliez informer chaque partie de l'avancement du match.

**Choix technique doc :** Entreprise → `MEETING_BOOKED` ; agence peut rester `MATCH_PROPOSED` + `profile.match.active_rdv=true` — statuts enum non synchronisés.

**Impact :** Timelines affichées peuvent montrer des étapes différentes ; messages UI distincts OK selon doc.

**Confirmez-vous ?**

- [ ] Oui — statuts partiellement décalés acceptés
- [ ] Non — je voulais synchroniser agence en `MEETING_BOOKED` aussi (conséquence : bump statut agence au webhook — préciser en Partie 3)
- [ ] Partiellement — simplifier UI agence post-match, moins de steps timeline (préciser en Partie 3)

---

### D-06 — Offre 898€ si fermeture page sans choix

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md).

**Intention :** Vous vouliez laisser le temps à l'agence de réfléchir sur l'offre 898€.

**Choix technique doc :** `discount_898_eligible = true` jusqu'à decline explicite — retour sur le token remonte l'offre si pas encore refusée.

**Impact :** Fermer le navigateur sans choisir ≠ refus ; offre toujours dispo au retour (sauf expiration token non documentée).

**Confirmez-vous ?**

- [ ] Oui — eligible true jusqu'à decline explicite
- [ ] Non — je voulais session unique, retour = plus d'898€ (conséquence : decline implicite — préciser règle en Partie 3)
- [ ] Partiellement — dispo pendant X jours seulement (conséquence : `expires_at` token — préciser en Partie 3)

---

### D-07 — Calendrier nurturing (~8 emails / 60j)

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez relancer les agences refusantes sur 2 mois sans abandonner trop tôt.

**Choix technique doc :** J+7 (1489€), J+14 (conseil sans prix), puis weekly ×6 — ~8 emails sur 60 jours.

**Impact :** Volume email significatif ; annulation si paiement admin ; fréquence hebdo documentée.

**Confirmez-vous ?**

- [ ] Oui — calendrier tel que documenté
- [ ] Non — je voulais max 3–4 emails total (conséquence : couper weekly_4 à weekly_6 — préciser en Partie 3)
- [ ] Partiellement — bi-mensuel au lieu d'hebdo (conséquence : offsets +14j — préciser en Partie 3)

---

### D-08 — Coexistence CRM legacy agence

**Doc :** [crm/README.md](../../crm/README.md) · [01-four-lines-model.md](./01-four-lines-model.md).

**Intention :** Vous aviez un funnel agence existant (Instantly / Calendly commercial).

**Choix technique doc :** Parcours Hercule tech-stack (onboarding → post-RDV) — coexistence avec legacy **non tranchée** explicitement.

**Impact :** Risque double funnel ou leads non routés ; flags/category à définir si coexistence.

**Confirmez-vous ?**

- [ ] Oui — remplacement total, un seul parcours doc tech-stack
- [ ] Non — je voulais coexistence avec flags/category (conséquence : doc + code distinction leads — préciser en Partie 3)
- [ ] Partiellement — migration progressive, documenter les deux jusqu'à cutover (préciser en Partie 3)

---

### D-09 — Agence informée du RDV : email seulement ?

**Doc :** [matching/communication.md](./matching/communication.md).

**Intention :** Vous vouliez que l'agence sache qu'un RDV est booké.

**Choix technique doc :** Job `match_booking_confirm_agence` au webhook — pas d'obligation de bump timeline in-app documentée.

**Impact :** Agence peut ne voir le RDV que par email ; timeline suivi peut rester en « proposition envoyée ».

**Confirmez-vous ?**

- [ ] Oui — email confirm agence suffit
- [ ] Non — je voulais aussi update timeline / badge in-app (conséquence : enrichir deliverance agence post-book — préciser en Partie 3)
- [ ] Partiellement — email enrichi (date, lien visio) sans changer timeline (préciser en Partie 3)

---

### D-10 — Match raté : agence avait payé entrée

**Doc :** [00-overview.md](./00-overview.md) · [matching/db.md](./matching/db.md).

**Intention :** Vous vouliez gérer le cas où le RDV ne mène pas à une vente.

**Choix technique doc :** Parcours post-survey agence (898€, nurturing) documenté ; **pas** de doc remboursement entrée ~1 500€ ni crédit match gratuit explicite.

**Impact :** Match raté → offres agence ou nurturing ; remboursement = non documenté — gap à combler.

**Confirmez-vous ?**

- [ ] Oui — retour `IN_DELIVERANCE` nouvelle recherche, pas de doc remboursement
- [ ] Non — je voulais statut/flag litige + action admin remboursement (conséquence : ajouter statut + workflow — préciser en Partie 3)
- [ ] Partiellement — non documenté, à définir en Partie 3

---

### D-11 — Sémantique « 898€ = 3 rendez-vous »

**Doc :** [post-rdv/agence-commercial.md](./post-rdv/agence-commercial.md) · [post-rdv/front-interne.md](./post-rdv/front-interne.md).

**Intention :** Vous vouliez un pack 898 € moins cher que 1489€ avec plusieurs chances de matcher.

**Choix technique doc :** Copy « 3 RDV » — **ambigu** : 3 cycles match complets (3× Mettre en lien) vs 3 RDV Calendly sur le match en cours.

**Impact :** Implémentation crédit/compteur différente selon interprétation ; `payment-confirmed` 898 doit trancher.

**Confirmez-vous ?**

- [ ] Oui — 3 cycles match complets, crédit 3 RDV après paiement 898€
- [ ] Non — je voulais 3 RDV Calendly sur le match en cours seulement (conséquence : pas de crédit multi-match — préciser en Partie 3)
- [ ] Partiellement — autre règle (préciser en Partie 3)

---

### D-12 — Paiement manuel admin au MVP

**Doc :** [post-rdv/front-interne.md](./post-rdv/front-interne.md).

**Intention :** Vous vouliez lancer sans intégration paiement en ligne.

**Choix technique doc :** Chaque 1489€ / 898€ = clic admin Streamlit `payment-confirmed` — pas de webhook bancaire.

**Impact :** Charge opérationnelle ; risque oubli ; pas de liste « paiements en attente » documentée explicitement.

**Confirmez-vous ?**

- [ ] Oui — workflow manuel acceptable au MVP
- [ ] Non — je voulais webhook paiement avant MVP (conséquence : intégrer Stripe/autre — préciser en Partie 3)
- [ ] Partiellement — manuel OK mais liste admin « paiements en attente » (conséquence : enrichir panel Streamlit — préciser en Partie 3)

---

### D-13 — Pas d'avis entreprise au MVP

**Doc :** [post-rdv/communication.md](./post-rdv/communication.md).

**Intention :** Vous vouliez éviter la complexité avis/recommandation post-SOLD entreprise.

**Choix technique doc :** Email avis J+14 **supprimé** / interdit MVP — pas de template ni job `avis`.

**Impact :** Entreprise SOLD = J+7 onboarding check only ; pas de collecte avis automatique.

**Confirmez-vous ?**

- [ ] Oui — hors MVP confirmé
- [ ] Non — je voulais email avis (conséquence : ajouter template + job — préciser timing en Partie 3)
- [ ] Partiellement — placeholder doc, implémentation post-MVP (préciser en Partie 3)

---

### D-14 — Lien match conservé après decline agence

**Doc :** [post-rdv/db.md](./post-rdv/db.md) · [matching/db.md](./matching/db.md).

**Intention :** Vous vouliez savoir si le lien historique agence↔entreprise reste après refus + nurturing.

**Choix technique doc :** Decline 898€ + nurturing — **non tranché** : FK `matched_*` et row `matches` peuvent rester en place.

**Impact :** Admin voit encore le match passé ; unlink automatique non documenté.

**Confirmez-vous ?**

- [ ] Oui — lien historique conservé
- [ ] Non — je voulais unlink automatique au decline (conséquence : clear FK + note match — préciser en Partie 3)
- [ ] Partiellement — admin décide au cas par cas via bouton unlink (préciser en Partie 3)

---

### D-15 — Tarif entrée ~1 500€ vs renouvellement 1 489€

**Doc :** [00-overview.md](./00-overview.md) · templates nurturing / upsell.

**Intention :** Vous aviez un tarif d'entrée agence (~1 500 €) et un renouvellement légèrement différent (1 489 €).

**Choix technique doc :** Deux montants distincts dans overview et copy — écart 11€ non expliqué ; templates 1489 vs 1500 selon contexte.

**Impact :** Copy emails et CTA doivent utiliser le bon montant ; harmonisation simplifierait templates.

**Confirmez-vous ?**

- [ ] Oui — deux tarifs distincts, copy et montants séparés
- [ ] Non — je voulais harmoniser tout à 1 489€ (conséquence : uniformiser doc + templates — préciser en Partie 3)
- [ ] Partiellement — harmoniser tout à 1 500€ (conséquence : idem — préciser en Partie 3)

---

## Partie 3 — Réponses — à remplir

> **Notes :** si tu coches **Non** ou **Partiellement**, indique l'**intention corrigée** et la **conséquence attendue** (ce que la doc/code doit changer).

| ID | Choix coché | Notes (intention corrigée + conséquence si Non/Partiellement) |
|----|-------------|---------------------------------------------------------------|
| V-01 | | |
| V-02 | | |
| V-03 | | |
| V-04 | | |
| V-05 | | |
| V-06 | | |
| V-07 | | |
| V-08 | | |
| V-09 | | |
| V-10 | | |
| V-11 | | |
| V-12 | | |
| V-13 | | |
| V-14 | | |
| V-15 | | |
| V-16 | | |
| V-17 | | |
| V-18 | | |
| V-19 | | |
| V-20 | | |
| V-21 | | |
| V-22 | | |
| V-23 | | |
| V-24 | | |
| V-25 | | |
| V-26 | | |
| V-27 | | |
| V-28 | | |
| V-29 | | |
| V-30 | | |
| V-31 | | |
| V-32 | | |
| V-33 | | |
| V-34 | | |
| V-35 | | |
| V-36 | | |
| V-37 | | |
| V-38 | | |
| V-39 | | |
| V-40 | | |
| D-01 | | |
| D-02 | | |
| D-03 | | |
| D-04 | | |
| D-05 | | |
| D-06 | | |
| D-07 | | |
| D-08 | | |
| D-09 | | |
| D-10 | | |
| D-11 | | |
| D-12 | | |
| D-13 | | |
| D-14 | | |
| D-15 | | |

---

## Partie 1 bis — Capacity & SLA (pré-validé via [capacity/](./capacity/README.md))

> Décisions documentées dans le module capacity — confirmer ou ajuster en Partie 3.

### C-01 — Délai onboarding → 1er RDV honoré (U4)

**Doc :** [capacity/03-sla-client.md](./capacity/03-sla-client.md)

**Choix technique doc :** ≤ **21j** après activation @ 30 inbox ; ≤ **28j** @ 15 inbox constrained.

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

### C-02 — Volume RDV/mois promis

**Doc :** [capacity/00-deliverables.md](./capacity/00-deliverables.md)

**Choix technique doc :** **3–4 U4 honorés/mois** @ 30 inbox ; **2–3** @ 15. Plafond marketing contrat « 3–5 » non engagé comme minimum.

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

### C-03 — No-show replacement

**Doc :** [capacity/03-sla-client.md](./capacity/03-sla-client.md) · [cvg_master.md](./cvg_master.md) § 10.1

**Choix technique doc :** Remplacement recrédité sous **14 jours ouvrés** (pas « immédiat »).

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

### C-04 — Allocation inbox

**Doc :** [capacity/01-inbox-model.md](./capacity/01-inbox-model.md)

**Choix technique doc :** 10 inbox agence fixe ; **30 inbox/client** cible livraison ; **15** si constrained ; warmup batch **15j** ; **+60** par achat.

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

### C-05 — Bootstrap : closes 14j depuis 11 RDV calendrier

**Doc :** [capacity/09-bootstrap-timeline.md](./capacity/09-bootstrap-timeline.md)

**Choix technique doc :** ~**2–3 closes** ; max **2 immédiats** + 1 `QUEUED_WARMUP`.

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

### C-06 — Funnel baseline

**Doc :** [capacity/02-funnel-math.md](./capacity/02-funnel-math.md)

**Entreprise :** 1% / 30% / 30% / 60% · **Agence :** 3% / 50% / 20% / 40%

- [x] Oui — confirmé (pré-validé capacity)
- [ ] Non / Partiellement — préciser en Partie 3

---

*Une fois rempli, partage ce tableau à l'IA pour mettre à jour `doc/tech-stack/` puis implémenter.*
