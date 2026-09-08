---
name: hercule-tables
description: >-
  Hercule.dev data table patterns — ArchitectureDataTable, toolbar, tabs,
  row actions, empty/loading states, internal admin lists. Use when building
  tables, client lists, bookings, or funnel data views.
---

# Hercule Tables

Data table conventions for internal admin. Read [hercule-ui](../hercule-ui/SKILL.md) for tokens and shadcn MCP for `data-table` blocks.

## Primary exemplar

[`components/internal/clients/clients-table.tsx`](../../components/internal/clients/clients-table.tsx) — copy this structure for new list surfaces.

## Stack

| Piece | Value |
|-------|-------|
| Table | [`ArchitectureDataTable`](../../components/internal/architecture/architecture-data-table.tsx) (typed columns, search, row click) |
| Columns | `ColumnDef<T>[]` with `accessorKey`, custom `cell`, `header` |
| Tabs / filters | `ToggleGroup` + `ToggleGroupItem` (`type="single"`) |
| Row actions | `Button` + `AlertDialog` for destructive ops |
| Status | `Badge` with semantic `variant` |
| Feedback | `toast()` for mutations; inline `text-destructive` for load errors |

## Layout pattern

```tsx
<div className="flex flex-col gap-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <ToggleGroup type="single" value={tab} onValueChange={(v) => v && setTab(v as Tab)} variant="outline">
      <ToggleGroupItem value="agence">Agence</ToggleGroupItem>
      <ToggleGroupItem value="entreprise">Entreprise</ToggleGroupItem>
    </ToggleGroup>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={refresh}>Rafraîchir</Button>
    </div>
  </div>

  {loading ? (
    <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
      Chargement…
    </div>
  ) : error ? (
    <div className="flex min-h-48 items-center justify-center text-sm text-destructive">{error}</div>
  ) : (
    <ArchitectureDataTable
      columns={columns}
      data={rows}
      searchColumn="email"
      searchPlaceholder="Rechercher…"
      onRowClick={(row) => router.push(`/internal/clients/${row.category}/${row.slug}`)}
      getRowId={(row) => row.id}
    />
  )}
</div>
```

## Column helpers

- Extract cell renderers (`StatutBadge`, `companyCell`) as small functions or components **outside** the main export.
- Use `text-muted-foreground` for secondary text; `font-medium` for primary column.
- Date cells: `toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })`.

## Row actions

- Wrap action buttons in `div.flex.items-center.gap-1` with `onClick={(e) => e.stopPropagation()`} so row navigation does not fire.
- Destructive: `AlertDialog` with `AlertDialogTitle` + `AlertDialogDescription` + confirm `AlertDialogAction`.
- External links: `Button asChild` + `<a target="_blank" rel="noopener noreferrer">`.

## Data loading

- `useCallback` for `loadRows(activeTab)`; `useEffect` depends on `[tab, loadRows]`.
- API routes under `/api/admin/*` — no auth header from internal UI (see internal skill).
- Optimistic delete: filter local `rows` in `onDeleted` callback after successful `DELETE`.

## Bookings / funnel tables

Secondary references:

- [`components/internal/funnels/bookings/bookings-table.tsx`](../../components/internal/funnels/bookings/bookings-table.tsx)
- [`components/internal/funnels/email-sequences-table.tsx`](../../components/internal/funnels/email-sequences-table.tsx)

## Do not

- Raw `<table>` HTML — use `ArchitectureDataTable` or shadcn `Table` primitives.
- `space-y-*` for toolbar stacks — use `flex flex-col gap-*` or `gap-*` on flex rows.
- Index keys on dynamic rows when stable `id` exists — pass `getRowId`.

## Quality gate

```bash
pnpm doctor
pnpm e2e:internal-ops   # hub + bookings smoke
```

## Cross-links

- [hercule-ui](../hercule-ui/SKILL.md)
- [hercule-nextjs-internal](../hercule-nextjs-internal/SKILL.md)
- [hercule-forms](../hercule-forms/SKILL.md)
