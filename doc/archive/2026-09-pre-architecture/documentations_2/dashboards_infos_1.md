# **DASHBOARD 2 — DELIVERY SYSTEM**

## **1. Principe général**

La création du **Dashboard 2** correspond à la création du système complet de **livraison de rendez-vous**.

Le système permet de :

- gérer les clients ;
- gérer les entreprises et les agences ;
- proposer une agence à une entreprise ;
- associer une entreprise à un rendez-vous ;
- suivre les rendez-vous livrés ;
- faire progresser automatiquement le statut du client ;
- afficher la progression dans le dashboard client ;
- déclencher les communications Resend correspondantes.

Le système est composé de :

- **Dashboard interne**
- **Dashboard client Agence**
- **Database CLIENT**
- **Système de statuts**
- **Système de tracking des rendez-vous**
- **Intégration Calendly → DB → Dashboard → Resend**

Il n’y a **pas de dashboard dédié aux entreprises dans cette version**.

---

# **2. Architecture générale**

```text
                         DATABASE CLIENT
                                │
               ┌────────────────┴────────────────┐
               │                                 │
          ENTREPRISE                          AGENCE
               │                                 │
               └────────────────┬────────────────┘
                                │
                         DASHBOARD INTERNE
                                │
              ┌─────────────────┼─────────────────┐
              ↓                 ↓                 ↓
        PROPOSITION        RENDEZ-VOUS        ASSOCIATION
          AGENCE              CALENDLY         RENDEZ-VOUS
              │                 │                 │
              └─────────────────┼─────────────────┘
                                ↓
                         DATABASE UPDATE
                                │
                         STATUS / TRACKING
                                │
                  ┌─────────────┴─────────────┐
                  ↓                           ↓
          DASHBOARD AGENCE                  RESEND
                                              │
                                              ↓
                                       EMAIL SEQUENCES
```

Le **Dashboard interne** est l’interface de contrôle opérationnel.

La **Database CLIENT** reste la source de vérité.

---

# **3. DATABASE CLIENT**

La Database CLIENT constitue la source centrale permettant de gérer les entreprises, les agences et leurs relations.

Elle doit contenir au minimum deux types de profils.

## **3.1 Entreprise**

Informations principales :

- fiche entreprise ;
- contact ;
- coordonnées ;
- statut ;
- informations nécessaires au matching ;
- informations liées aux rendez-vous ;
- historique des rendez-vous ;
- tracking associé.

## **3.2 Agence**

Informations principales :

- fiche agence ;
- contact ;
- coordonnées ;
- statut ;
- informations nécessaires au matching ;
- capacité ;
- rendez-vous livrés ;
- historique des rendez-vous ;
- lien de prise de rendez-vous ;
- tracking associé.

---

# **4. PRÉ-REQUIS — CRÉATION DES LEADS**

Le système suppose que les profils existent déjà dans la Database CLIENT.

Les profils sont ajoutés via trois formulaires :

### **Fiche Agence**

Création d’un profil agence.

```text
Fiche Agence
      ↓
CLIENT DATABASE
      ↓
Agence disponible
```

### **Fiche Agence — Waiting List**

Création d’un profil agence placé en attente.

```text
Fiche Agence — Waiting List
      ↓
CLIENT DATABASE
      ↓
Agence en attente
```

### **Fiche Entreprise**

Création d’un profil entreprise.

```text
Fiche Entreprise
      ↓
CLIENT DATABASE
      ↓
Entreprise disponible
```

Ces formulaires constituent le point d’entrée du système de delivery.

---

# **5. DASHBOARD INTERNE**

Le Dashboard interne permet de gérer opérationnellement la livraison des rendez-vous.

Il doit principalement permettre trois actions :

1. **Proposer une agence à une entreprise**
2. **Recevoir et enregistrer un nouveau rendez-vous**
3. **Associer manuellement un rendez-vous à une entreprise**

Chaque action peut provoquer :

