# LEG-01 — Streamlit cutover

## Status: READY TO EXECUTE (after double-send verification)

## Action required

Once ops verifies there are no double-sends (Next.js sends + Streamlit sends for the same lead), execute:

```sql
UPDATE public.instantly_bypass_settings
SET value = 'false'
WHERE key = 'send_enabled';
```

This disables Streamlit from dispatching E1–E3 booking emails. Next.js becomes the sole email sender.

## Pre-cutover checklist

1. Confirm `instantly_bypass_settings.send_enabled = true` currently active in production.
2. Pick a test lead — send an email manually from Next.js, verify receipt.
3. Check Streamlit logs — confirm no parallel send for same lead.
4. Set `send_enabled = false` via SQL above.
5. Monitor `booking_email_jobs` for 24 h — confirm no duplicate rows.

## Rollback

```sql
UPDATE public.instantly_bypass_settings
SET value = 'true'
WHERE key = 'send_enabled';
```
