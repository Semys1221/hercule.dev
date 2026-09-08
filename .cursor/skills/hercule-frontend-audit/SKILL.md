---
name: hercule-frontend-audit
description: >-
  Retroactive full-project frontend UI audit for Hercule.dev. Use when cleaning up
  legacy TSX, running improve-react-style audits, or when the user asks for
  frontend-audit, legacy UI scan, or whole-project design consistency pass.
---

# Hercule Frontend Audit (retroactive)

Read-only CLI that scans **all** TSX (not just changed files). Complements proactive `pnpm doctor`.

**Location:** [app/react_doctor/README.md](../../app/react_doctor/README.md)

## When to use

- User asks to audit, clean up, or modernize **existing** UI
- Legacy `components/**` predates hercule-ui / shadcn Field patterns
- Need agent manifest with skills, exemplars, and `react-plans/`

Do **not** use for pre-commit regression — use `pnpm doctor` instead.

## Agent workflow

```bash
# 1. Scan (slow)
pnpm frontend-audit scan --surface internal   # or marketing | dashboard | all

# 2. Review
pnpm frontend-audit report

# 3. Plans for execution
pnpm frontend-audit plan --top 10 --effort standard

# 4. One-shot manifest for this session
pnpm frontend-audit bundle --top 5 --out /tmp/frontend-audit.json

# 5. After fixing
pnpm frontend-audit verify --run
```

## Read the manifest

After `bundle`, attach every path in `skillsToAttach` plus shadcn MCP. Follow `agentPrompt` and execute `plansWritten` in order.

## Skills by surface

| Surface | Attach |
|---------|--------|
| internal | hercule-ui, hercule-nextjs-internal, hercule-forms, hercule-tables |
| marketing | hercule-ui, hercule-nextjs-marketing |
| dashboard | hercule-ui, hercule-nextjs-dashboard |

## Verify stack

- `pnpm doctor` — proactive regression on changed files
- `pnpm doctor:design` — design rules
- `pnpm e2e:visual` — if internal/marketing/dashboard UI changed

## Cross-links

- [hercule-ui](../hercule-ui/SKILL.md)
- [react-plans/](../../react-plans/README.md)
- [doctor.config.ts](../../doctor.config.ts)
