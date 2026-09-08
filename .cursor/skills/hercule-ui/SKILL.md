---
name: hercule-ui
description: >-
  Hercule.dev UI design system — shadcn new-york, .internal dark tokens, marketing
  vs admin styling, Lucide icons, forms, motion. Use when building or editing React
  UI, components, pages, layouts, forms, dialogs, tables, or dashboards.
---

# Hercule UI

Brand-specific UI layer on top of shadcn/ui. Read this before composing any React UI.

**Also read:** [internal-design.mdc](../../rules/internal-design.mdc), shadcn MCP (`plugin-shadcn-shadcn`), and shadcn plugin skill for Field/Card/Dialog patterns.

## Stack

| Piece | Value |
|-------|-------|
| Components | shadcn **new-york** — [`components/ui/*`](../../components/ui/) |
| Config | [`components.json`](../../components.json) |
| Icons | **Lucide** only (`lucide-react`) |
| Fonts | Geist / Geist Mono (`app/globals.css` `@theme inline`) |
| Forms | `react-hook-form` + `@hookform/resolvers` + shadcn `Field` / `FieldGroup` |
| Polish registry | `@magicui` (marketing only — via shadcn MCP search) |

## Internal vs marketing

| Surface | Path | Styling |
|---------|------|---------|
| **Internal admin** | `app/internal/**`, `components/internal/**` | `.internal` class → semantic tokens only |
| **Client dashboard** | `app/dashboard/**`, `components/dashboard/**` | Semantic tokens (inherits site theme) |
| **Marketing** | `components/agence/**`, `components/entreprise/**`, `/`, `/entreprise` | Inline `#09090B` and existing marketing styles **OK** — do not refactor to tokens unless asked |

### Internal tokens (use these, never hardcode hex)

Source: [`app/globals.css`](../../app/globals.css) `.internal { ... }` block.

| Token class | Use for |
|-------------|---------|
| `bg-background`, `text-foreground` | Page shell |
| `bg-card`, `border-border` | Cards, panels |
| `text-muted-foreground` | Secondary text, hints |
| `bg-muted`, `bg-accent` | Subtle fills, hover |
| `bg-sidebar`, `border-sidebar-border` | Sidebar chrome |
| `text-sidebar-foreground` | Sidebar labels |
| `bg-primary`, `text-primary-foreground` | Primary actions |
| `bg-destructive` | Danger actions |

Programmatic snapshot for tickets: `captureDesignTokens()` in [`lib/admin/funnels/tokens.ts`](../../lib/admin/funnels/tokens.ts).

**Do not** use `zinc-*`, `#09090B`, or `bg-blue-500` in internal components.

## Brand chrome

- Sidebar headers: [`HerculeMark`](../../components/hercule-mark.tsx) + label « Hercule »
- Reference: [`components/internal/funnels/sidebar-nav.tsx`](../../components/internal/funnels/sidebar-nav.tsx)

## shadcn MCP workflow (required)

1. `search_items_in_registries` — find block (`sidebar-demo`, `dashboard-01`, `data-table-demo`)
2. `get_item_examples_from_registries` — compose from official examples
3. `get_add_command_for_items` if primitive missing
4. `get_audit_checklist` after building

## Composition rules (shadcn plugin skill)

- `flex flex-col gap-*` — never `space-y-*` / `space-x-*`
- Full `Card` structure: `CardHeader` + `CardTitle` + `CardDescription` + `CardContent`
- Forms: `FieldGroup` + `Field` — not raw `div` grids
- Dialogs: always include `DialogTitle` (use `sr-only` if hidden)
- `cn()` for conditional classes
- Semantic colors only — no raw Tailwind palette overrides on shadcn components

## Exemplar components (copy patterns from these)

| Pattern | File |
|---------|------|
| Full-screen internal shell | [`components/internal/funnels/sales/sales-funnel-module.tsx`](../../components/internal/funnels/sales/sales-funnel-module.tsx) |
| Data table + toolbar | [`components/internal/clients/clients-table.tsx`](../../components/internal/clients/clients-table.tsx) |
| Sidebar navigation | [`components/internal/funnels/sidebar-nav.tsx`](../../components/internal/funnels/sidebar-nav.tsx) |
| Onboarding / admin form | [`components/internal/funnels/fiche-form.tsx`](../../components/internal/funnels/fiche-form.tsx) |

Dedicated skills: [hercule-forms](../hercule-forms/SKILL.md), [hercule-tables](../hercule-tables/SKILL.md).

## Motion

| Surface | Guidance |
|---------|----------|
| Internal admin | Tailwind `transition-*` only — calm, dense UI |
| Marketing | `framer-motion` OK for hero/scroll reveals — use sparingly |
| Magic UI | `@magicui` via shadcn MCP — **marketing only** (marquee, shimmer); avoid in `/internal` |

## Quality gate (before commit)

```bash
pnpm doctor          # react-doctor on changed files
pnpm doctor:design   # focused UI/a11y/motion audit (marketing pages)
```

After visible UI changes on `/internal`, `/dashboard`, or marketing routes:

1. MCP `cursor-ide-browser` — navigate, `browser_snapshot`, screenshot hero sections if needed.
2. Or `pnpm e2e:visual` — Playwright visual regression (`e2e/visual-snapshots.spec.ts`).

### Retroactive audit (legacy UI)

For whole-project TSX cleanup (not just changed files):

```bash
pnpm frontend-audit scan --surface internal
pnpm frontend-audit bundle --top 5 --json --out /tmp/frontend-audit.json
```

See [hercule-frontend-audit](../hercule-frontend-audit/SKILL.md).

## Do not

- Add MUI, Chakra, Ant Design, or a second design system
- Use raw `<button>`, `<input>`, `<table>`, `<dialog>` — use `components/ui/*`
- Refactor `components/agence/*` to internal tokens without explicit request
- Manual `z-index` on Dialog/Sheet/Popover (shadcn handles stacking)

## Cross-links

- Internal domain: [hercule-nextjs-internal](../hercule-nextjs-internal/SKILL.md)
- Marketing domain: [hercule-nextjs-marketing](../hercule-nextjs-marketing/SKILL.md)
- Dashboard domain: [hercule-nextjs-dashboard](../hercule-nextjs-dashboard/SKILL.md)
- Forms: [hercule-forms](../hercule-forms/SKILL.md)
- Tables: [hercule-tables](../hercule-tables/SKILL.md)
- Retroactive audit: [hercule-frontend-audit](../hercule-frontend-audit/SKILL.md)
