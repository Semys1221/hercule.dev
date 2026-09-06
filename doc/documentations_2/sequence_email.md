Voici une version structurée en spécification technique, en séparant clairement **architecture, source of truth, composants, workflows et règles métier**. J’ai également corrigé les incohérences évidentes de nomenclature et de logique dans le texte original.

# **EMAIL SEQUENCES SYSTEM — V1**

## **1. OBJECTIF DE LA V1**

La V1 du système **Email Sequences** est principalement destinée à :

- consulter les séquences existantes ;
- documenter leur fonctionnement ;
- éditer les séquences existantes ;
- ajouter ou supprimer des steps ;
- modifier les délais ;
- modifier le contenu inline ;
- insérer des variables ;
- prévisualiser les emails ;
- sauvegarder les modifications dans leur **source of truth** ;
- enregistrer et consulter les statistiques des campagnes Outreach.

### **Limitation volontaire de la V1**

La V1 ne doit **pas permettre de créer depuis l’interface une nouvelle séquence complètement inconnue du codebase**.

Raison :

Créer une séquence depuis un UI builder ne suffit pas à rendre cette séquence fonctionnelle. Il faut également lui associer ses triggers, sa logique d’exécution, ses règles d’envoi et éventuellement ses données sources.

L’interface V1 doit donc principalement éditer et documenter ce qui existe déjà.

---

# **2. RÈGLES GLOBALES**

## **Source of Truth**

Avant toute implémentation, identifier la source of truth existante pour chaque catégorie :


| **Élément**                      | **Source of Truth**                              |
| -------------------------------- | ------------------------------------------------ |
| CVG / légal                      | Local                                            |
| Outreach campaigns               | Instantly                                        |
| Outreach statistics enregistrées | Local JSON                                       |
| Subsequences                     | À déterminer dans le codebase                    |
| Reply Agent prompt               | À déterminer dans le codebase                    |
| Booking / Meeting sequences      | `~/dev/hercule.dev/app/streamlit_booking_resend` |
| Leads                            | Database existante                               |
| Onboarding recipients            | Nouvelle table `paid/onboarding` à définir       |
| Email execution                  | Resend + logique serveur existante               |


Ne pas créer une nouvelle source de vérité lorsqu’une source existe déjà.

Si la source de vérité n’est pas clairement identifiable dans le codebase, **ne pas en inventer une** : identifier d’abord le système existant.

---

# **3. RÈGLES DE CODE**

- Suivre strictement toutes les règles Cursor du projet.
- Écrire du code modulaire et simple.
- Éviter les abstractions inutiles.
- Réutiliser les composants existants lorsque leur comportement correspond.
- Ne pas créer plusieurs implémentations d’une même logique.
- Centraliser les statuts, variables et règles métier.
- Les triggers doivent être côté serveur.
- Le frontend ne doit pas devenir la source de vérité d’un événement métier.

---

# **4. API & CACHE**

Lorsqu’un composant utilise une API avec API key :

- ne jamais exposer l’API key côté client ;
- effectuer les appels sensibles côté serveur ;
- appliquer un cache lorsque les données peuvent être réutilisées ;
- éviter de refetcher inutilement les mêmes données ;
- permettre un **manual refresh / fetch** lorsque les données ne nécessitent pas d’être constamment à jour.

Le cas principal est **Instantly**.

---

# **5. COMPONENT — SEQUENCE EDITOR**

Le composant utilisé pour l’édition des séquences :

```text
SequenceDropdown
```

est basé sur le **Drop Down Component** existant.

La structure est similaire au composant utilisé pour les CVG & légal.

### **Différence**

Dans les CVG :

```text
barre = article / section
```

Dans les séquences :

```text
barre = email step
```

---

# **6. STRUCTURE DU SEQUENCE EDITOR**

Chaque step est représentée par une barre horizontale.

Exemple :

```text
────────────────────────────────────
Step 1 — Immediate                  ▼
────────────────────────────────────
Step 2 — +24h                       ▼
────────────────────────────────────
Step 3 — +48h                       ▼
────────────────────────────────────
```

Au clic :

