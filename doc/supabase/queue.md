## **Liste de queue**

La queue permet de répartir les leads **à tour de rôle** entre les clients disponibles. Si le client A et le client B sont disponibles, le premier lead va à A, le deuxième à B, puis à nouveau A, etc. On ne remplit donc pas le quota de A avant de commencer à envoyer des leads à B.



### `clients`

 **— modification**

On ajoute :


| **Colonne**      | **Type** | **Rôle**                         |
| ---------------- | -------- | -------------------------------- |
| `queue_position` | integer  | Position du client dans la queue |


Exemple :

```text
Client A → queue_position = 1
Client B → queue_position = 2
```



### `leads`

 **— modification**

**Aucune nouvelle colonne nécessaire.**

Le lead reste indépendant du client.

### **Workflow — modification**

Le workflow actuel devient :

```text
Lead
 ↓
slug → Supabase
 ↓
campaign = BTP
 ↓
Clients BTP disponibles
 ↓
Trier par queue_position
 ↓
Sélectionner le prochain client
 ↓
Déplacer ce client en dernière position
 ↓
Afficher son calendrier
```

Exemple :

```text
Queue initiale : A → B

Lead 1 → A
Queue : B → A

Lead 2 → B
Queue : A → B

Lead 3 → A
Queue : B → A
```

**Point important :** la queue doit être mise à jour **atomiquement** dans Supabase pour éviter que deux leads arrivant en même temps sélectionnent le même client.