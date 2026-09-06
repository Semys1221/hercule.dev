Voici la spécification structurée pour **Global Settings**, en gardant la logique source de vérité + configuration centralisée.

# **Global Settings**

## **1. Emplacement**

Ajouter une section **GLOBAL SETTINGS** au niveau **Workspace Admin**.

Cette section centralise les paramètres globaux qui peuvent modifier le comportement ou l’affichage de plusieurs composants en production.

---

## **2. Setting — « File d’attente 15 jours »**

Ajouter un toggle :

**File d’attente 15 jours**

- `OFF` → comportement normal.
- `ON` → activation du mode **File d’attente 15 jours**.

Le setting doit utiliser la méthode de configuration standard déjà utilisée dans le projet.

**Règle :**

- Si ce comportement doit être piloté par la base de données, enregistrer la valeur en DB.
- Si le projet dispose déjà d’un système de configuration global adapté, utiliser celui-ci.
- Ne pas créer une nouvelle logique de configuration si une source de vérité existe déjà.

Le frontend doit toujours lire cette valeur depuis la source de vérité configurée.

---

## **3. Impact sur le composant Agenda**

Le toggle modifie uniquement le comportement du **composant Agenda**.



### `OFF`

 **— comportement normal**

L’agenda conserve son fonctionnement actuel.

Les **6 premiers jours** sont grisés afin de respecter le délai normal de mise en place.



### `ON`

 **— File d’attente 15 jours**

Lorsque le setting est activé :

- afficher dans le composant Agenda la mention :  
**« File d’attente 15 jours »**
- l’agenda doit être grisé sur une période de **15 jours** au lieu de 6 jours.
- les dates situées après cette période restent disponibles selon le fonctionnement actuel de l’agenda.

Le changement doit être automatique dès que la configuration est activée.

---

## **4. Règle de fonctionnement**

Le composant Agenda ne doit pas avoir deux implémentations différentes.

Il doit simplement calculer la période bloquée à partir du setting global :

```text
File d’attente 15 jours = OFF
→ période bloquée = 6 jours

File d’attente 15 jours = ON
→ période bloquée = 15 jours
→ afficher « File d’attente 15 jours »
```

La logique doit être centralisée afin d’éviter de dupliquer cette condition dans plusieurs composants.

---

## **5. Source of Truth**

Le **Global Settings** est la source de vérité du comportement.

Architecture attendue :

```text
Workspace Admin
      ↓
Global Settings
      ↓
Source of Truth
      ↓
Agenda Component
      ↓
6 jours / 15 jours
```

Une modification du setting doit donc modifier le comportement du composant Agenda partout où ce composant utilise cette configuration.

---

## **6. Implémentation**

- Suivre strictement les règles Cursor du projet.
- Identifier le système de settings/configuration déjà présent avant d’ajouter quoi que ce soit.
- Réutiliser les composants et patterns existants.
- Ne pas hardcoder le statut dans le composant Agenda.
- Ne pas créer une seconde source de vérité.
- Garder la logique modulaire et simple.
- Si une configuration DB existe déjà, utiliser cette architecture plutôt que créer une nouvelle table ou un nouveau mécanisme.
- Vérifier que la modification est bien prise en compte en production.