```text
Title
↓
Time gap
↓
Email body
↓
Variables
↓
Preview
↓
Save
```

---

# **7. ACTIONS DISPONIBLES POUR LES SÉQUENCES**

Toutes les séquences éditables disposent des actions suivantes :

### **Add step**

Ajouter une nouvelle step lorsque la séquence le permet.

### **Delete step**

Supprimer une step existante.

### **Edit**

Modifier le contenu directement inline.

### **Modify time gap**

Modifier le délai entre deux emails.

### **Preview**

Prévisualiser l’email avec les variables résolues lorsque les données nécessaires sont disponibles.

### **Save**

Sauvegarder dans la source of truth appropriée.

### **Insert variables**

Insérer les variables disponibles pour la séquence concernée.

---

# **8. VARIABLES**

Une variable peut être insérée dans le contenu d’un email lorsqu’elle correspond à une donnée réellement disponible.

Exemples :

```text
@PRENOM
@TYPE_DEMANDE
@ZONE
@CALENDRIER
@SIGNATURE
```

## **Condition**

L’insertion de certaines variables dépend de l’existence des données nécessaires dans la DB.

Si les leads correspondants n’existent pas encore, certaines variables ne peuvent pas être résolues.

L’UI doit donc distinguer :

```text
Variable disponible
```

et :

```text
Variable impossible à résoudre
```

---

# **9. DISPLAY AS**

Lorsqu’une variable contenant une URL est insérée, l’utilisateur peut choisir :

```text
DISPLAY AS
```

Cela permet de remplacer l’URL brute par un texte plus court.

Exemple :

```text
https://www.hercule.dev
```

peut être affiché comme :

```text
hercule.dev
```

La valeur réelle du lien reste inchangée.

---

# **10. OUTREACH**

## **Principe**

L’interface **ne sert pas à éditer les campagnes Outreach**.

La gestion opérationnelle des campagnes reste effectuée dans **Instantly**.

Cette section sert uniquement à enregistrer et analyser les statistiques des campagnes.

---

# **11. OUTREACH — TABLE STATISTICS**

À l’ouverture de la page :

```text
Aucune statistique enregistrée
```

Une table permet ensuite de consulter les campagnes enregistrées.

Actions :

```text
NEW
EDIT
DELETE
```

---

# **12. OUTREACH — NEW STAT**

Cliquer sur `NEW` ouvre un formulaire en mode funnel :

```text
Step 1
↓
Step 2
↓
Step 3
↓
Step 4
↓
Save
```

---

## **Step 1 — Select Instantly Campaign**

Deux possibilités :

### **Option A — Fetch via API**

Sélectionner une campagne récupérée depuis Instantly.

### **Option B — Manual**

Entrer manuellement le nom de la campagne.

---

## **Step 2 — Email Content**

Si la campagne a été récupérée via l’API Instantly :

- récupérer Email 1 ;
- récupérer Email 2.

Si elle est entrée manuellement :

- saisir Email 1 ;
- saisir Email 2.

Les emails doivent être enregistrés avec les statistiques afin de conserver le contexte de la campagne au moment de l’analyse.

---

# **13. OUTREACH — CAMPAIGN METRICS**

L’utilisateur saisit :

- Total sent ;
- Total replies ;
- Total booked.

Le système calcule automatiquement :

### **Reply rate**

```text
total replies / total sent × 100
```

### **Booking rate**

```text
total booked / total sent × 100
```

### **Emails required per booking**

```text
total sent / total booked
```

---

# **14. OUTREACH — DELIVERY PROJECTION**

La projection repose sur :

```text
900 emails / jour
Lundi → Samedi
```

Le système calcule donc le nombre de jours d’envoi nécessaires pour obtenir :

- 5 bookings ;
- 10 bookings.

Le calcul doit tenir compte du calendrier d’envoi réel :

```text
6 jours d'envoi / semaine
```

et non d’un simple calcul `emails / 900` incluant le dimanche.

---

# **15. OUTREACH — CAMPAIGN RATING**

La campagne reçoit automatiquement une notation :

```text
VERY BAD
BAD
CORRECT
GOOD
REALLY GOOD
```

