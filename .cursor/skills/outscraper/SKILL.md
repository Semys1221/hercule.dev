---
name: outscraper
description: Integrate Outscraper business data API — Google Maps search, async requests, contacts enrichment. Use when calling Outscraper, OUTSCRAPER_API_KEY, google-maps-search, or extending the Hercule scraper pipeline.
---

# Outscraper API

Official docs source: [app.outscraper.cloud/api-docs](https://app.outscraper.cloud/api-docs) (OpenAPI v0.4.3). For full endpoint details, request/response shapes, and error codes, read [reference.md](reference.md).

## When to use this skill

- Calling Outscraper Google Maps Search (sync or async)
- Debugging scrape batches, polling, or task cancellation
- Adding new Outscraper endpoints (reviews, emails, enrichments)
- Tuning `OUTSCRAPER_*` config for the Hercule pipeline
- Implementing rate-limit backoff or error handling for Outscraper

## Environment

- **`OUTSCRAPER_API_KEY`** — required in server-side code only (`process.env` / repo root `.env`)
- Never hardcode keys, expose them in client components, or commit them to git

Optional tuning (defaults in [`configs/_bases/common.py`](../../app/streamlit_scraper/configs/_bases/common.py)):

| Variable | Default | Role |
|----------|---------|------|
| `OUTSCRAPER_BATCH_SIZE` | `200` | Queries per API request |
| `OUTSCRAPER_CONCURRENCY` | `6` | In-flight async tasks |
| `OUTSCRAPER_LIMIT_PER_QUERY` | `30` | Places per query |
| `OUTSCRAPER_POLL_INITIAL_S` | `45` | Wait before first poll |
| `OUTSCRAPER_POLL_INTERVAL_S` | `5` | Poll interval (fast) |
| `OUTSCRAPER_POLL_SLOW_S` | `10` | Poll interval (slow) |
| `OUTSCRAPER_POLL_TIMEOUT_S` | `600` | Max wait per task |
| `OUTSCRAPER_TOTAL_LIMIT_BUFFER` | `8` | Multiplier for `totalLimit` cap |

## Defaults

| Item | Value |
|------|-------|
| Primary base URL | `https://api.outscraper.cloud` |
| Legacy fallback | `https://api.outscraper.com` |
| Auth | `X-API-KEY: YOUR-API-KEY` header (preferred) |
| QPS | ~20 average; scale on request |
| Async | Preferred (`async=true`) to avoid HTTP timeouts |

**Rate limit:** On HTTP 429, honor `Retry-After` and backoff. On 5xx or `"Too many requests"` in `errorMessage`, exponential backoff.

## Async workflow

1. **Submit** — `POST /google-maps-search` with `async: true` → receive `{ "id": "…", "status": "Pending" }`
2. **Poll** — `GET /requests/{id}` until `status` is `Success` (or failure / timeout)
3. **Read** — `data` field contains business records (array or nested arrays per query)
4. **Cancel** (optional) — `DELETE /requests/{id}` to terminate in-flight jobs
5. **List running** — `GET /requests?type=running&pageSize=100`

Results are available for **4 hours** after completion.

## Hercule integration pattern

1. **Do not reimplement** — use `OutscraperClient` in [`core_logic.py`](../../app/streamlit_scraper/core_logic.py)
2. Pipeline workflow (scrape → enrich → SIRENE → Instantly) lives in [`hercule-streamlit-scraper`](../hercule-streamlit-scraper/SKILL.md)
3. API key loaded via `config_loader.py` from repo `.env`
4. Queries built as `"{keyword} in {location}, France"` with `language=fr`, `region=FR`

### What Hercule sends today

```json
{
  "query": ["expert comptable in Lyon, France", "..."],
  "limit": 30,
  "async": true,
  "dropDuplicates": true,
  "language": "fr",
  "region": "FR",
  "extractContacts": true,
  "totalLimit": 240
}
```

`extractContacts` is legacy; the current API docs prefer `enrichment=leads_n_contacts`. Keep `extractContacts` when editing the existing client unless migrating deliberately.

## Minimal examples

### Submit async batch

```bash
curl -X POST "https://api.outscraper.cloud/google-maps-search" \
  -H "X-API-KEY: $OUTSCRAPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": ["restaurants in Paris, France"],
    "limit": 10,
    "async": true,
    "dropDuplicates": true,
    "language": "fr",
    "region": "FR"
  }'
```

### Poll results

```bash
curl -H "X-API-KEY: $OUTSCRAPER_API_KEY" \
  "https://api.outscraper.cloud/requests/TASK_ID"
```

### Cancel task

```bash
curl -X DELETE -H "X-API-KEY: $OUTSCRAPER_API_KEY" \
  "https://api.outscraper.cloud/requests/TASK_ID"
```

## Further reading

- [reference.md](reference.md) — endpoints, params, response fields, error handling
- Hercule client: [`app/streamlit_scraper/core_logic.py`](../../app/streamlit_scraper/core_logic.py) (`OutscraperClient`)
- Deploy / env: [`doc/render-outreach.md`](../../doc/render-outreach.md)
