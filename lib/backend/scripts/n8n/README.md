# n8n Community (self-hosted)

Glue orchestration for Hercule: Instantly, Supabase, crons, webhooks. **Community Edition** (no n8n license fee). You pay only for Docker host resources.

Stack: **PostgreSQL 16** + **n8n** (UI on `127.0.0.1:5678` by default).

## Quick start (Mac)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
bash lib/backend/scripts/n8n/install-local.sh
open http://127.0.0.1:5678
```

On first visit, create the **owner** account (in addition to HTTP Basic Auth from `.env`).

## VPS

On the server (as root), from a checkout with `VPS_REPO_ROOT` if needed:

```bash
sudo bash lib/backend/scripts/vps/install-n8n.sh
```

From your Mac:

```bash
ssh -L 5678:127.0.0.1:5678 "${VPS_USER:-$USER}@${VPS_HOST}"
open http://127.0.0.1:5678
```

Credentials (generated once):

```bash
ssh "$VPS_USER@$VPS_HOST" 'cat /root/.hercule/n8n-basic-auth-password'
# Basic auth user: admin (see install script)
```

## Secrets

| Secret | Location |
|--------|----------|
| Compose `.env` | `lib/backend/scripts/n8n/.env` (gitignored) |
| VPS generated | `/root/.hercule/n8n-encryption-key`, `n8n-postgres-password`, `n8n-basic-auth-password` |

**Never rotate `N8N_ENCRYPTION_KEY`** after storing credentials in n8n without a documented migration. Back up Postgres regularly (`backup.sh`).

## Registered Community (free)

Register the instance with your email to unlock folders, editor debug, and custom execution data:

[Community edition features](https://docs.n8n.io/deploy/host-n8n/community-edition-features)

## Webhooks

| Environment | `WEBHOOK_URL` |
|-------------|----------------|
| Local manual runs | `http://localhost:5678/` (default) |
| Local SaaS callbacks | Use [n8n tunnel](https://docs.n8n.io/hosting/installation/npm/#tunnel) or Cloudflare Tunnel temporarily |
| VPS production | **Phase 2**: HTTPS reverse proxy or tunnel → set `WEBHOOK_URL=https://n8n.your-domain/` in `.env`, then `docker compose up -d` |

Until `WEBHOOK_URL` is public HTTPS on the VPS, **schedule triggers and outbound calls work**; external SaaS webhooks (Instantly, Stripe, …) will not reach n8n.

Do **not** bind `0.0.0.0:5678` on the public internet without TLS and strong auth.

## Coexistence with Next.js / Vercel

Existing webhooks (e.g. `/api/webhooks/instantly`) must stay single-source until a workflow is migrated. Disable the old route or workflow when n8n takes over an event.

See [lib/doc/architecture.md](../../../../doc/architecture.md) for the hybrid model.

## Hercule credentials in n8n

Create credentials in the n8n UI (Supabase Postgres or HTTP, Instantly API key, Resend, etc.). Mirror names from [streamlit_scraper README](../../streamlit_scraper/README.md) env vars — copy values from the root `.env` manually; do not commit secrets.

Optional: Cursor **user-n8n** MCP with instance URL + API key (n8n Settings → API).

## Workflows in Git

Export all workflows to the repo:

```bash
bash lib/backend/scripts/n8n/export-workflows.sh
```

Imports are done from the n8n UI or CLI inside the container (see export script header).

## Backup

```bash
bash lib/backend/scripts/n8n/backup.sh
# Archives under lib/backend/scripts/n8n/backups/ (gitignored)
```

## Operations

```bash
cd lib/backend/scripts/n8n
docker compose ps
docker compose logs -f n8n
docker compose down   # keeps volumes
```

## License

n8n [Sustainable Use License](https://docs.n8n.io/privacy-and-security/sustainable-use-license) — internal business use for Hercule is in scope; do not resell hosted n8n access.
