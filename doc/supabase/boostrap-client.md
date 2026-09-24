Pour **bootstrap un client et lancer le système**, le formulaire React doit collecter uniquement les données nécessaires au fonctionnement.



### **Formulaire**

`Client Onboarding`

**1. Identité**

- Nom / prénom
- Nom de l’entreprise
- Email
- Téléphone

**2. Campagne**

- Niche / campagne : `BTP`, `Restaurant`, `Dentiste`, etc.
- Statut : `active / inactive`

**3. Calendrier**

- URL Calendly
- Email du compte Calendly, si nécessaire
- Fuseau horaire

**4. Quota**

- Nombre de RDV inclus : ex. `2`
- `bookings_count` : automatiquement `0`
- `queue_position` : automatiquement attribuée

**5. Configuration**

- `client_id` : généré automatiquement
- Date d’activation
- `status = active`

### **Au submit**

```text
Formulaire React
      ↓
Créer Client
      ↓
Générer ID
      ↓
Définir quota
      ↓
Définir queue_position
      ↓
Définir campaign
      ↓
Status = active
      ↓
CLIENT PRÊT
```

**Je ne mettrais pas le** `slug` **du client dans le formulaire.** Le système doit le générer automatiquement si tu en as besoin.

---

## Variante single-client (Pierre Meniaud — `comptable_delivery`)

Hors scope : [multi-tenancy.md](./multi-tenancy.md) et [queue.md](./queue.md) (pas de queue, un seul `client_id` fixe).

### Config

- Fichier : [`config/clients/pierremeniaud.json`](../../config/clients/pierremeniaud.json)
- Calendly embed par verticale (`restaurant`, `btp`, …)
- `clientId` = ligne `public.clients` Meniaud

### Routes

- `/reservation/restaurant/{slug}`
- `/reservation/btp/{slug}`

### Bootstrap (script, pas de formulaire v1)

```bash
pnpm apply-comptable-delivery-migration   # une fois : table comptable_delivery
pnpm bootstrap-pierremeniaud-booking -- --dry-run
pnpm bootstrap-pierremeniaud-booking -- --confirm
pnpm bootstrap-pierremeniaud-booking -- --confirm --resync-all
```

Provisionne les campagnes Instantly activées dans le JSON, fixe `client_id` sur chaque lead `comptable_delivery`, URLs canoniques + dual-write Instantly (`reservation_jum_link`, `jum_segment`).

### Vérification

```bash
pnpm smoke-comptable-delivery-flow
```