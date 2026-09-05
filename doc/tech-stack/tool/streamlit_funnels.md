# streamlit_funnels — internal funnel cockpit

> Tool : Streamlit Funnels · Status : **implemented (v1 shell)**  
> Related : [streamlit_demands](../../../app/streamlit_demands/) · [streamlit_reply_agent](./streamlit_reply_agent.md) · [02-profile-json.md](../02-profile-json.md)

---

## Purpose

Unified internal cockpit for **agence** (buyer) and **entreprise** (seller) funnels:

- Sales pipeline (discovery / pitch / closing)
- Onboarding fiches (real DB rows)
- Marketing mockup demandes (agence carousel)
- Per-audience legal content
- Email workflow shells linking to existing tools

Run: `npm run streamlit-funnels`

---

## Navigation

```
Landing (2 cards)
└── Workspace (per audience)
    ├── Sales
    │   ├── Funnel → Discovery | Pitch | Closing
    │   └── Fiches mockup → agence_demandes (agence only)
    ├── Onboarding
    │   ├── Funnel (placeholder)
    │   └── Fiche form → INSERT agence | entreprise + profile
    ├── Dashboard (placeholder)
    ├── CVG & légal → CGV | Mentions | Confidentialité | FAQ
    └── Emails
        ├── PRE-CLOSE → Outreach | Subsequence | Reply prompt | Booking
        └── CLOSE → Onboarding | Notifications
```

Session state:

| Key | Values |
|-----|--------|
| `funnel_view` | `landing` \| `workspace` |
| `funnel_audience` | `agence` \| `entreprise` |

---

## Data model

| UI area | Table | Notes |
|---------|-------|-------|
| Sales › Fiches mockup (agence) | `agence_demandes` | Carousel cards — edit only |
| Onboarding › Fiche form | `agence` / `entreprise` | Real fiches with `profile` JSONB |

Migration: `supabase/migrations/20260924120000_onboarding_profile.sql`

Profile builder: `app/streamlit_funnels/fiches/profile_builder.py` — mirrors [02-profile-json.md](../02-profile-json.md).

---

## Legal content (per audience)

| Audience | CGV source |
|----------|------------|
| Agence | `doc/tech-stack/cvg_master.md` |
| Entreprise | `doc/tech-stack/cvg_entreprise.md` |

Shared: `mentions_legales.md`, `confidentialite.md`

TS loader: `lib/site/legal-content.ts` — `getCvgMarkdown(audience)`

---

## Related tools (email shells)

| Subtab | Existing tool |
|--------|---------------|
| Outreach | `npm run streamlit-scraper` |
| Subsequence | `npm run streamlit-subsequence` |
| Reply prompt | `npm run streamlit-reply-agent` |
| Booking | `npm run streamlit-booking-resend` |

---

## File map

| Path | Role |
|------|------|
| `app/streamlit_funnels/app.py` | Entry point |
| `app/streamlit_funnels/landing.py` | Agence / Entreprise cards |
| `app/streamlit_funnels/shell.py` | Workspace tabs |
| `app/streamlit_funnels/tabs/*.py` | Tab renderers |
| `app/streamlit_funnels/demands/mockup_editor.py` | Carousel editor |
| `app/streamlit_funnels/fiches/form.py` | Onboarding create form |
| `app/streamlit_funnels/fiches/repo.py` | Supabase insert |
| `app/streamlit_funnels/legal_content.py` | Audience-aware markdown |

---

## Out of scope (v1)

- Sales funnel stage content
- CVG write-back to filesystem
- Entreprise mockup demandes table
- Dashboard KPIs
- Inline embedding of other Streamlit apps