### **Baseline**

La référence cible est :

```text
900 emails → 1 booking
```

soit :

```text
1 booking / jour d'envoi
```

Les seuils exacts de chaque catégorie doivent être définis dans une configuration centralisée.

Ils ne doivent pas être dispersés dans les composants frontend.

---

# **16. OUTREACH — SAVE**

Après validation :

```text
Save
↓
JSON local
↓
Campaign Statistics Table
```

L’utilisateur peut ensuite :

- consulter ;
- modifier ;
- supprimer ;

la statistique enregistrée.

Pour ajouter une nouvelle campagne :

```text
NEW
```

---

# **17. SUBSEQUENCES**

## **Interface**

Les subsequences utilisent le composant :

```text
SequenceDropdown
```

Chaque step est représentée par une barre horizontale.

---

# **18. SUBSEQUENCES — FETCH CAMPAIGNS**

La page affiche initialement un bouton :

```text
FETCH CAMPAIGNS
```

Objectif :

Ne pas interroger constamment l’API Instantly.

Lorsqu’on clique dessus :

```text
FETCH
↓
Instantly API
↓
Cache
↓
Campaigns
↓
Shadcn Table
```

Les campagnes sont récupérées **quel que soit leur statut**.

---

# **19. CAMPAIGN TABLE**

Les campagnes apparaissent dans une table Shadcn.

Pour chaque campagne :

- nom ;
- statut ;
- existence d’une subsequence ;
- actions disponibles.

L’utilisateur sélectionne une campagne.

**Ce n’est qu’après sélection d’une campagne que l’éditeur de subsequence apparaît.**

---

# **20. CAMPAIGN WITHOUT SUBSEQUENCE**

Si une campagne n’a pas encore de subsequence :

```text
CREATE NEW
```

est disponible.

### **Règle**

Il est impossible de créer une subsequence indépendamment d’une campagne.

Le workflow est obligatoirement :

```text
Select Campaign
↓
CREATE NEW
↓
Bootstrap Subsequence
```

---

# **21. SUBSEQUENCE BOOTSTRAP — CLI**

La création initiale d’une subsequence doit être réalisée par un **CLI command** existant ou à créer si nécessaire.

Le CLI initialise :

- la structure de la subsequence ;
- les règles d’envoi ;
- les steps ;
- les paramètres nécessaires à son fonctionnement.

Il ne doit pas être utilisé pour récupérer les données individuelles des leads.

---

# **22. LEADS & SCHEDULING LINKS**

La récupération des leads et de leurs données propres est le rôle du système :

```text
streamlit_links
```

Le CLI de bootstrap ne doit donc pas dupliquer cette responsabilité.

Avant de bootstrapper une subsequence, le CLI doit vérifier :

1. que la campagne existe dans Instantly ;
2. que les leads correspondants existent dans la DB ;
3. que les colonnes nécessaires aux subsequences existent ;
4. que les données nécessaires aux scheduling links sont disponibles.

Si les prérequis ne sont pas remplis :

```text
Bootstrap blocked
```

avec une erreur explicite indiquant la donnée manquante.

---

# **23. SUBSEQUENCE — EDITION**

Une subsequence existante peut être modifiée depuis l’interface.

Actions :

- Add step ;
- Delete step ;
- Edit content ;
- Modify time gap ;
- Insert variables ;
- Preview ;
- Save.

### **Maximum**

```text
3 steps maximum
```

L’UI doit empêcher la création d’une quatrième step.

---

# **24. SUBSEQUENCE — SAVE**

Lors du `SAVE` :

```text
UI
↓
Validation
↓
Source of Truth
↓
Save
```

Si la modification nécessite un déploiement pour être réellement active :

```text
WAITING FOR PROD
```

est affiché.

Cela permet de distinguer :

```text
Saved in source of truth
```

de :

```text
Currently active in production
```

---

# **25. REPLY AGENT**

Renommer la section :

```text
PROMPT
```

en :

```text
REPLY AGENT
```

---

# **26. REPLY AGENT — WORKFLOW**

Le workflow est similaire à celui des subsequences.

