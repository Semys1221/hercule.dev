# 024 — Fix hercule/space-axis-in-internal in components/internal/funnels/bookings/bookings-table.tsx

- **Status**: TODO
- **Commit**: 9bd8695
- **Severity**: HIGH
- **Category**: Maintainability
- **Rule**: hercule/hercule/space-axis-in-internal
- **Estimated scope**: 1 file

## Problem

Location: `components/internal/funnels/bookings/bookings-table.tsx:575`

Use flex with gap-* instead of space-y-* / space-x-* (hercule-ui)

Surface: **internal** | Source: hercule-static

## Target

Follow the canonical fix recipe:

Canonical fix unavailable (404). See https://www.react.doctor/prompts/rules/hercule/space-axis-in-internal.md

## Repo conventions to follow

- Skill: `hercule-nextjs-internal`
- Exemplar: `components/internal/funnels/sales/sales-funnel-module.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/internal/funnels/bookings/bookings-table.tsx` at line 575.
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
- **Done when**: diagnostic at `components/internal/funnels/bookings/bookings-table.tsx:575` is resolved.
