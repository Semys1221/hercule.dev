# Frontend Audit CLI

Retroactive UI audit for Hercule.dev — complements proactive `pnpm doctor` (`--scope changed`).

## When to use

| Tool | Scope | Purpose |
|------|-------|---------|
| `pnpm doctor` | Changed files only | Pre-commit / PR regression gate |
| `pnpm frontend-audit` | Full project TSX | Legacy UI cleanup, agent-driven refactors |

## Quick start (Cursor agent)

Run **one command per line** (do not paste the block with inline `#` comments — zsh may mis-parse `(` in comments).

```bash
pnpm frontend-audit scan --surface internal
pnpm frontend-audit report
pnpm frontend-audit plan --top 10
pnpm frontend-audit bundle --top 5 --out /tmp/manifest.json
pnpm frontend-audit verify
pnpm frontend-audit verify --run
```

Shorthand scripts:

```bash
pnpm frontend-audit:scan --surface internal
pnpm frontend-audit:plan --effort quick
pnpm frontend-audit:bundle --out /tmp/manifest.json
```

## Commands

- **scan** — Writes `app/react_doctor/.cache/audit-<sha>.json` and `latest.json`
- **report** — Leverage-ordered table (`--json` for machine output)
- **plan** — Creates `react-plans/NNN-*.md` using improve-react PLAN-TEMPLATE shape
- **bundle** — JSON manifest: skills, MCP steps, top findings, verify commands, `agentPrompt`
- **verify** — Prints checklist; `--run` executes `pnpm doctor`, lint, score

## Flags

```
--surface internal|marketing|dashboard|all
--effort quick|standard|deep
--top <n>
--json
--out <path>
--run          (verify only)
```

## Capabilities wired in

- [doctor.config.ts](../../doctor.config.ts) — design rules, marketing overrides
- [hercule-ui](../../.cursor/skills/hercule-ui/SKILL.md), [hercule-forms](../../.cursor/skills/hercule-forms/SKILL.md), [hercule-tables](../../.cursor/skills/hercule-tables/SKILL.md)
- Surface routing → domain skills (internal, marketing, dashboard)
- Canonical fix URLs from react.doctor
- [react-plans/](../../react-plans/) output
- [e2e/visual-snapshots.spec.ts](../../e2e/visual-snapshots.spec.ts) routes in verify
- [frontend.mdc](../../.cursor/rules/frontend.mdc) MCP checklist in bundle

## Hercule static checks (beyond react-doctor)

- Raw `<button>`, `<input>`, `<table>`, `<dialog>` in TSX
- `space-y-*` / `space-x-*` under internal paths
- `zinc-*`, `#09090B`, `bg-blue-500` under internal paths

## Read-only

This CLI does **not** edit source files. Agents execute `react-plans/` in a separate session.
