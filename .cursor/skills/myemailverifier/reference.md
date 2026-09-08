# MyEmailVerifier API Reference

Condensed from [pat-myemailverifier/myemailverifier-api](https://github.com/pat-myemailverifier/myemailverifier-api). Sync manually when upstream changes.

## Base URLs

| Name | URL | Use for |
|------|-----|---------|
| Fast API | `https://api.myemailverifier.com` | Single email validation (recommended for automation) |
| Client API | `https://client.myemailverifier.com` | Credits, bulk upload, catch-all, lead generation |

Default rate limit: **30 req/min** per API key (custom limits on higher plans). Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Authentication

API key from [dashboard](https://client.myemailverifier.com/apis/settings).

| Method | Example |
|--------|---------|
| Query param (GET) | `?apikey=YOUR_API_KEY` |
| URL path | `/verifier/validate_single/{email}/{apikey}` |
| POST form field | `api_key=YOUR_API_KEY` |
| JSON body (some endpoints) | `{ "api_key": "…" }` |

Store as `MYEMAILVERIFIER_API_KEY` in environment variables. Never expose in client-side code.

---

## Core endpoints

### 1. Single email verification (Fast API) — recommended

```
GET https://api.myemailverifier.com/api/validate_single.php?apikey={key}&email={email}
```

**Response (200):**

```json
{
  "Address": "test@example.com",
  "catch_all": "false",
  "Status": "Valid",
  "Disposable_Domain": "false",
  "Role_Based": "false",
  "Free_Domain": "false",
  "Greylisted": "false",
  "Diagnosis": "Mailbox Exists and Active"
}
```

| Field | Description |
|-------|-------------|
| `Status` | `Valid`, `Invalid`, `Catch-all`, or `Unknown` |
| `catch_all` | `"true"` if domain accepts all addresses |
| `Role_Based` | `"true"` for role emails (support@, info@, …) |
| `Disposable_Domain` | `"true"` for temporary email providers |
| `Free_Domain` | `"true"` for Gmail, Yahoo, etc. |
| `Greylisted` | `"true"` if server uses greylisting |
| `Diagnosis` | Human-readable detail |

### 2. Single email verification (Client API)

```
GET https://client.myemailverifier.com/verifier/validate_single/{email}/{apikey}
```

Same semantics as Fast API; use Fast API for new integrations unless you need Client-only features.

### 3. Get credit balance

```
GET https://client.myemailverifier.com/verifier/getcredits/{apikey}
```

```json
{ "credits": "7800" }
```

### 4. Bulk upload

```
POST https://client.myemailverifier.com/verifier/upload_file
Content-Type: multipart/form-data

filename=@emails.txt
api_key=YOUR_API_KEY
```

```json
{
  "status": true,
  "file_name": "emails.txt",
  "file_id": 1670,
  "msg": "File uploaded successfully."
}
```

Accepts `.txt` or `.csv` (one email per line or first column).

### 5. Bulk file status & download

```
GET https://client.myemailverifier.com/verifier/file_info/{apikey}/{file_id}
```

Poll until `status` is `finished` and `ready_for_download` is `"1"`.

| Field | Meaning |
|-------|---------|
| `status` | `processing`, `finished`, or `failed` |
| `file_path` | CSV download URL |
| `xls_file_path` | Excel download URL |
| `valid`, `invalid`, `catchall`, `unknown` | Counts |
| `credit_used` | Credits consumed |

---

## HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid email) |
| 401 | Invalid or missing API key |
| 403 | Forbidden (referer restriction, suspended account) |
| 429 | Rate limit exceeded |
| 500 | Server error — retry with backoff |

**Common JSON errors:**

```json
{ "status": false, "message": "Rate limit exceeded. You can make 30 requests per minute.", "error": "RATE_LIMIT_EXCEEDED" }
```

```json
{ "status": false, "message": "Insufficient credits. Please purchase more credits.", "error": "INSUFFICIENT_CREDITS" }
```

```json
{ "status": false, "message": "Invalid API key", "error": "INVALID_API_KEY" }
```

---

## Deep Catch-All API

Base: `https://client.myemailverifier.com` — **5 credits per email scored**.

Standard verification cannot confirm mailboxes on catch-all domains. This API scores individual addresses.

| Method | Endpoint | Credits |
|--------|----------|---------|
| `GET` | `/catchall/score/{email}/{apikey}` | 5 (sync) |
| `POST` | `/catchall/upload/{apikey}` | 5 per email (async batch) |
| `GET` | `/catchall/status/{apikey}/{job_id}` | 0 |
| `GET` | `/catchall/download/{apikey}/{job_id}` | 0 |
| `GET` | `/catchall/jobs/{apikey}` | 0 |

**Single score response:**

```json
{
  "status": true,
  "email": "john@acme.com",
  "score": 75,
  "verdict": "high_probability",
  "exists": true
}
```

| Verdict | Score | Meaning |
|---------|-------|---------|
| `high_probability` | ≥ 50 | Likely real mailbox — safe to include |
| `low_probability` | < 50 | Weak signals — caution |
| `avoid_send` | any | Do not send |

Batch flow: upload CSV/TXT → poll `/catchall/status` until `has_result: true` → download CSV.

Upstream: [DEEP_CATCHALL_API.md](https://github.com/pat-myemailverifier/myemailverifier-api/blob/main/docs/DEEP_CATCHALL_API.md)

---

## Lead Generation API

Base: `https://client.myemailverifier.com` — JSON POST bodies. Emails returned are verified deliverable before reveal.

| Tool | Endpoint | Cost |
|------|----------|------|
| Prompt search | `POST /leads/search/{apikey}` with `{ "prompt": "…" }` | 5 cr/search |
| LinkedIn finder | `POST /leads/search/{apikey}` with name + `company` | 5 cr/search |
| Find by LinkedIn URL | `POST /leads/linkedin-url/{apikey}` → poll `GET …/{job_id}` | Free submit; 5 cr if no match |
| Reveal contact | `POST /leads/reveal/{apikey}` with `email_token` | 10 cr (free re-reveal within 24h) |
| Save / list / delete | `POST/GET/DELETE /leads/saved/{apikey}` | Free |

Search results return `masked_email` + `email_token` — reveal to get the full address.

LinkedIn URL flow: submit → poll every ~3s until `job_status` is `done` or `failed`. Outcomes: `verified`, `catch_all`, `not_found`.

Upstream: [LEAD_GENERATION_API.md](https://github.com/pat-myemailverifier/myemailverifier-api/blob/main/docs/LEAD_GENERATION_API.md)

---

## TypeScript server example (Next.js)

```typescript
export async function getCredits(): Promise<number> {
  const apiKey = process.env.MYEMAILVERIFIER_API_KEY;
  if (!apiKey) throw new Error("MYEMAILVERIFIER_API_KEY is not configured");

  const response = await fetch(
    `https://client.myemailverifier.com/verifier/getcredits/${apiKey}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) throw new Error(`MyEmailVerifier HTTP ${response.status}`);

  const data = (await response.json()) as { credits: string };
  return Number.parseInt(data.credits, 10);
}
```

---

## Best practices

1. **Cache** validation results to avoid redundant calls (cache hit often &lt; 100ms upstream)
2. **Bulk** via file upload for large lists — cheaper than per-email loops
3. **Server-side only** — API key must not reach the browser
4. **Backoff** on 429 — exponential delay, respect rate limit headers
5. **Catch-all** — run deep catch-all scoring when `Status` is `Catch-all` and deliverability matters
6. **Timeouts** — 10–30s; full SMTP verification can take longer on cache miss

---

## Support

- Email: support@myemailverifier.com
- Dashboard: https://client.myemailverifier.com
- Full upstream docs: https://github.com/pat-myemailverifier/myemailverifier-api
