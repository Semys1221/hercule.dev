**SALES METRIC PAGE**

**1. Nouvelle page —**

**Sales Metrics**

Ajouter une nouvelle page **Sales Metrics** dans la section **CVG & légal**.

Cette page sert à suivre et comparer :

- les appels de vente prévus ;
- les résultats commerciaux attendus ;
- les résultats réellement obtenus ;
- le chiffre d’affaires réellement capturé ;
- la performance du commercial par rapport aux objectifs.



⸻



**2. Stockage des données**

Toutes les annotations saisies manuellement sur les appels sont sauvegardées **localement**.

**Format**

Les données sont stockées sous forme de **JSON local**.

Chaque appel doit notamment pouvoir contenir :

- prospect ;
- date du rendez-vous ;
- déroulé / notes de l’appel ;
- statut ;
- informations nécessaires au calcul des métriques.

**Statuts disponibles**

PAID

NO SHOW

NOT PAID

Le statut doit être une valeur contrôlée afin d’éviter les variations de texte.



⸻



**3. ONBOARDING — Chargement du calendrier**

La page permet de charger les rendez-vous depuis le **Calendly Webhook**.

**Workflow**

Calendly Webhook

      ↓

Load appointments

      ↓

Display prospects

      ↓

Sales call

      ↓

Write call notes

      ↓

Set status

      ↓

Save locally

Pour chaque prospect chargé, je peux :

1. consulter les informations du rendez-vous ;
2. écrire le déroulé de l’appel ;
3. attribuer un statut :
  - PAID
  - NO SHOW
  - NOT PAID
4. sauvegarder les informations localement.



⸻



**4. SALES METRICS — OBJECTIF**

Les métriques principales sont affichées en haut de la page.

**Baseline**

Pour **10 appels de vente prévus** :

10 meetings

↓

2 closings

Le taux de closing prévu est donc :

2 / 10 = 20 %

**Correction : 25 % n’est pas cohérent avec 2 closings sur 10 appels.**

Un taux de closing de **25 %** correspondrait à :

10 meetings

↓

2,5 closings

ou, avec un nombre entier de ventes :

4 meetings → 1 closing

Il faut donc choisir entre :

- **objectif de 2 closings / 10 appels → 20 %** ;
- **objectif de 25 % de closing → 2,5 closings théoriques / 10 appels**.

Pour éviter une incohérence dans les calculs, cette valeur doit être définie comme une **configuration métier unique**, et non hardcodée dans plusieurs composants.



⸻



**5. PIPELINE PRÉVISIONNEL**

À chaque chargement des données Calendly, le système calcule le **pipeline commercial prévu**.

Le calcul prend comme référence les appels planifiés et le taux de closing prévu.

**Exemple**

Pour le pipeline actuel, la valeur attendue est :

7 445 €

Le système doit afficher la somme que le commercial devrait théoriquement capturer à la date de fin du cycle d’appels Calendly.

**Concept**

Meetings prévus

      ↓

Closing rate prévu

      ↓

Nombre de ventes prévu

      ↓

Valeur moyenne / offre

      ↓

Pipeline prévu

Le montant doit être calculé dynamiquement à partir des données et paramètres de référence.

**7 445 € ne doit pas être hardcodé comme résultat du calcul.**



⸻



**6. DATE DE PROJECTION**

La projection doit être associée à une date :

JX = date de fin des appels Calendly chargés

Le système doit donc pouvoir afficher :

Pipeline prévu à la fin du cycle : **7 445 €**

avec la date correspondante.



⸻



**7. ANNOTATION DE PERFORMANCE**

Le système compare les résultats réels aux résultats attendus.

Une annotation qualitative est affichée selon la performance :

DECENT

GOOD

EXCELLENT

Cette classification doit être basée sur une règle explicite et centralisée.

Elle ne doit pas être déterminée manuellement dans l’interface.

Exemple de logique :

Performance réelle

        ↓

