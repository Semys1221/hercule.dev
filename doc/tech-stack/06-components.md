# 06 — Registre composants

```
status: canonical
audience: coding-agent
depends_on: 01-product.md, 09-surfaces.md
decisions: COMP-01 COMP-02 UI-01 ENG-11 ENG-17 ADM-01
do_not:
  - Inventer un type de bloc funnel depuis l’UI
  - Second design system
  - HTML brut button/input/select/table/dialog dans Next (shadcn)
```

Rôle : `recipient` · `trigger` · `edition` · `orchestrator`.  
Domaine : `sales_funnel` · `onboarding_funnel` · `dashboard_internal` · `dashboard_client` · `crm` · `marketing` · `communication`.

**Source of truth vivante :** [`lib/admin/architecture/components-registry.ts`](../lib/admin/architecture/components-registry.ts)  
**Vue UI :** `/internal/components` (table filtrable, reflète le registry TypeScript).

**Périmètre inventaire (COMP-01) :** spécifications `documentations_2` + infra déjà construite (API, webhooks, crons, Streamlit, surfaces marketing/internal).

Référence archivée : `archive/2026-09-pre-architecture/documentations_2/` (dashboards, mockup datas, sequences, sales metrics, global settings).

---

## Surfaces marketing & internal (built)

| ID | Surface | Domaine | Rôle |
|----|---------|---------|------|
| mkt-home | `/` | marketing | recipient |
| mkt-agence | `/agence` | marketing | recipient |
| mkt-entreprise | `/entreprise` | marketing | recipient |
| mkt-faq | `/faq` | marketing | recipient |
| mkt-cvg | `/cvg` | marketing | recipient |
| mkt-legal | `/a-propos`, `/mentions-legales`, `/confidentialite` | marketing | recipient |
| sales-res-html | `public/reservation*.html` | sales_funnel | trigger Calendly **vente** |
| int-home | `/internal` | dashboard_internal | recipient |
| int-funnels | `/internal/funnels` | sales_funnel | edition |
| int-components | `/internal/components` | dashboard_internal | recipient |
| int-database | `/internal/database` | dashboard_internal | recipient |
| ui-* | `components/ui/*` | shared | primitives shadcn |

---

## Built — funnel, CRM, communication

| ID | kind | domain | route |
|----|------|--------|-------|
| fiche-form | component | onboarding_funnel | `components/internal/funnels/fiche-form.tsx` |
| fiche-form-api | api_route | onboarding_funnel | `/api/admin/onboarding/[category]` |
| funnel-editor | component | sales_funnel | `funnel-editor.tsx` |
| funnels-api-crud | api_route | sales_funnel | `/api/admin/funnels/*` |
| faq-editor | component | sales_funnel | `faq-editor.tsx` |
| pricing-editor | component | sales_funnel | `pricing-editor.tsx` |
| legal-doc | component | sales_funnel | `legal-doc.tsx` |
| mockup-editor | component | marketing | `mockup-editor.tsx` |
| admin-demandes-api | api_route | marketing | `/api/admin/demandes` |
| agence-carousel | component | marketing | `components/agence/bande-projets.tsx` |
| streamlit-demands | component | marketing | `app/streamlit_demands/app.py` |
| streamlit-scraper | component | crm | `app/streamlit_scraper/app.py` |
| streamlit-clean | component | crm | `app/streamlit_clean/app.py` |
| webhook-calendly | webhook | crm | `/api/webhooks/calendly` |
| webhook-instantly | webhook | crm | `/api/webhooks/instantly` |
| webhook-instantly-reply | webhook | communication | `/api/webhooks/instantly/reply` |
| link-tracking-click | api_route | crm | `/api/link-tracking/click` |
| link-tracking-api | api_route | crm | `/api/link-tracking/*` |
| webhook-supabase-link-tracking | webhook | crm | `/api/webhooks/supabase-link-tracking` |
| calendly-availability-api | api_route | sales_funnel | `/api/calendly/availability` |
| webhook-resend | webhook | communication | `/api/webhooks/resend` |
| cron-booking-emails | cron | communication | `/api/cron/booking-emails` |
| cron-calendly-seat-check | cron | communication | `/api/cron/calendly-seat-check` |
| calendly-seat-orchestrator | orchestrator | communication | `lib/calendly-seat-onboarding/orchestrator.ts` |
| calendly-org-api | api_route | communication | `lib/calendly/org.ts` |
| calendly-seat-sequence-ui | component | communication | `/internal/funnels/agence/emails/calendly-seat-onboarding` |
| instantly-bypass-cron | cron | communication | `/api/cron/instantly-bypass-jobs` |
| pipeline-cron | cron | communication | `/api/cron/instantly-bypass-pipeline` |
| ai-reply-agent-cron | cron | communication | `/api/cron/ai-reply-agent-jobs` |
| booking-orchestrator | orchestrator | communication | `lib/booking-communication/orchestrator.ts` |
| booking-communication-api | api_route | communication | `/api/booking-communication/*` |
| streamlit-links | component | dashboard_internal | `app/streamlit_links/app.py` |
| streamlit-booking-resend | component | dashboard_internal | `app/streamlit_booking_resend/app.py` |
| streamlit-subsequence | component | communication | `app/streamlit_subsequence/app.py` |
| streamlit-reply-agent | component | communication | `app/streamlit_reply_agent/app.py` |
| streamlit-stats | component | sales_funnel | `app/streamlit_stats/app.py` |
| dashboard-onboarding-form | component | dashboard_client | `onboarding-form-modal.tsx` |
| dashboard-kpis | component | dashboard_internal | `components/internal/funnels/dashboard/dashboard-state-table.tsx` (archived) |
| modalites-campaign-page | component | dashboard_internal | `/internal/modalites` |
| deliverability-panel | component | dashboard_internal | `/internal/deliverability` |
| deliverability-api | api_route | dashboard_internal | `/api/admin/deliverability` |