```text
Select Campaign
↓
Edit existing prompt
OU
Write prompt from blank
↓
Save
```

La campagne doit être sélectionnée avant d’éditer le prompt.

### **Source of Truth**

À identifier dans le codebase avant implémentation.

Ne pas créer une nouvelle source de vérité tant que l’emplacement du prompt actuel n’a pas été identifié.

---

# **27. BOOKING → MEETING SEQUENCE**

Renommer la section :

```text
BOOKING
```

en :

```text
MEETING SEQUENCE
```

### **Source existante**

Référence actuelle :

```text
~/dev/hercule.dev/app/streamlit_booking_resend
```

Cette application doit être inspectée afin d’identifier :

- les séquences ;
- les triggers ;
- les templates ;
- les variables ;
- la logique Resend ;
- les statuts ;
- les données utilisées.

---

# **28. MEETING SEQUENCE — TABS**

La page possède deux tabs :

```text
MEETINGS
SEQUENCES
```

---

## **Tab 1 — MEETINGS**

Cette tab permet de :

- charger les bookings actuels ;
- voir les leads ;
- voir les informations du meeting ;
- voir les emails Resend déjà envoyés ;
- déclencher manuellement certains statuts/actions.

---

## **Tab 2 — SEQUENCES**

Permet de modifier :

- sequence entreprise ;
- sequence agence.

Les séquences existantes doivent être éditables via le `SequenceDropdown`.

### **Legacy**

Aucune section `LEGACY`.

Une fois la nouvelle implémentation validée :

```text
streamlit_booking_resend
```

est marqué comme **deprecated**.

---

# **29. NO-SHOW SEQUENCE**

Ajouter un nouveau workflow directement dans la tab `MEETINGS`.

À côté de chaque lead :

```text
MARK AS NO SHOW
```

---

# **30. NO-SHOW — TRIGGER**

Le trigger est volontairement simple :

```text
MARK AS NO SHOW
↓
Status = NO SHOW
↓
No-show sequence
```

---

# **31. NO-SHOW — DEFAULT SEQUENCE**

La séquence contient par défaut **3 emails**.


| **Step** | **Timing**  |
| -------- | ----------- |
| Email 1  | Immediately |
| Email 2  | +24h        |
| Email 3  | +48h        |


Les deux premiers emails proposent un lien de rescheduling.

Le dernier email **ne contient pas** de lien de rescheduling.

---

# **32. NO-SHOW — EMAIL FORMAT**

Les emails utilisent React Email.

Un nouvel objet / type clair doit être créé afin que les emails soient correctement catégorisés.

Format :

```text
Absence — [subject]
```

Style :

- court ;
- concis ;
- professionnel ;
- direct ;
- pas excessivement poli.

---

# **33. RENAMING — RESEND BOOKING OBJECT**

L’objet actuel :

```text
Confirmation requise — Votre rendez-vous avec Hercule
```

doit être utilisé dans l’onglet :

```text
NOTIFICATION
```

pour éviter que les futurs premiers emails de séquence soient classés comme notification.

Créer un **nouvel objet dédié aux premiers emails de séquence**.

Principe :

```text
NOTIFICATION
→ Confirmation requise — Votre rendez-vous avec Hercule

SEQUENCE
→ nouvel object dédié
```

Le nouvel objet doit être défini dans le codebase avec le type correspondant à son usage.

---

# **34. ONBOARDING EMAIL SEQUENCES**

## **Source of Truth — RECIPIENTS**

Avant d’implémenter la séquence, définir la source de vérité permettant de déterminer quels leads sont considérés comme **onboarded / paid**.

Deux architectures sont possibles.

### **Option 1**

Ajouter :

```text
status = PAID
```

dans la table de leads existante.

Le trigger serait alors le premier écran du funnel onboarding.

### **Option 2 — Architecture retenue**

Créer une nouvelle table dédiée aux leads ayant payé / démarré leur onboarding.

Le premier écran de l’onboarding collecte :

- nom ;
- email ;
- coordonnées ;
- informations agence / entreprise ;
- toutes les données nécessaires aux fiches correspondantes.

Le profil est ensuite créé dans la nouvelle table.

