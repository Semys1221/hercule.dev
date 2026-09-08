# 006 — Fix no-fetch-response-used-without-status-check in components/internal/funnels/bookings/bookings-table.tsx

- **Status**: TODO
- **Commit**: 9bd8695
- **Severity**: HIGH
- **Category**: Bugs
- **Rule**: react-doctor/no-fetch-response-used-without-status-check
- **Estimated scope**: 1 file

## Problem

Location: `components/internal/funnels/bookings/bookings-table.tsx:295`

`fetch()` resolves (does not reject) on HTTP 4xx/5xx, so this unchecked body read may treat an HTTP error payload like a successful response. Check `response.ok`/`response.status`, or deliberately handle the API's error payload, before reading the body.

Surface: **internal** | Source: react-doctor

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

Check `response.ok` (or `response.status`) before consuming a `fetch` Response with `.json()`/`.text()`/`.blob()`. `fetch` resolves on HTTP 4xx/5xx, so an unchecked response parses the error body as success or crashes on an always-truthy guard.

## Repo conventions to follow

- Skill: `hercule-tables`
- Exemplar: `components/internal/clients/clients-table.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/internal/funnels/bookings/bookings-table.tsx` at line 295.
2. Apply the canonical fix without changing unrelated code.
3. Run verification commands below.

## Boundaries

- Do NOT change public component APIs unless required by the fix.
- Do NOT refactor marketing inline styles unless this file is internal/dashboard.
- STOP if the file has drifted from commit 9bd8695; re-run `pnpm frontend-audit scan`.

## Verification

- **Mechanical**: `pnpm doctor` — targeted diagnostic cleared, score not regressed.
- **Lint**: `pnpm lint`
- **Visual** (if UI changed): `pnpm e2e:visual` for affected surface.
- **Done when**: diagnostic at `components/internal/funnels/bookings/bookings-table.tsx:295` is resolved.
