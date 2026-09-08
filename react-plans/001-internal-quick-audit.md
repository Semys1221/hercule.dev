# 001 — Internal components quick audit

**Commit:** `9bd8695`  
**Scope:** `components/internal/**`  
**Scan:** `npx react-doctor@latest --scope full -y components/internal`  
**Score (scoped):** 80 (project-wide baseline remains **49**)

## Summary

78 warnings across internal UI. Highest leverage for consistency with [hercule-ui](../.cursor/skills/hercule-ui/SKILL.md) and shadcn rules:

| Severity | Category | Rule | Count | Finding |
|----------|----------|------|-------|---------|
| HIGH | Bugs | `no-fetch-response-used-without-status-check` | 4 | `fetch()` used without checking `response.ok` before reading JSON |
| HIGH | Accessibility | `label-has-associated-control` | 3 | Labels not wired to controls |
| MEDIUM | Maintainability | `design-no-space-on-flex-children` | 5 | `space-y-*` / `space-x-*` instead of `flex` + `gap-*` |
| MEDIUM | Maintainability | `no-giant-component` | 8 | Components exceed complexity threshold — split toolbars/tables |
| MEDIUM | Performance | `js-set-map-lookups` | 10 | `array.includes()` in loops — use `Set` |
| MEDIUM | Bugs | `no-array-index-as-key` | 4 | Unstable list keys |
| LOW | Performance | `js-combine-iterations` | 6 | Chained `.filter().map()` |

## Recommended plans (execute in order)

### Plan A — Fetch guards on admin tables (HIGH)

**Files to inspect first** (from scan):

- `components/internal/**` files with `no-fetch-response-used-without-status-check` (grep the rule or search `await fetch` without `response.ok`).

**Target pattern** (from [hercule-tables](../.cursor/skills/hercule-tables/SKILL.md)):

```tsx
const res = await fetch(query);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { clients } = (await res.json()) as { clients: ClientRow[] };
```

**Verify:** `pnpm doctor --scope changed`, `pnpm e2e:internal-ops`.

---

### Plan B — Replace `space-y-*` with `flex gap-*` (MEDIUM)

**Rule:** `react-doctor/design-no-space-on-flex-children`  
**Canonical fix:** https://www.react.doctor/prompts/rules/react-doctor/design-no-space-on-flex-children.md

**Known hits:** fiche-form, funnel builder sections, clients-table outer wrapper (`space-y-4` → `flex flex-col gap-4`).

**Verify:** `pnpm doctor:design`, visual `pnpm e2e:visual` on `/internal`.

---

### Plan C — Label association in forms (HIGH a11y)

**Rule:** `label-has-associated-control`, `shadcn-form-item-requires-label`  
Migrate touched forms to `Field` + `FieldLabel` per [hercule-forms](../.cursor/skills/hercule-forms/SKILL.md).

**Exemplar migration:** [`fiche-form.tsx`](../components/internal/funnels/fiche-form.tsx).

---

## Missed opportunities (not in scan)

1. **Error boundary** around `funnel-editor` and heavy client trees.
2. **Suspense** on `/internal/funnels/*` data tables to avoid layout jump.
3. **Split context** in sales funnel module if Profiler shows wide re-renders.

## Out of scope

- Marketing `components/agence/**` — covered by `doctor.config.ts` overrides.
- Streamlit apps — excluded via `ignore.files`.
