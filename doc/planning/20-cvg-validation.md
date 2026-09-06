# 20 — CGV (source de vérité légale)

**Intention :** un seul texte contractuel ; un changement met à jour **tous** les consommateurs (site, internal, AI reply, checkbox onboarding). JSON / Streamlit **ne sont pas** la SoT actuelle — malgré le souvenir ops.

Ne pas reposer [CPY-03](./09-copywriting-validation.md) (FAQ/pricing/légal site vs `doc/`). Ici : **contrat** vs copy marketing.

---

## PARTIE 1 — Ce qui est valide

Les CGV **ne sont pas** un JSON Streamlit. Fichiers markdown, chargés par [`lib/site/legal-content.ts`](../../lib/site/legal-content.ts).

| Document | Fichier | Audience | Consommateurs |
|----------|---------|----------|----------------|
| CGV agence (buyer) | [`doc/tech-stack/cvg_master.md`](../tech-stack/cvg_master.md) | agence | `/cvg`, preview `/internal`, AI reply knowledge |
| Conditions entreprise | [`doc/tech-stack/cvg_entreprise.md`](../tech-stack/cvg_entreprise.md) | entreprise | même loader `getCvgMarkdown('entreprise')` |
| Checkbox onboarding | [`cvg_onboarding.md`](../tech-stack/cvg_onboarding.md) | agence | **spec** ; pas branché au form |
| Mentions | `mentions_legales.md` | partagé | site + internal |
| Confidentialité | `confidentialite.md` | partagé | site + internal |
| Audit site ↔ CGV | [`cvg_site-sync.md`](../tech-stack/cvg_site-sync.md) | — | checklist copy |

Catégories dans l’UI : **nœuds de nav** (CGV / mentions / confidentialité / FAQ / pricing), pas un CMS à dropdown JSON. La doc [`streamlit_funnels.md`](../tech-stack/tool/streamlit_funnels.md) disait déjà : **pas de write-back CGV** en v1.

**À garder :** deux CGV d’audience (agence paie / entreprise gratuite) — aligné [cvg_entreprise.md](../tech-stack/cvg_entreprise.md) §2. Prompts AI : renvoyer vers `/cvg` **sans** reciter les montants.

---

## PARTIE 2 — Écarts

| Problème | Evidence | Risque |
|----------|----------|--------|
| Souvenir « CGV = JSON Streamlit » | aucun fichier JSON CGV | agents implémentent le mauvais CMS |
| Pricing marketing **duplique** CGV §5 | [`content/pricing/agence.json`](../../content/pricing/agence.json) : 1489 €, 2500 €/mois, 14 j, MRR 1500 | divergence silencieuse |
| FAQ JSON vs CGV | `content/faq/*.json` + `cvgLink` | délais/garanties recopiés |
| Internal CGV **read-only** | `edit.enabled: false` | pas de « changer une fois, tout se met à jour » |
| `cvg_onboarding.md` non branché | form admin sans checkbox persistée | spec `cvg_acceptances` absente |
| SOP `contrat.md` stub | ancien 250 € | confusion |

**Reco ingénierie (après CVG-01 A) :** un loader unique déjà là ; activer l’écriture `/internal` vers les `.md` ; **interdire** à pricing JSON d’être une deuxième vérité des montants/SLA (`ENG-16` : constantes commerciales + tests, pas un parseur markdown).  
**Conflit :** [CF-13](./15-conflicts-validation.md).

#### [CVG-01] Où vit la CGV **canonique** (contrat) ?

Le code utilise déjà les markdown `doc/tech-stack/`. JSON Streamlit n’existe pas pour ce contenu.

- [ ] **A (recommandé)** — Garder **markdown** `cvg_master.md` / `cvg_entreprise.md` comme SoT légale ; `/internal` peut écrire ces fichiers ; tous les consommateurs passent par `legal-content.ts` (déjà le cas pour le site).
- [ ] **B** — Déplacer la CGV en **Supabase** (versioning, `cvg_version` à l’acceptation).
- [ ] **C** — CMS JSON (modèle Streamlit souvenir) comme SoT, markdown généré ou abandonné.

**Impact si l’architecture change :** High  
**Domaines affectés :** `/cvg`, internal legal, AI reply, onboarding checkbox, git  
**Lié :** CPY-03, ADM-01

#### [CVG-02] Qui a le droit de **modifier** la CGV, et le pricing JSON a-t-il le droit de diverger ?

Sans ça, l’éditeur pricing `/internal` peut contredire le contrat.

- [ ] **A (recommandé)** — Éditeur internal **explicite** (« ceci est le contrat ») ; pricing / FAQ **dérivent** ou citent les constantes, pas une deuxième vérité.
- [ ] **B** — CGV = git / juridique seulement ; `/internal` reste preview lecture seule (état actuel).
- [ ] **C** — Le pricing JSON **peut** diverger pour le marketing (landing ≠ contrat).

**Impact si l’architecture change :** High si C (risque légal)  
**Domaines affectés :** PricingEditor, landing, CGV, CPY-01  
**Lié :** CPY-03, EML-05

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| CVG-01 | | |
| CVG-02 | | |