- une mise à jour de la DB ;
- une mise à jour des statuts ;
- une mise à jour du dashboard agence ;
- l’envoi d’un email Resend ;
- une mise à jour du tracking.

---

# **6. ACTION 1 — PROPOSER UNE AGENCE À UNE ENTREPRISE**

## **Interface**

Depuis la fiche entreprise :

```text
Entreprise
→ Voir les agences disponibles
→ Proposer l’agence
```

L’opérateur sélectionne l’agence correspondant au besoin de l’entreprise.

Une relation est alors créée :

```text
Entreprise ←→ Agence
```

## **Actions déclenchées**

### **Database**

Création ou mise à jour de la relation entre les deux profils.

Le statut est ensuite déterminé par la machine à états.

### **Tracking**

Un tracking associé à cette relation est créé ou récupéré.

### **Email**

Déclenchement de la séquence Resend destinée à l’entreprise.

L’email contient un lien permettant à l’entreprise d’accéder à sa page de suivi Hercule.

### **Dashboard**

La proposition apparaît immédiatement dans le Dashboard interne.

---

# **7. TRACKING — ENTREPRISE**

Le lien envoyé à l’entreprise pointe vers une page Hercule permettant de suivre l’avancement de son delivery.

```text
Entreprise
    ↓
Email Resend
    ↓
Tracking Link Hercule
    ↓
Page de tracking
    ↓
État du delivery
    ↓
Rendez-vous livré
```

Le tracking doit permettre d’identifier le delivery concerné sans exposer inutilement les données internes.

---

# **8. ACTION 2 — NOUVEAU RENDEZ-VOUS**

## **Trigger**

Lorsqu’un rendez-vous est réservé via le lien Calendly associé à une agence, l’événement provient de Calendly via l’API / webhook approprié.

```text
Calendly
   ↓
Webhook / API
   ↓
Identification Agence
   ↓
Identification Entreprise
   ↓
Identification du rendez-vous
   ↓
Création / mise à jour en DB
```

Le rendez-vous devient alors un élément réel du delivery.

---

# **9. NOUVEAU RENDEZ-VOUS — ACTIONS DÉCLENCHÉES**

## **Agence**

Le nombre de rendez-vous réellement enregistrés est incrémenté.

Le statut est déterminé automatiquement :

```text
1er rendez-vous → MEETING_1
2e rendez-vous   → MEETING_2
3e rendez-vous   → MEETING_3
...
10e rendez-vous → MEETING_10
```

Le frontend ne décide pas directement du statut.

## **Email**

Un email de notification est envoyé à l’agence via Resend.

Cet email doit contenir les informations essentielles de l’entreprise correspondant au rendez-vous.

L’agence ne doit pas avoir besoin de rechercher manuellement ces informations ailleurs.

## **Dashboard agence**

Le nouveau rendez-vous apparaît dans le dashboard client agence.

## **Dashboard interne**

Le rendez-vous apparaît également dans le Dashboard interne.

## **Tracking**

Le rendez-vous est ajouté à l’historique du delivery concerné.

---

# **10. ACTION 3 — ASSOCIATION D’UN RENDEZ-VOUS**

Cette action concerne l’association manuelle d’un rendez-vous à une entreprise depuis le Dashboard interne lorsque cette association ne peut pas être déterminée automatiquement.

## **Table**

Le Dashboard contient une grande table regroupant les agences.

Une colonne permet d’accéder à leur lien de prise de rendez-vous.

## **Comportement**

Cliquer sur le lien ne doit pas simplement ouvrir Calendly.

Le système ouvre une interface demandant :

**Quelle entreprise doit être associée à ce rendez-vous ?**

L’opérateur sélectionne alors une fiche entreprise existante.

---

# **11. ASSOCIATION ENTREPRISE ↔ RENDEZ-VOUS**

```text
Agence
   ↓
Lien de prise de rendez-vous
   ↓
Sélection Entreprise
   ↓
Association du rendez-vous
   ↓
Création / mise à jour du tracking
   ↓
Update DB
   ↓
Update status
   ↓
Resend
   ↓
Dashboard updates
```

