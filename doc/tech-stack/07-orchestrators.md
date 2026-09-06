# 07 — Orchestrateurs (sans UI)

```
status: canonical
audience: coding-agent
depends_on: 05-events.md, 08-api.md
decisions: ENG-02 ENG-04 ENG-05 ENG-12 ENG-13 LEG-02 ORCH-01
do_not:
  - Introduire Inngest / n8n
  - Détecter la fin de RDV via Calendly meeting.ended
  - Double-envoyer Instantly (Next + Streamlit)
```

Pas de nouveau runtime. Pattern actuel : **webhook → table job → cron**.

---

## Live

| ID | Entrée | Sortie | Notes |
|----|--------|--------|-------|
| orch-booking | Calendly vente + cron 15 min | Resend | `lib/booking-communication/orchestrator.ts` |
| orch-bypass | Instantly Interested | Instantly API E1–E3 | **Next envoie** (LEG-02) ; Streamlit config |
| orch-ai-reply | Instantly reply_received | Grok → Unibox | Streamlit Inbox/Problem |
| orch-link | clic slug | `CLICKED` + Calendly URLs | |

---

## NEW

| ID | Entrée | Sortie | Étape |
|----|--------|--------|-------|
| orch-stripe | `checkout.session.completed` | `payments` + auto délivrance + cancel nurture | 5 |
| orch-delivery-calendly | invitee.created **event type match** | `appointments` + MEETING_BOOKED ×2 | 7 |
| orch-product-emails | transitions produit | mêmes jobs Resend, nouveaux types | 3 |
| orch-nurture | `sales_calls.not_paid` | séquence plein tarif | 8 |
| orch-survey | complete RDV | tokens + page survey | 8 |

Calendly n’a **pas** de webhook fiable « no-show ». ORCH-01 = acte humain.
