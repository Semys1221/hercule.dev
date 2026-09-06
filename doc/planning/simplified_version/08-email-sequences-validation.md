# 08 — Séquences email

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../08-email-sequences-validation.md](../08-email-sequences-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- **Emails vente** (après book Calendly) : déjà en prod.
- **Emails Instantly** (froid) : gérés dans Instantly, pas dans le même éditeur que Resend.

---

## Questions

#### [EML-01] Les emails **produit** (confirmation inscription, recherche lancée, match, questionnaire, nurturing) : même moteur que les emails vente ?

- [x] **A (recommandé)** — **Oui**, réutiliser la file d’emails existante avec de **nouveaux types**.
- [ ] **B** — **Aucun** email produit au MVP ; seulement vente + Instantly.
- [ ] **C** — **Deuxième moteur** séparé pour le produit.

---



#### [EML-02] Le **nurturing** agence (~8 emails sur 60 jours après refus 898 €) : tu le veux toujours ?

- [x] **A (recommandé)** — **Oui** : J+7 offre 1489, J+14 conseil, puis 1/semaine ×6 ; stop si paiement. Nurturing mais pour offre plein tarif. Le workflow est simplement : appel de vente. Client marked NOT PAID = nuturing sequence. Le tarrif ne baisse pas. 
- [ ] **B** — **Pas** de nurturing au MVP.
- [ ] **C** — **Moins** d’emails (3–4 max).

---



#### [EML-03] L’**entreprise** après un succès : combien d’emails auto ?

- [x] **A (recommandé)** — **Un seul** email J+7 « comment ça se passe avec l’agence ? » — **pas** d’upsell, **pas** d’avis J+14 au MVP.
- [ ] **B** — **Zéro** email après succès.
- [ ] **C** — **Plus** (avis, relances…).

---



#### [EML-04] Les textes des **campagnes Instantly** (froid) : on les édite où ?

- [x] **A (recommandé)** — **Instantly** ou fichiers outreach — **pas** dans l’éditeur emails Resend.
- [ ] **B** — **Tout centraliser** en base.
- [ ] **C** — **Éditeur funnel** fichiers.

---



#### [EML-05] Les emails ont-ils le droit de **contredire** les délais/garanties des CGV ?

- [x] **A (recommandé)** — **Non** : mêmes chiffres que le contrat ; tests auto si possible.
- [ ] **B** — **Contrôle manuel** seulement.
- [ ] **C** — Les emails **peuvent** diverger (ops).

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| EML-01 | A | Même file, nouveaux types produit |
| EML-02 | A | Nurturing plein tarif si NOT_PAID ; tarif ne baisse pas |
| EML-03 | A | Entreprise : 1 email J+7, pas d’upsell |
| EML-04 | A | Copy Instantly hors éditeur Resend |
| EML-05 | A | Emails = chiffres CGV ; constantes + tests |