Comparaison avec objectif

        ↓

Classification

        ↓

DECENT / GOOD / EXCELLENT

Les seuils exacts devront être définis dans la configuration métier.



⸻



**8. REAL DATA**

Les données réelles sont calculées à partir des appels effectivement enregistrés.

**Meetings réalisés**

Compter les meetings effectivement réalisés selon la définition métier retenue.

**Closings**

Compter les appels ayant abouti à :

PAID

Le taux de closing réel est alors :

Total closes / Total meetings réalisés

**Exemples**

1 meeting

1 closing

→ 1/1

→ 100 %

→ EXCELLENT

Autre exemple :

10 meetings

2 closings

→ 2/10

→ 20 %

Les NO SHOW ne doivent pas être considérés comme des meetings réalisés.

Le traitement de NOT PAID doit rester distinct d’un closing PAID.



⸻



**9. SALAIRE / REVENUE RÉEL**

La valeur réellement capturée doit être calculée à partir des ventes réellement enregistrées.

PAID

↓

Valeur de la vente

↓

Revenue réel

Le **salaire / revenu réel** est affiché dans les métriques principales.

Il ne doit pas être déduit du pipeline prévu.

**Distinction obligatoire**


|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Metric**         | **Source**                                |
| Pipeline prévu     | Projection basée sur les meetings prévus  |
| Revenue réel       | Transactions PAID réellement enregistrées |
| Closing rate prévu | Configuration métier                      |
| Closing rate réel  | PAID / meetings réalisés                  |
| Performance        | Comparaison prévu vs réel                 |


⸻



**10. COMPONENT — PREVISIONNEL**

Le composant prévisionnel est constitué de plusieurs **tables Shadcn**.

**Structure**

Plusieurs tables permettent de visualiser les différentes dimensions du pipeline.

Exemples de données :

- prospects ;
- dates des calls ;
- statut ;
- valeur potentielle ;
- résultat prévu ;
- résultat réel ;
- pipeline cumulé.



⸻



**11. GROUP BUTTONS**

Les tables utilisent des **group buttons** pour filtrer ou changer la vue.

Exemples de groupes :

ALL | PAID | NO SHOW | NOT PAID

ou :

PREVISIONNEL | REAL | COMPARISON

Les boutons doivent modifier la vue des données sans dupliquer les composants.



⸻



**12. ARCHITECTURE DE DONNÉES**

Le système doit séparer clairement trois niveaux :

SOURCE

Calendly Webhook

      ↓

APPELS

Notes + Status

      ↓

METRICS

Prévisionnel + Réel

Les données brutes doivent être conservées indépendamment des métriques calculées.

Les métriques doivent être **dérivées des données**, et non sauvegardées comme des valeurs indépendantes susceptibles de devenir incohérentes.



⸻



**13. SOURCE OF TRUTH**

**Appels planifiés**

**Calendly / Calendly Webhook**

**Notes et statut commercial**

**JSON local**

**Configuration commerciale**

Source locale/configuration centralisée :

- closing rate cible ;
- nombre de closings cible ;
- valeur de vente ;
- règles DECENT / GOOD / EXCELLENT.

**Revenue réel**

Données correspondant aux ventes PAID enregistrées dans le système.



⸻



**14. PRINCIPE DE CALCUL**

Le système doit fonctionner selon cette logique :

Calendly

   ↓

Meetings planifiés

   ↓

Closing rate cible

   ↓

Pipeline prévisionnel

   ↓

───────────────

   ↓

Appels réalisés

   ↓

Statuts + notes

   ↓

PAID / NO SHOW / NOT PAID

   ↓

Revenue réel

   ↓

Closing rate réel

   ↓

Performance

L’objectif est d’avoir une page permettant de répondre immédiatement à trois questions :

1. **Combien devrais-je générer ?**
2. **Combien ai-je réellement généré ?**
3. **Est-ce que ma performance est decent, good ou excellent ?**