### **Avantage**

Cette architecture permet de découpler :

```text
Sales page / slug prospect
```

de :

```text
Onboarding
```

et évite de dépendre d’un slug spécifique pour retrouver la bonne ligne de DB.

---

# **35. ONBOARDING — TRIGGER**

Le trigger est :

```text
CONFIRM
```

dans le formulaire de création de fiche.

Flux :

```text
Onboarding Form
↓
CONFIRM
↓
Create onboarding profile
↓
Trigger sequence
↓
Resend
```

Le trigger doit être côté serveur.

---

# **36. ONBOARDING — EMAIL SEQUENCE**

## **Email 1 — Immediate**

### **Sender**

```text
Hercule
```

### **Type**

Nouvel objet spécifique au premier email.

### **Thread**

Les emails suivants doivent rester dans le même thread lorsque cela est techniquement possible.

### **Links**

Email 1 :

```text
No links
```

### **Contenu**

Le contenu actuel fourni dans le draft doit être remplacé/validé avant mise en production, car il contient encore des placeholders manifestement issus d’un template DHL (`shipment`, `Waybill`, `Pickup date`, etc.) qui ne correspondent pas au contexte Hercule.

Le template final doit être basé sur les informations réellement disponibles dans la fiche onboarding.

---

# **37. ONBOARDING — EMAIL 2**

### **Timing**

```text
17:00 — même jour
```

### **Objectif**

Informer le client que la mise en place est terminée.

Variables prévues :

```text
@PRENOM
@TYPE_DEMANDE
@ZONE
@CALENDRIER
@SIGNATURE
```

Message :

- compte configuré ;
- calendrier de livraison enregistré ;
- demandes correspondant aux critères désormais transmissibles ;
- aucune action requise ;
- attente de la première demande.

---

# **38. ONBOARDING — EMAIL 3**

### **Timing**

```text
08:00 — jour suivant
```

### **Objectif**

Informer le client que la première livraison est en préparation.

Variables :

```text
@PRENOM
@X
@Y
@SIGNATURE
```

Le message doit notamment expliquer :

- délai estimé avant première demande ;
- surveillance de la boîte email ;
- fonctionnement du traitement des demandes ;
- fin du parcours onboarding ;
- prochaine communication.

**La formulation « Nous revenons vers vous sous 6 jours ouvrés » doit être vérifiée contre les délais contractuels de Delivery avant mise en production afin d’éviter une promesse contradictoire.**

---

# **39. ONBOARDING — EMAILS DE RAPPEL**

Les emails 4, 5 et 6 sont actuellement décrits avec des délais contradictoires :

- `J+5`
- `J-10`
- `J-5`
- `J-0`

Il faut donc normaliser la nomenclature avant implémentation.

Ils doivent être définis relativement à une **date de référence unique** présente dans la DB.

Exemple :

```text
REFERENCE DATE
↓
J-10
↓
J-5
↓
J-0
↓
J+5
```

Chaque rappel doit être généré à partir de cette date et non d’une date hardcodée.

Les textes DHL présents dans le draft doivent également être remplacés par les contenus métier Hercule correspondants.

---

# **40. NOTIFICATION SYSTEM**

La section `NOTIFICATION` regroupe les emails transactionnels / événements qui ne constituent pas nécessairement une séquence de nurturing.

---

## **NEW AGENCY PROPOSAL**

### **Trigger**

Une agence est proposée à une entreprise.

```text
Agency selected
↓
PROPOSED
↓
Email → Entreprise
```

### **Objectif**

Informer l’entreprise qu’une agence correspondant à sa demande lui est proposée.

---

# **41. NEW DEMAND**

Déclenché lorsqu’une nouvelle demande pertinente est disponible.

```text
New Demand
↓
Identify recipient
↓
Resend
```

Le contenu doit utiliser les données de la fiche correspondante.

---

# **42. PAYMENT NOTIFICATION**

Notification liée au paiement.

Le système doit pouvoir communiquer le statut commercial correspondant.

Le wording définitif doit être séparé de la logique métier afin de pouvoir évoluer sans modifier le trigger.

---

