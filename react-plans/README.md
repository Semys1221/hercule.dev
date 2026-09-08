# React improvement plans (improve-react)

Read-only audits from `improve-react` become executable plans here. Each plan is self-contained for a zero-context agent.

## Status

| # | Plan | Status | Leverage |
|---|------|--------|----------|
| 001 | [internal-quick-audit](./001-internal-quick-audit.md) | OPEN | Baseline scan `components/internal/**` |
| 002 | [002-no-fetch-response-used-without-status-check-book](./002-no-fetch-response-used-without-status-check-book.md) | OPEN | frontend-audit (quick) |
| 003 | [003-hercule-raw-html-primitive-clients-table-tsx](./003-hercule-raw-html-primitive-clients-table-tsx.md) | OPEN | frontend-audit (quick) |
| 004 | [004-no-fetch-response-used-without-status-check-book](./004-no-fetch-response-used-without-status-check-book.md) | OPEN | frontend-audit (standard) |
| 005 | [005-hercule-raw-html-primitive-clients-table-tsx](./005-hercule-raw-html-primitive-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 006 | [006-no-fetch-response-used-without-status-check-book](./006-no-fetch-response-used-without-status-check-book.md) | OPEN | frontend-audit (standard) |
| 007 | [007-hercule-raw-html-primitive-clients-table-tsx](./007-hercule-raw-html-primitive-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 008 | [008-hercule-raw-html-primitive-clients-table-tsx](./008-hercule-raw-html-primitive-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 009 | [009-hercule-raw-html-primitive-clients-table-tsx](./009-hercule-raw-html-primitive-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 010 | [010-hercule-space-axis-in-internal-clients-table-tsx](./010-hercule-space-axis-in-internal-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 011 | [011-no-fetch-response-used-without-status-check-book](./011-no-fetch-response-used-without-status-check-book.md) | OPEN | frontend-audit (standard) |
| 012 | [012-hercule-space-axis-in-internal-clients-table-tsx](./012-hercule-space-axis-in-internal-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 013 | [013-hercule-space-axis-in-internal-bookings-table-ts](./013-hercule-space-axis-in-internal-bookings-table-ts.md) | OPEN | frontend-audit (standard) |
| 014 | [014-hercule-space-axis-in-internal-bookings-table-ts](./014-hercule-space-axis-in-internal-bookings-table-ts.md) | OPEN | frontend-audit (standard) |
| 015 | [015-hercule-space-axis-in-internal-funnel-editor-tsx](./015-hercule-space-axis-in-internal-funnel-editor-tsx.md) | OPEN | frontend-audit (standard) |
| 016 | [016-hercule-space-axis-in-internal-funnel-editor-tsx](./016-hercule-space-axis-in-internal-funnel-editor-tsx.md) | OPEN | frontend-audit (standard) |
| 017 | [017-hercule-space-axis-in-internal-funnel-editor-tsx](./017-hercule-space-axis-in-internal-funnel-editor-tsx.md) | OPEN | frontend-audit (standard) |
| 018 | [018-hercule-space-axis-in-internal-email-sequences-t](./018-hercule-space-axis-in-internal-email-sequences-t.md) | OPEN | frontend-audit (standard) |
| 019 | [019-hercule-space-axis-in-internal-fiche-form-tsx](./019-hercule-space-axis-in-internal-fiche-form-tsx.md) | OPEN | frontend-audit (standard) |
| 020 | [020-hercule-space-axis-in-internal-fiche-form-tsx](./020-hercule-space-axis-in-internal-fiche-form-tsx.md) | OPEN | frontend-audit (standard) |
| 021 | [021-no-fetch-response-used-without-status-check-book](./021-no-fetch-response-used-without-status-check-book.md) | OPEN | frontend-audit (standard) |
| 022 | [022-hercule-space-axis-in-internal-clients-table-tsx](./022-hercule-space-axis-in-internal-clients-table-tsx.md) | OPEN | frontend-audit (standard) |
| 023 | [023-hercule-space-axis-in-internal-bookings-table-ts](./023-hercule-space-axis-in-internal-bookings-table-ts.md) | OPEN | frontend-audit (standard) |
| 024 | [024-hercule-space-axis-in-internal-bookings-table-ts](./024-hercule-space-axis-in-internal-bookings-table-ts.md) | OPEN | frontend-audit (standard) |
| 025 | [025-hercule-space-axis-in-internal-funnel-editor-tsx](./025-hercule-space-axis-in-internal-funnel-editor-tsx.md) | OPEN | frontend-audit (standard) |

## Execution order

1. **001** — Address `design-no-space-on-flex-children` and `no-fetch-response-used-without-status-check` in hot-path tables/forms first.
2. Ratchet `REACT_DOCTOR_MIN_SCORE` in [`.github/workflows/react-doctor.yml`](../.github/workflows/react-doctor.yml) and [`scripts/check-doctor-score.sh`](../scripts/check-doctor-score.sh) after each plan lands (target: **85**).

## Verify after any plan

```bash
pnpm doctor
pnpm lint
pnpm doctor:ci    # score gate (baseline 49)
```

## Related config

- [`doctor.config.ts`](../doctor.config.ts) — rule severities, marketing overrides
- [hercule-ui skill](../.cursor/skills/hercule-ui/SKILL.md) — design tokens