Cette étape conserve un contrôle manuel sur l’association tout en automatisant le reste du delivery.

---

# **12. RENDEZ-VOUS CONFIRMÉ**

Une fois le rendez-vous correctement associé à l’entreprise :

## **Entreprise**

- mise à jour de la DB ;
- mise à jour du tracking ;
- déclenchement du flow Resend **Rendez-vous confirmé** si applicable.

## **Agence**

- mise à jour du statut ;
- ajout du rendez-vous à l’historique ;
- déclenchement du flow Resend correspondant.

## **Dashboards**

Mise à jour :

- Dashboard interne ;
- Dashboard agence.

---

# **13. SUIVI DES RENDEZ-VOUS LIVRÉS**

Le système doit distinguer :

### **Rendez-vous prévu**

Rendez-vous enregistré dans Calendly.

### **Rendez-vous confirmé**

Rendez-vous correctement associé à une entreprise et à une agence.

### **Rendez-vous réalisé**

Rendez-vous effectivement tenu.

### **Rendez-vous absent / No-show**

Rendez-vous non réalisé en raison de l’absence d’une partie.

Ces événements doivent pouvoir être utilisés comme triggers du système de delivery.

Le statut du client ne doit pas être incrémenté uniquement parce qu’un webhook Calendly existe : le système doit appliquer la règle métier correspondant au type d’événement.

---

# **14. COMPONENT — CLIENTS TABLE**

`ClientsTable` constitue le composant central permettant de gérer les connexions entre les différents profils.

Il doit notamment permettre de :

- afficher les entreprises ;
- afficher les agences ;
- afficher leurs statuts ;
- visualiser leurs relations ;
- sélectionner une agence pour une entreprise ;
- associer une entreprise à un rendez-vous ;
- consulter les informations nécessaires au delivery ;
- déclencher les actions opérationnelles.

Le composant doit rester générique et réutilisable.

---

# **15. UPSELL**

Ajouter une action :

**PROPOSER UPSELL**

Cette action peut être déclenchée de deux manières.

### **Manuel**

L’opérateur clique sur :

**Proposer Upsell**

### **Automatique**

Le système peut déclencher automatiquement l’upsell lorsqu’une agence atteint :

```text
MEETING_10
```

ou :

```text
COMPLETED
```

Le trigger exact doit être centralisé afin d’éviter les doubles déclenchements.

---

# **16. DATABASE STATUS — CLIENT**

La machine à états principale est :

```text
NOT_PAID
   ↓
PAID
   ↓
MEETING_1
   ↓
MEETING_2
   ↓
MEETING_3
   ↓
...
   ↓
MEETING_10
   ↓
COMPLETED
```

Les statuts doivent être :

- contrôlés ;
- centralisés ;
- utilisés de manière identique par le backend, les dashboards et les triggers.

Il ne faut pas créer plusieurs représentations textuelles du même statut.

---

# **17. MEETING COUNTER**

Le compteur de rendez-vous doit être basé sur les rendez-vous réellement enregistrés dans la DB.

```text
Nombre de rendez-vous = N
             ↓
Statut calculé
             ↓
MEETING_N
```

Le frontend ne doit jamais pouvoir décider arbitrairement :

```text
MEETING_4
```

par simple modification d’un champ.

Le backend doit déterminer le statut à partir des données réelles du delivery.

---

# **18. TRIGGER — MEETING_10**

Lorsque l’agence atteint réellement :

```text
MEETING_10
```

le système déclenche :

- update DB ;
- update Dashboard agence ;
- mise à jour du tracking ;
- séquence Resend Upsell, si cette règle est activée.

Flux :

```text
Nouveau rendez-vous
       ↓
Rendez-vous enregistré
       ↓
Meeting counter = 10
       ↓
Status = MEETING_10
       ↓
Upsell trigger
       ↓
Resend
       ↓
Dashboard update
```

