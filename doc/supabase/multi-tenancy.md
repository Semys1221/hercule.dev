Chaque lead possède un slug et une campagne, mais aucun client associé. Quand il ouvre /reservation/{slug}, React envoie le slug à Supabase. Supabase trouve la campagne, vérifie les quotas des clients disponibles et sélectionne automatiquement le client qui doit recevoir le rendez-vous. Le calendrier de ce client est ensuite affiché.

Exact. **Le lead ne doit pas avoir de** `client_id` **au départ.** L’attribution est dynamique au moment de la réservation.



### **1.**

`clients`


| **Colonne**      | **Type** | **Rôle**                        |
| ---------------- | -------- | ------------------------------- |
| `id`             | UUID     | ID unique du client             |
| `name`           | text     | Nom                             |
| `email`          | text     | Email                           |
| `calendar_url`   | text     | Calendrier                      |
| `campaign`       | text     | Niche : `btp`, `dentiste`, etc. |
| `quota`          | integer  | Nombre de RDV autorisés         |
| `bookings_count` | integer  | Nombre de RDV reçus             |




### **2.**

`leads`


| **Colonne**  | **Type**    | **Rôle**                    |
| ------------ | ----------- | --------------------------- |
| `id`         | UUID        | ID unique du lead           |
| `slug`       | text UNIQUE | Identifiant dans l’URL      |
| `campaign`   | text        | Niche du lead               |
| `status`     | text        | `available`, `booked`, etc. |
| `created_at` | timestamp   | Date de création            |


**Aucune relation** `lead → client`**.**

### **Workflow**

```text
Lead
  ↓
/reservation/{slug}
  ↓
React récupère le slug
  ↓
Supabase trouve le lead
  ↓
campaign = BTP
  ↓
Supabase cherche les clients BTP
  ↓
Client A : 0/2
Client B : 2/2
  ↓
→ Client A sélectionné
  ↓
Afficher calendrier Client A
  ↓
RDV réservé
  ↓
Client A : 1/2
```

### **Architecture**

```text
             REACT
               │
        /reservation/slug
               │
               ▼
           SUPABASE
          /         \
      LEADS       CLIENTS
       │              │
    campaign       campaign
                      │
                  quota / RDV
                      │
                      ▼
               MATCHING DYNAMIQUE
```

Le **slug identifie le lead**, pas le client. Le client est déterminé **au runtime**.



