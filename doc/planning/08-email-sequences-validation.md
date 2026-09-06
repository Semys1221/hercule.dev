# 08 — Séquences email

Une séquence n’est pas un funnel, pas un cron, pas un template seul.

Familles : **(1) booking CRM — code+DB, event-driven Calendly** · **(2) Instantly bypass — code+DB, webhook** · **(3) AI reply — pas une séquence marketing** · **(4) produit délivrance/matching/post-RDV — spec**.

---

## PARTIE 1 — Ce qui est valide

### Booking CRM (built)

| | Agence | Entreprise |
|--|--------|------------|
| **Trigger** | Calendly created / manual / role_recovery | idem (pas h20) |
| **Préconditions** | lead + scheduled_at pour follow-ups ; `BOOKING_GO_LIVE_AT` legacy | scheduled_at |
| **Steps / délais** | immediate ; h48 confirm ; h24 relance ; h20 cancel | immediate ; h48 ; h24 |
| **SoT corps** | `booking_email_templates` | idem |
| **SoT planning** | `booking_email_jobs` | idem |
| **Sender** | `BOOKING_RESEND_FROM` | idem |
| **Recipient** | `lead.email` | idem |
| **Reply** | threading headers / subject | idem |
| **Stop** | confirm → cancel h24 ; cancel Calendly → cancel jobs ; h20 peut cancel l’event | cancel jobs |
| **Resend** | API + idempotencyKey | idem |
| **Tracking** | webhook opened/clicked/delivered | idem |
| **Échec** | status failed | idem |
| **Type** | event-driven + cron drain ; **pas** un builder générique | |

Role recovery : `role_seq_48` / `role_seq_24` — recovery weekday.

### Instantly bypass (built)

| | |
|--|--|
| **Nom** | Interested E1–E3 + close |
| **Audience** | leads Instantly (campagnes configurées) |
| **Trigger** | webhook `lead_interested` |
| **Steps** | E1 immédiat (fenêtre Paris) ; E2 +24h ; E3 +48h ; close interest |
| **SoT copy** | `instantly_bypass_templates` |
| **Exécution** | Instantly API reply-to-thread (pas Resend) |
| **Stop** | pipeline close ; skips thread_not_found ACK 200 |
| **Type** | event-driven + crons |

### AI reply — pas une séquence

1 inbound → Grok ou manuel → 1 reply. Jobs = delay manuel.

---

## PARTIE 2 — Spec vs code

Documentés **non built** (tech-stack communication md) :

| Séquence spec | Trigger | Steps | Stop |
|---------------|---------|-------|------|
| onboarding_confirm | INSERT onboarding | 1 email NOW | — |
| deliverance_search_started, d7, milestone | promote / ADVANCE | daté profile.delays | delay admin |
| match_proposal_entreprise | Mettre en lien | 1 + Calendly | — |
| match_booking_confirm_* | webhook book | 1 | — |
| post_rdv_survey_* | fin RDV | 1 + token | — |
| entreprise_onboarding_check_j7 | SOLD embarked | J+7 | — |
| nurture_agence_1489_j7, conseil_j14, weekly_1–6 | decline 898 | ~8 / 60j | payment |

`sequence_client_not_paid` : 3 emails + Stripe — autre spec.

Outreach copy `doc/email_outreach_copy/*` : **Instantly campaigns** (fichiers), pas Resend.

#### [EML-01] Les séquences produit (onboarding confirm, délivrance, matching, survey, nurture) doivent-elles réutiliser `booking_email_jobs` + `booking_email_templates` avec de nouveaux `email_type`, ou rester hors MVP ?

Réutiliser la queue évite un second moteur (`ENG` préfère A **si** FND construit ces modules).

- [ ] **A (recommandé)** — Réutiliser jobs + templates + cron booking-emails ; étendre CHECK `email_type` ; triggers = events produit.
- [ ] **B** — Aucune séquence produit au MVP ; seulement booking CRM + Instantly.
- [ ] **C** — Moteur / table séparés pour le produit (deuxième queue).

**Impact si l’architecture change :** High  
**Domaines affectés :** DB jobs, Resend, FND-04…  
**Ancien ID :** V-09, V-19, V-22, V-26, V-28

#### [EML-02] Le calendrier nurturing agence ~8 emails / 60 jours est-il toujours voulu ?

- [ ] **A (recommandé)** — Oui : J+7 1489, J+14 conseil, puis weekly ×6 ; cancel si paiement.
- [ ] **B** — Pas de nurturing au MVP.
- [ ] **C** — Volume réduit (max 3–4) ou bi-mensuel.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Copy, jobs, conformité ressentie spam  
**Ancien ID :** V-37, D-07

#### [EML-03] L’entreprise SOLD ne reçoit-elle **qu’un** email J+7 (check collaboration), aucun upsell, aucun avis J+14 ?

Exigence métier répétée dans le tech-stack. Confirmer ; ne pas « ajouter un drip » par confort technique.

- [ ] **A (recommandé)** — Oui : J+7 seulement ; pas d’avis MVP ; pas d’upsell entreprise.
- [ ] **B** — Zéro email post-SOLD entreprise (même pas J+7).
- [ ] **C** — Ajouter avis et/ou autres relances.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Post-RDV, copy  
**Ancien ID :** V-33, D-04, D-13

#### [EML-04] Les campagnes Instantly (copy `doc/email_outreach_copy/`) restent-elles éditées **hors** `booking_email_templates` (Instantly UI / fichiers) ?

Ce n’est pas Resend. Les fusionner casserait le bypass.

- [ ] **A (recommandé)** — Oui : outreach Instantly ≠ templates Resend ; pas de SoT unique « tous les emails ».
- [ ] **B** — Centraliser tout le copy email (y compris Instantly) dans Supabase.
- [ ] **C** — Centraliser dans le funnel builder filesystem.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Copy, Instantly, Streamlit subsequence

#### [EML-05] Les séquences email ont-elles **interdit** de redéfinir délais, garanties et engagements déjà posés dans la CGV canonique ?

Aujourd’hui les offsets booking (h48/h24/h20) vivent dans le **code**, pas dans `cvg_master.md` §9–§10. Le pricing JSON recopie des garanties. Mécanisme après un oui : constantes commerciales + tests (`ENG-16`), **pas** un parseur markdown.

- [ ] **A (recommandé)** — Oui : la CGV (CVG-01) est la référence métier ; les séquences consomment les mêmes constantes ; un test échoue si copy/délais divergent.
- [ ] **B** — Audit manuel seulement, pas de garde-fou technique.
- [ ] **C** — La CGV est informative ; les séquences **peuvent** diverger (ops).

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Resend, Instantly copy, CGV, capacity  
**Lié :** CVG-01, CVG-02, CAP-01

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| EML-01 | | |
| EML-02 | | |
| EML-03 | | |
| EML-04 | | |
| EML-05 | | |
