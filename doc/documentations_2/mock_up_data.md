# **MOCKUP DATAS**

## **1. OBJECTIF**

Ajouter une nouvelle section dans le **dashboard interne** :

```text
MOCK UP DATAS
```

Cette section permet de gérer les données de démonstration utilisées pendant les appels de vente.

Les **Mockup Datas** constituent une source de données commune utilisée par plusieurs interfaces :

- dashboard interne ;
- composant `MOCKUP DATAS` utilisé pendant les appels de vente ;
- composants du site Hercule.

Les données sont communes à tous les utilisateurs.

---

# **2. SOURCE OF TRUTH**

Les Mockup Datas sont stockées dans une **database**.

La database constitue la **source of truth**.

```text
Database
   │
   ├── Internal Dashboard
   │
   ├── Sales Call → MOCKUP DATAS
   │
   └── Hercule Website
```

Il ne faut pas maintenir une copie indépendante des données dans les différents composants.

Toute modification effectuée depuis le dashboard interne doit modifier la database et être répercutée dans les interfaces qui consomment ces données.

---

# **3. ADMIN DASHBOARD — MOCK UP DATAS**

Ajouter une nouvelle section :

```text
MOCK UP DATAS
```

Cette page est une **interface d’administration des données**.

Elle ne sert pas à présenter les données sous forme de cards : son interface principale est une table d’administration.

---

# **4. COMPONENT — MOCKUP DATAS**

Créer un nouveau composant réutilisable :

```text
MockupDatas
```

Ce composant est destiné principalement aux **appels de vente**.

### **Fonction**

Il affiche les **35 demandes disponibles** sous forme de cards.

```text
35 demands
↓
MockupDatas
↓
Demand cards
```

Les cards sont alimentées par la database.

Elles ne doivent pas contenir leurs propres données hardcodées.

---

# **5. FILTRES**

Le composant `MockupDatas` doit permettre de filtrer les 35 demandes.

Les filtres doivent être construits à partir des propriétés réellement présentes dans le modèle de données.

Exemples potentiels :

- type de demande ;
- localisation / zone ;
- catégorie ;
- statut ;
- autres attributs disponibles dans la DB.

Ne pas inventer de nouvelles catégories uniquement pour alimenter les filtres.

---

# **6. ADMIN TABLE**

La page d’édition est constituée d’une **grande table Shadcn**.

Structure générale :

```text
MOCK UP DATAS

┌──────────┬────────────┬────────────┬────────────┬─────────┐
│ Demand   │ Category   │ Zone       │ Status     │ Actions │
├──────────┼────────────┼────────────┼────────────┼─────────┤
│ ...      │ ...        │ ...        │ ...        │ Edit    │
│ ...      │ ...        │ ...        │ ...        │ Edit    │
│ ...      │ ...        │ ...        │ ...        │ Edit    │
└──────────┴────────────┴────────────┴────────────┴─────────┘
```

Les colonnes exactes doivent correspondre au **schéma réel de la database**.

---

# **7. INLINE EDITING**

Les données peuvent être modifiées directement depuis le dashboard interne.

Workflow :

```text
Admin Dashboard
      ↓
Edit cell
      ↓
Validation
      ↓
Database update
      ↓
Updated Mockup Datas
```

L’interface ne doit pas simplement modifier un état frontend local.

Une modification validée doit être persistée dans la DB.

---

# **8. IMPACT DES MODIFICATIONS**

Une modification dans la table doit automatiquement affecter les interfaces utilisant ces données.

```text
             DATABASE
                 │
       ┌─────────┴─────────┐
       ↓                   ↓
 Sales Call            Website
 MockupDatas           MockupDatas
```

Exemple :

```text
Admin changes:
"Budget = 2 500 €"
        ↓
Database updated
        ↓
Sales call component → updated
Website component → updated
```

Il ne doit donc pas être nécessaire de modifier séparément le composant du call et celui du site.

---

# **9. SALES CALL**

Pendant l’appel de vente, le commercial dispose du composant :

```text
MOCKUP DATAS
```

Celui-ci affiche les 35 demandes disponibles sous forme de cards.

Le composant peut être utilisé avec les autres composants du sales call, notamment le composant `AGENDA`.

Les données sélectionnées doivent provenir de la même source de vérité.

---

# **10. DATA CONSISTENCY**

Les Mockup Datas sont **identiques pour tous les utilisateurs**.

Il n’existe pas de version :

- par commercial ;
- par agence ;
- par entreprise ;
- par session ;
- par utilisateur.

Une modification effectuée par un administrateur modifie donc la donnée globale.

```text
                    DB
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
     Admin        Sales Call    Website
        │            │            │
        └────────────┴────────────┘
              SAME DATA
```

---

# **11. SOURCE OF TRUTH — RÈGLE**

Le principe doit être :

**Database first. Components consume the database.**

Les composants ne doivent pas devenir une seconde source de vérité.

À éviter :

```text
DB
+
local JSON
+
hardcoded cards
+
website-specific dataset
```

À privilégier :

```text
              DATABASE
                  ↓
       ┌──────────┴──────────┐
       ↓                     ↓
 MockupDatas              Website
       ↓
 Sales Call
```

---

# **12. ARCHITECTURE**

```text
                    MOCKUP DATAS
                         │
                         ▼
                  DATABASE TABLE
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
     INTERNAL DASHBOARD         SALES CALL
       Big Shadcn Table        MockupDatas
             │                       │
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                      WEBSITE
```

## **Résultat attendu**

La section **MOCK UP DATAS** devient l’interface centrale permettant de gérer les 35 demandes de démonstration.

Le composant `MOCKUP DATAS` utilisé pendant les appels et sur le site consomme exactement les mêmes données que celles administrées depuis le dashboard interne.