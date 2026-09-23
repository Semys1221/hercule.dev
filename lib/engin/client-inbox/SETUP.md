# Engin client inbox — Gmail setup

Messagerie 1:1 clients via **Gmail** (`thomas@hercule.dev`), sync Supabase. Distinct de Resend (séquences / notifications).

## Google Cloud

1. Enable **Gmail API** on the project.
2. Create **OAuth 2.0 Client** (Desktop or Web) and obtain refresh token for `thomas@hercule.dev`:
   - Scopes: `https://www.googleapis.com/auth/gmail.readonly`, `gmail.send`, `gmail.modify`
3. Create **Pub/Sub topic** and grant `gmail-api-push@system.gserviceaccount.com` **Publisher** on the topic.
4. Create a **push subscription** to `https://www.hercule.dev/api/webhooks/gmail` (or preview URL).

## Environment

See root [`.env.example`](../../../.env.example):

| Variable | Purpose |
|----------|---------|
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | OAuth client |
| `GMAIL_REFRESH_TOKEN` | Mailbox refresh token |
| `GMAIL_MAILBOX` | Default `thomas@hercule.dev` |
| `GMAIL_FROM` | From header on send |
| `GMAIL_PUBSUB_TOPIC` | Full topic name for `users.watch` |
| `GMAIL_PUBSUB_PUSH_SECRET` | Optional shared secret header on webhook |

## Operations

- **Cron** (Vercel): `GET/POST /api/cron/gmail-client-inbox` every 5 min — incremental sync + watch renew.
- **Webhook**: `POST /api/webhooks/gmail` — Pub/Sub push triggers sync.
- **Backfill**: `pnpm backfill-client-inbox-from-gmail` (90 days, client-matched only).
- **Unit tests**: `pnpm exec vitest run lib/engin/client-inbox/client-inbox.test.ts`
- **Watch** expires ~7 days; cron renews when expiration &lt; 24h.

## Runbook

- Refresh token revoked → re-authorize OAuth and update `GMAIL_REFRESH_TOKEN`.
- `last_error` on `client_inbox_sync_state` → check Vercel logs `[gmail-client-inbox]`.
- Missing history → run backfill script once.
