# Outscraper API Reference

Condensed from [app.outscraper.cloud/api-docs](https://app.outscraper.cloud/api-docs) (OpenAPI v0.4.3). Sync manually when upstream changes.

## Base URLs

| Name | URL | Use for |
|------|-----|---------|
| Cloud API (primary) | `https://api.outscraper.cloud` | All new integrations |
| Legacy API | `https://api.outscraper.com` | Fallback (`/maps/search-v2`) used by Hercule `OutscraperClient` |

Average QPS: **~20** (contact Outscraper for higher throughput).

---

## Authentication

API key from [account page](https://app.outscraper.cloud/api-key).

| Method | Example |
|--------|---------|
| Header (preferred) | `X-API-KEY: YOUR-API-KEY` |
| Query param (testing only) | `?apiKey=YOUR-API-KEY` |

Store as `OUTSCRAPER_API_KEY` in environment variables. Never expose in client-side code or public repos.

---

## Google Maps Search

Primary endpoint for Hercule lead scraping.

### `POST /google-maps-search` (recommended for batches)

```
POST https://api.outscraper.cloud/google-maps-search
Content-Type: application/json
X-API-KEY: YOUR-API-KEY
```

```json
{
  "query": ["Real estate agency, Rome, Italy", "restaurants, Brooklyn 11203"],
  "limit": 25,
  "async": true,
  "dropDuplicates": true,
  "language": "fr",
  "region": "FR",
  "totalLimit": 100
}
```

### `GET /google-maps-search`

```
GET https://api.outscraper.cloud/google-maps-search?query=restaurants,Manhattan,NY,USA&limit=3&async=false
```

Repeat `query` param for batching (up to **1000** queries per request).

### Key parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string or array | Yes | Google Maps search text, or `google_id` / `place_id` / CID |
| `limit` | integer | Yes | Max places per query (default 500; max 500 per query on Google Maps) |
| `totalLimit` | integer | No | Cap across all queries when `dropDuplicates=true` |
| `dropDuplicates` | boolean | No | Dedupe businesses across batched queries (default `false`) |
| `language` | string | No | UI language (default `en`; Hercule uses `fr`) |
| `region` | string | No | Country code (Hercule uses `FR`) |
| `coordinates` | string | No | `latitude,longitude` for geo bias |
| `skipPlaces` | integer | No | Pagination offset (multiples of 20) |
| `filters` | string[] | No | Quick filters: `only_with_website`, `operational_only`, `verified`, etc. (English only) |
| `enrichment` | string[] | No | Post-processing enrichments (see below) |
| `async` | boolean | No | Default `true`; set `false` for synchronous (risk of timeout) |
| `fields` | string | No | Comma-separated field whitelist |
| `webhook` | string | No | Callback URL on task completion |
| `format` | string[] | No | Export format: `json`, `csv`, `xlsx`, `parquet` |
| `extractContacts` | boolean | No | **Legacy** — Hercule still sends this; prefer `enrichment=leads_n_contacts` for new code |

### Enrichment values

| Value | Description |
|-------|-------------|
| `leads_n_contacts` | Emails, phones, social links from websites |
| `emails_validator_service` | Email deliverability validation |
| `company_websites_finder` | Find websites from business names |
| `disposable_email_checker` | Classify email origins |
| `company_insights_service` | Firmographics (revenue, size, etc.) |
| `phones_enricher_service` | Phone carrier / validation |
| `trustpilot_service` | Trustpilot business data |
| `whitepages_phones` | Phone owner lookup |
| `ai_chain_info` | Chain vs independent flag |

Enrichments increase response time — use `async=true`.

### Responses

| HTTP | Meaning |
|------|---------|
| `200` | Sync success — `data` in body |
| `202` | Async accepted — use `id` to poll `/requests/{id}` |
| `204` | Task finished with no results |

Async task body (submit):

```json
{
  "id": "abc123",
  "status": "Pending"
}
```

Poll result (`GET /requests/{id}`):

```json
{
  "id": "abc123",
  "status": "Success",
  "data": [ /* business objects */ ]
}
```

`status` values: `Pending`, `Success` (and failure states returning empty `data`).

Results available for **4 hours** after completion.

### Business record fields (Hercule-relevant)

Hercule reads these from each place in `data`:

| Field | Notes |
|-------|-------|
| `name` | Business name → CSV `Company` |
| `email` | Primary email string |
| `emails` | Array of `{ "value": "…" }` or strings |
| `email_1` … `email_9` | Alternate email slots |
| `website` / `site` | Company website |
| `category` | Primary category |
| `subtypes` | Sub-category list |
| `full_address` / `city` | Location fields |
| `phone` | Phone number |
| SIRET-related | Extracted via `company_registry.siret_extract` when present |

Email extraction logic: [`core_logic._extract_email`](../../app/streamlit_scraper/core_logic.py).

---

## Request management

Used by Hercule for polling, cancellation, and resume.

### Get request status / results

```
GET https://api.outscraper.cloud/requests/{requestId}
X-API-KEY: YOUR-API-KEY
```

### Cancel request

```
DELETE https://api.outscraper.cloud/requests/{requestId}
X-API-KEY: YOUR-API-KEY
```

Hercule tries cloud first, then legacy base.

### List requests

```
GET https://api.outscraper.cloud/requests?type=running&pageSize=100
```

`type=running` returns in-flight task IDs for the API key.

---

## Legacy: Maps Search v2

Fallback when cloud POST fails:

```
GET https://api.outscraper.com/maps/search-v2
  ?query=…&query=…
  &limit=30
  &async=true
  &dropDuplicates=true
  &language=fr
  &region=FR
  &extractContacts=true
```

Same async polling via `/requests/{id}` on either base URL.

---

## Error handling

| Condition | Action |
|-----------|--------|
| HTTP `429` | Read `Retry-After` header, sleep, retry |
| HTTP `5xx` | Exponential backoff (Hercule: base 2, max 4 retries) |
| HTTP `400` + `"Too many requests"` in `errorMessage` | Backoff and retry |
| `httpx.TimeoutException` | Backoff and retry |
| Poll timeout (`OUTSCRAPER_POLL_TIMEOUT_S`) | Treat as failed batch; resume from checkpoint |

Hercule implementation: `OutscraperClient._request_with_retry` in [`core_logic.py`](../../app/streamlit_scraper/core_logic.py).

---

## Other endpoint families

Full schemas: [app.outscraper.cloud/api-docs](https://app.outscraper.cloud/api-docs).

### Businesses & POI

| Endpoint | Description |
|----------|-------------|
| `GET/POST /google-maps-search` | Google Maps places (primary) |
| `GET /maps/search` | Legacy maps search |
| `POST /businesses` | Business Data API — create/search |
| `GET /businesses/{business_id}` | Fetch business by ID |
| `GET /businesses/similar/{domain}` | Similar businesses |
| `GET /google-places-by-domain` | Places by website domain |
| `GET /bing-maps`, `/yahoo-search`, `/yelp-search`, … | Alternate POI sources |

### Reviews & comments

| Endpoint | Description |
|----------|-------------|
| `GET /google-maps-reviews` | Google Maps reviews |
| `GET /google-play-reviews` | Play Store reviews |
| `GET /trustpilot-reviews` | Trustpilot reviews |
| `GET /yelp-reviews`, `/tripadvisor-reviews`, … | Platform-specific reviews |

### Email related

| Endpoint | Description |
|----------|-------------|
| `GET /emails-and-contacts` | Scrape emails/contacts from domains |
| `GET /leads-and-contacts` | Lead + contact discovery |
| `GET /email-validator` | Validate email addresses |
| `GET /disposable-email-checker` | Disposable email check |
| `GET /emails-finder` | Find emails by name/company |

### Phone related

| Endpoint | Description |
|----------|-------------|
| `GET /phones-enricher` | Phone enrichment |
| `GET /whitepages-phones` | Phone identity lookup |
| `GET /phones-owners` | Phone owner data |

### Domain related

| Endpoint | Description |
|----------|-------------|
| `GET /company-website-finder` | Website from company name |
| `GET /similarweb` | SimilarWeb traffic data |

### Google Search & trends

| Endpoint | Description |
|----------|-------------|
| `GET /google-search` | Google web search |
| `GET /google-search-news`, `/google-search-shopping`, … | Vertical search |
| `GET /google-maps-autocomplete` | Maps autocomplete |
| `GET /google-trends` | Trends data |

### Platform & dashboard

| Endpoint | Description |
|----------|-------------|
| `GET /profile/balance` | Account credit balance |
| `GET /tasks`, `POST /tasks` | UI task management |
| `GET /invoices` | Billing invoices |
| `GET /webhook-calls` | Webhook delivery log |
| `GET /statistics/status` | Usage statistics |
| `GET /locations` | Supported locations |

---

## SDKs

Official SDKs: Python, Ruby, PHP, Node, Go, Java — see [Outscraper GitHub](https://github.com/outscraper).

Hercule uses a thin `httpx` async client instead of the SDK.

---

## Hercule config cross-reference

| API concept | Hercule config / code |
|-------------|----------------------|
| Batched queries | `OUTSCRAPER_BATCH_SIZE`, `build_queries()` |
| Places per query | `OUTSCRAPER_LIMIT_PER_QUERY` |
| Parallel tasks | `OUTSCRAPER_CONCURRENCY` |
| Total cap | `totalLimit` = `remaining * OUTSCRAPER_TOTAL_LIMIT_BUFFER` |
| Poll timing | `OUTSCRAPER_POLL_*` settings |
| Cancel on wipe | `abort_outscraper_jobs()` |

---

## Links

- API docs: https://app.outscraper.cloud/api-docs
- Getting started: https://outscraper.com/google-maps-api/
- Hercule scraper README: [`app/streamlit_scraper/README.md`](../../app/streamlit_scraper/README.md)
