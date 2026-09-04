# Profile JSON — Fiche client centrale

> Voir aussi : [Modèle de données](./02-data-model.md) · [Vue d'ensemble](./00-overview.md) · [Capacity](../capacity/README.md) · [Agence commercial post-survey](./post-rdv/agence-commercial.md)

---

## 1. Intro (langage simple)

Quand quelqu'un remplit le formulaire onboarding, **tout** est stocké dans une colonne `profile` (un gros JSON) sur sa ligne en base.

Ce JSON est le **cerveau de la fiche** :

- Il alimente la **page suivi** React (labels, étapes affichées)
- Il alimente les **emails** (variables, délais d'envoi)
- Il gère les **offres commerciales** agence (898€ exclusif, nurturing 60j)
- Il porte la **capacité inbox** et les **dates SLA** ([capacity/06-profile-integration.md](../capacity/06-profile-integration.md))
- Il évite d'éparpiller 20 colonnes différentes

Exemple : si l'agence a un droit de rétractation de 4 jours, on met `retraction_days: 4` dans le JSON → le premier email « recherche lancée » part 4 jours plus tard.

---

## 2. Architecture développée (pour IA de coding)

### Schéma minimal (TypeScript)

```typescript
type LeadProfile = {
  form: {
    besoin?: string;
    budget?: string;
    specialites?: string[];
    taille_equipe?: string;
    droit_retractation?: boolean;
    // … champs formulaire onboarding
  };
  communication: {
    delays: {
      base_match_days: number;       // default 14
      retraction_days: number;       // default 0 ; ex. 4 si droit rétractation
      search_start_offset_days: number; // calculé à l'init
      queue_warmup_days: number;       // default 15
      first_match_promise_days: number; // default 21 — client-facing
      first_rdv_promise_days: number;   // default 35
      first_u4_promise_days: number;    // default 21 @ 30 inbox ; 28 @ 15
      five_u4_promise_days: number;     // default 35
      ten_u4_promise_days: number;      // default 60
    };
  };
  capacity?: {
    allocation_inboxes: number;
    constrained: boolean;
    capacity_phase: "bootstrap" | "stable";
    queue_status: "none" | "warmup" | "capacity";
    queue_position?: number;
    estimated_activation_at?: string;
    infrastructure_ready_at?: string;
    estimated_first_u4_at?: string;
    estimated_five_u4_at?: string;
    estimated_ten_u4_at?: string;
    rdv_month_target: number;
    funnel_baseline?: {
      reply_rate: number;
      positive_rate: number;
      booking_rate: number;
      closing_rate: number;
      sends_per_inbox_day: number;
      predicted_u4_monthly: number;
    };
  };
  display: {
    timeline: Array<{ label: string }>;
  };
  match?: {
    active_rdv: boolean;
    partner_company?: string;
  };
  survey?: {
    // Entreprise
    embarked?: boolean | null;
    continue_search?: boolean | null;
    // Agence
    sale_made?: boolean | null;
    offer_choice?: "1489" | "898" | "decline" | null;
  };
  offers?: {
    discount_898_eligible: boolean;   // true à l'ouverture survey agence
    discount_898_declined_at?: string; // ISO — set à vie si refus offre 898
    nurturing_started_at?: string;   // ISO — début séquence nurturing 60j
  };
};
```

### Defaults à l'insert onboarding

```typescript
function buildDefaultProfile(form: Record<string, unknown>, category: "agence" | "entreprise"): LeadProfile {
  const retraction = form.droit_retractation ? 4 : 0;
  return {
    form,
    communication: {
      delays: {
        base_match_days: 14,
        retraction_days: retraction,
        search_start_offset_days: retraction,
      },
    },
    display: {
      timeline: category === "agence" ? AGENCE_TIMELINE_LABELS : ENTREPRISE_TIMELINE_LABELS,
    },
    match: { active_rdv: false },
    // offers initialisé à l'ouverture survey agence, pas à l'onboarding
  };
}
```

### Init offers (ouverture survey agence)

```typescript
function initAgenceSurveyOffers(profile: LeadProfile): LeadProfile {
  return {
    ...profile,
    offers: {
      discount_898_eligible: true,
      nurturing_started_at: undefined,
    },
  };
}
```

### Calcul nurturing (agence « non merci »)

```typescript
const start = profile.offers!.nurturing_started_at!; // set au decline
// J+7  → nurture_agence_1489_j7
// J+14 → nurture_agence_conseil_j14
// J+21, J+28, J+35, J+42, J+49, J+56 → nurture_agence_weekly_N (hebdo jusqu'à 60j)
```

### Survey — champs distincts par category

| Category | Question | Champ profile |
|----------|----------|---------------|
| agence | « Avez-vous fait la vente ? » | `survey.sale_made` |
| agence | Choix offre in-page | `survey.offer_choice` |
| entreprise | « Embarqué avec l'agence ? » | `survey.embarked` |
| entreprise | Continuer recherche ? | `survey.continue_search` |

### Mise à jour profile

| Trigger | Qui écrit | Quoi |
|---------|-----------|------|
| Onboarding POST | API Next.js | `profile` complet initial |
| Admin « Mettre en lien » | API Next.js | `profile.match.*` |
| Webhook Calendly book | API Next.js | `profile.match.active_rdv = true` |
| Survey POST token (agence) | API Next.js | `survey.sale_made`, `survey.offer_choice`, `offers.*` |
| Survey POST token (entreprise) | API Next.js | `survey.embarked`, `survey.continue_search` |
| Agence decline 898 / non merci | API Next.js | `offers.discount_898_eligible = false`, `nurturing_started_at = now()` |

**Jamais** de PATCH profile hors token survey ou API admin.

### Pas de colonnes redondantes

Tout délai, offre, réponse survey → **profile JSONB**. Colonnes SQL : `statut`, `email`, `link`, FK match, dates deliverance.

---

## 3. Prompt d'action IA

```
Implémenter profile JSONB (doc/tech-stack/02-profile-json.md).

1. Colonne profile JSONB sur agence + entreprise
2. buildDefaultProfile() — form, communication.delays, display.timeline
3. survey.sale_made (agence) vs survey.embarked (entreprise)
4. profile.offers — discount_898_eligible, nurturing_started_at
5. Orchestrateur : nurturing dates depuis offers.nurturing_started_at

Réutiliser : lib/booking-communication/schedule.ts

Tests :
- decline 898 → discount_898_eligible=false permanent
- nurturing_started_at → jobs J+7, J+14, hebdo 60j
- entreprise SOLD → pas de champs offers
```
