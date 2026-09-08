---
name: myemailverifier
description: Integrate MyEmailVerifier email validation API — single verify, credits, bulk upload, catch-all scoring, lead generation. Use when verifying emails, building validation flows, or calling myemailverifier.com APIs.
---

# MyEmailVerifier API

Official docs source: [pat-myemailverifier/myemailverifier-api](https://github.com/pat-myemailverifier/myemailverifier-api) (MIT). For full endpoint details, request/response shapes, and error codes, read [reference.md](reference.md).

## When to use this skill

- Validating a single email before send or signup
- Bulk list verification (CSV/TXT upload + poll)
- Scoring catch-all addresses (deep catch-all API)
- Lead search / reveal (prompt, name+company, LinkedIn URL)
- Checking API credit balance
- Implementing rate-limit backoff or error handling for MyEmailVerifier

## Environment

- **`MYEMAILVERIFIER_API_KEY`** — required in server-side code only (`process.env.MYEMAILVERIFIER_API_KEY`)
- Never hardcode keys, expose them in client components, or commit them to git
- Optional: `MYEMAILVERIFIER_FAST_BASE_URL` default `https://api.myemailverifier.com`
- Optional: `MYEMAILVERIFIER_CLIENT_BASE_URL` default `https://client.myemailverifier.com`

## Defaults

| Task | Base URL | Endpoint |
|------|----------|----------|
| Single email verify (preferred) | `api.myemailverifier.com` | `GET /api/validate_single.php?apikey=…&email=…` |
| Credits, bulk, catch-all, leads | `client.myemailverifier.com` | See [reference.md](reference.md) |

**Rate limit:** 30 requests/min per API key (default). On HTTP 429, backoff and retry.

**Timeout:** 10–30 seconds recommended (SMTP verification can take 3–30s on cache miss).

## Status decision guide

After single verification, use the `Status` field:

| Status | Action |
|--------|--------|
| `Valid` | Safe to send |
| `Invalid` | Reject or ask user to correct |
| `Catch-all` | Domain accepts all mail — use deep catch-all scoring if you need confidence |
| `Unknown` | Retry later or accept with caution (greylisting / timeout) |

Also check `Disposable_Domain`, `Role_Based`, and `Free_Domain` string booleans (`"true"` / `"false"`).

## Hercule integration pattern

1. Add a thin server wrapper under `lib/myemailverifier/` (e.g. `validate-email.ts`, `get-credits.ts`)
2. Call only from **API routes**, server actions, or background jobs — never from `"use client"` components
3. Return typed results to the UI; keep the API key on the server
4. Cache validation results per email when the same address may be checked repeatedly

### Minimal server wrapper example

```typescript
// lib/myemailverifier/validate-email.ts
const FAST_BASE = "https://api.myemailverifier.com";

export type MyEmailVerifierResult = {
  address: string;
  status: "Valid" | "Invalid" | "Catch-all" | "Unknown" | string;
  diagnosis: string;
  catchAll: boolean;
  disposable: boolean;
  roleBased: boolean;
  freeDomain: boolean;
};

export async function validateEmail(email: string): Promise<MyEmailVerifierResult> {
  const apiKey = process.env.MYEMAILVERIFIER_API_KEY;
  if (!apiKey) {
    throw new Error("MYEMAILVERIFIER_API_KEY is not configured");
  }

  const url = new URL(`${FAST_BASE}/api/validate_single.php`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("email", email);

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`MyEmailVerifier HTTP ${response.status}`);
  }

  const data = (await response.json()) as Record<string, string>;
  return {
    address: data.Address ?? email,
    status: data.Status ?? "Unknown",
    diagnosis: data.Diagnosis ?? "",
    catchAll: data.catch_all === "true",
    disposable: data.Disposable_Domain === "true",
    roleBased: data.Role_Based === "true",
    freeDomain: data.Free_Domain === "true",
  };
}
```

## Further reading

- [reference.md](reference.md) — all endpoints, auth methods, HTTP errors, catch-all & lead APIs
- Upstream: [docs/API_REFERENCE.md](https://github.com/pat-myemailverifier/myemailverifier-api/blob/main/docs/API_REFERENCE.md)