# **43. VIDEO REVIEW REQUEST**

Ajouter une notification permettant de demander un **avis vidéo**.

Le trigger et le délai doivent être définis dans la configuration de la séquence plutôt que hardcodés dans le composant.

---

# **44. AFTER-MEETING SEQUENCE**

Lorsqu’un meeting Calendly est terminé :

```text
Calendly Meeting End
↓
Identify Agency
↓
Identify Enterprise
↓
Update meeting status
↓
Trigger After-Meeting Sequence
```

La séquence est envoyée :

- à l’agence ;
- à l’entreprise.

---

# **45. AFTER-MEETING — OBJECTIFS**

La séquence permet de :

- recueillir un retour ;
- récupérer les informations nécessaires ;
- mettre à jour les statuts ;
- mettre à jour le dashboard interne ;
- alimenter le suivi du delivery.

Le retour reçu doit pouvoir être relié au meeting correspondant.

---

# **46. ARCHITECTURE GLOBALE**

```text
                         EMAIL SYSTEM
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
     OUTREACH            SUBSEQUENCES          REPLY AGENT
        │                     │                     │
     Instantly             Instantly             Instantly
        │                     │                     │
        ▼                     ▼                     ▼
   Local Stats              DB / ?                 ?


                    MEETING SEQUENCE
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
            ENTREPRISE              AGENCE
                │                     │
                └──────────┬──────────┘
                           ▼
                         Resend


                       ONBOARDING
                           │
                           ▼
                  Paid / Onboarding DB
                           │
                           ▼
                     Resend Sequence
```

---

# **47. PRINCIPE DE TRIGGER**

Les composants d’édition ne doivent **pas être responsables de l’exécution des emails**.

Ils configurent et sauvegardent les séquences.

L’exécution doit suivre :

```text
Business Event
↓
Server-side Trigger
↓
Database / Event validation
↓
Sequence lookup
↓
Resend
```

Exemples :

```text
CONFIRM onboarding
→ ONBOARDING_SEQUENCE

MARK AS NO SHOW
→ NO_SHOW_SEQUENCE

Calendly meeting booked
→ MEETING_SEQUENCE

Meeting ended
→ AFTER_MEETING_SEQUENCE

MEETING_10
→ UPSELL_SEQUENCE

COMPLETED
→ UPSELL_SEQUENCE
```

---

# **48. V1 — CE QUI EST MODIFIABLE DEPUIS L’UI**


| **Fonction**                                          | **V1**                      |
| ----------------------------------------------------- | --------------------------- |
| Voir les séquences existantes                         | Oui                         |
| Modifier une step                                     | Oui                         |
| Modifier le délai                                     | Oui                         |
| Ajouter une step                                      | Oui                         |
| Supprimer une step                                    | Oui                         |
| Preview                                               | Oui                         |
| Variables                                             | Oui, si données disponibles |
| Display as                                            | Oui                         |
| Save                                                  | Oui                         |
| Créer une nouvelle subsequence via campagne existante | Oui                         |
| Créer une campagne Instantly                          | Non                         |
| Créer une séquence totalement inconnue                | Non                         |
| Créer un nouveau trigger depuis UI                    | Non                         |
| Modifier les campagnes Outreach                       | Non                         |
| Consulter les statistiques Outreach                   | Oui                         |
| Ajouter des statistiques Outreach                     | Oui                         |
| Supprimer des statistiques                            | Oui                         |
| Modifier Reply Agent                                  | Oui                         |
| Créer une nouvelle logique d’exécution                | Non                         |


---

# **49. RÈGLE FONDAMENTALE**

L’interface est un **éditeur de configuration et de documentation**, pas un générateur arbitraire de logique métier.

Une nouvelle séquence réellement fonctionnelle doit exister dans le codebase avec :

```text
Sequence definition
+
Trigger
+
Recipient logic
+
Variables
+
Scheduling rules
+
Resend execution
```

L’UI V1 peut ensuite permettre son édition.

Cela évite de créer des séquences « visuellement présentes » dans le dashboard mais qui n’ont aucun trigger réel et ne peuvent donc jamais être exécutées.