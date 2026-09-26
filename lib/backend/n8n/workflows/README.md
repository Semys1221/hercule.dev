# n8n workflow exports

JSON exports from `bash lib/backend/scripts/n8n/export-workflows.sh`.

Import via n8n UI (**Workflows → Import**) or:

```bash
cd lib/backend/scripts/n8n
docker compose exec n8n n8n import:workflow --input=/path/to/file.json
```

Keep exports in sync when changing production workflows on the VPS.