---

## Spec — roadmap (documentations_2 + planning)

| ID | Surface / concept | Domaine | Rôle | Source doc |
|----|-------------------|---------|------|------------|
| onboarding-client-form | `/onboarding/[category]` | onboarding_funnel | trigger | planning |
| deliverance-timeline | `/suivi/[category]/[slug]` | dashboard_client | recipient | dashboards_infos_1 |
| post-rdv-survey | `/survey/[token]` | dashboard_client | trigger | planning |
| matching-admin-action | Mettre en lien | dashboard_internal | trigger | dashboards_infos_1 |
| clients-table | Dashboard interne ops | dashboard_internal | recipient | `/internal/funnels/agence/clients` |
| rdv-association-ui | Associer RDV → entreprise | dashboard_internal | trigger | dashboards_infos_1 |
| upsell-admin-action | Proposer upsell | dashboard_internal | trigger | dashboards_infos_1 |
| agenda | Sales call calendar | sales_funnel | recipient | global_settings |
| global-settings | File d'attente 15 jours | sales_funnel | edition | session-settings.json |
| mockup-datas | Cards 35 demandes (call) | sales_funnel | recipient | mock_up_data |
| sales-metrics | Sales Metrics page | sales_funnel | recipient | admin_sales_metric_page |
| previsionnel | Pipeline prévu / réel | sales_funnel | recipient | admin_sales_metric_page |
| sequence-editor | SequenceDropdown | communication | edition | sequence_email |
| email-sequences-table | Email sequences dashboard | communication | edition | sequence_email |
| meeting-sequence-ui | MEETINGS + SEQUENCES tabs | communication | edition | sequence_email |
| no-show-action | Mark as no-show | communication | trigger | sequence_email |
| preclose-sequence-trigger | Séquence indécis post-call | sales_funnel | trigger | sequence_client_not_paid |
| int-leads | `/internal/leads` | dashboard_internal | recipient | planning |
| int-lead-detail | `/internal/leads/[id]` | dashboard_internal | recipient | planning |
| int-pay-link | Bouton Stripe | sales_funnel | trigger | planning |
| int-appointments | `/internal/appointments` | dashboard_internal | trigger | planning |
| int-templates | Emails booking | communication | edition | planning |
| int-sales | `/internal/sales` | sales_funnel | edition | planning |

Writes client : `onboarding-client-form`, `post-rdv-survey`, no-show `deliverance-timeline` uniquement.

Catalogue funnel **fermé** (COMP-02).