Le trigger doit être idempotent.

---

# **19. TRIGGER — COMPLETED**

Lorsque le cycle de delivery est terminé :

```text
COMPLETED
```

le système déclenche :

- update DB ;
- update Dashboard agence ;
- update tracking ;
- séquence Resend Upsell si applicable.

```text
COMPLETED
    ↓
Upsell trigger
    ↓
Resend
    ↓
Dashboard update
```

---

# **20. RESEND — EMAIL SYSTEM**

Resend constitue le système d’envoi transactionnel et séquentiel du delivery.

## **Agence**

Flows liés notamment à :

- nouveau rendez-vous ;
- rendez-vous confirmé ;
- progression du delivery ;
- MEETING_10 ;
- COMPLETED ;
- upsell ;
- no-show / reprogrammation si applicable.

## **Entreprise**

Flows liés notamment à :

- proposition d’agence ;
- tracking ;
- rendez-vous confirmé ;
- progression du delivery ;
- communications de fin de cycle.

Les emails doivent être déclenchés par les événements métier côté serveur.

Un composant frontend ne doit pas envoyer directement un email transactionnel critique.

---

# **21. PRINCIPE CENTRAL — DATABASE AS SOURCE OF TRUTH**

Le système doit suivre ce principe :

```text
USER ACTION / API EVENT
          ↓
      SERVER LOGIC
          ↓
       DATABASE
          ↓
    STATUS / EVENT
          ↓
     ┌────┴────┐
     ↓         ↓
 DASHBOARD   RESEND
```

Le Dashboard n’est pas la source de vérité.

Il permet d’effectuer des actions métier qui sont traitées côté serveur.

La DB conserve ensuite l’état réel du delivery.

Les dashboards et les emails consomment cet état.

---

# **22. IDEMPOTENCE DES TRIGGERS**

Les événements critiques doivent être idempotents.

Exemple :

Si Calendly envoie deux fois le même événement :

```text
EVENT_ID = 123
```

le système doit reconnaître qu’il a déjà été traité.

Il ne doit donc pas produire :

```text
MEETING_1
→ MEETING_2
```

à cause d’un simple doublon webhook.

De même, un email :

```text
RENDEZ-VOUS_CONFIRME
```

ne doit pas être envoyé deux fois pour le même événement.

Chaque événement critique doit disposer d’un identifiant permettant de garantir son traitement unique.

---

# **23. ARCHITECTURE FINALE**

```text
┌──────────────────────┐
│     FICHE AGENCE     │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│   FICHE ENTREPRISE   │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────┐
│      CLIENT DATABASE       │
│                            │
│ Agency + Enterprise        │
│ Status + Relations         │
│ Rendez-vous + Tracking     │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│     INTERNAL DASHBOARD     │
└─────────────┬──────────────┘
              │
       ┌──────┼───────┐
       │      │       │
       ▼      ▼       ▼
 PROPOSITION  CALENDLY  ASSOCIATION
   AGENCE     RENDEZ-VOUS RENDEZ-VOUS
       │      │       │
       └──────┼───────┘
              ▼
       DATABASE UPDATE
              │
      ┌───────┴────────┐
      ▼                ▼
DASHBOARD AGENCE      RESEND
                         │
                         ▼
                  EMAIL SEQUENCES
```

## **Principe directeur**

Le **Dashboard 2** n’est pas simplement une interface de reporting.

Il constitue l’interface opérationnelle du **système de livraison de rendez-vous**.

Les profils entrent dans la DB, les relations agence/entreprise sont créées depuis le Dashboard interne, les rendez-vous sont enregistrés via Calendly, les associations nécessaires peuvent être contrôlées manuellement, et chaque rendez-vous fait progresser le delivery selon les règles métier définies.

La **Database est la source de vérité**, tandis que :

```text
DB
↓
Delivery State
↓
Dashboard + Tracking + Resend
```

constituent les différentes représentations du même état réel du delivery.

