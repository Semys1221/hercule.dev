# Supabase archive exports

Run before destructive migrations:

```bash
pnpm export-supabase-cleanup-archive
```

Outputs land in `pre-drop-YYYY-MM-DD/` (CSV + `manifest.json`). CSV files are gitignored.
