# Streamlit Clean

## AI agents

Before editing this app, read:
1. [`.cursor/rules/streamlit-tools.mdc`](../../.cursor/rules/streamlit-tools.mdc) (enforced when this path is open)
2. [`.cursor/skills/hercule-streamlit/SKILL.md`](../../.cursor/skills/hercule-streamlit/SKILL.md) (router)
3. [`.cursor/skills/hercule-streamlit-clean/SKILL.md`](../../.cursor/skills/hercule-streamlit-clean/SKILL.md) (this app)

Human reference: sections below.

MyEmailVerifier email list cleaner → Instantly campaign push.

## Quick start

```bash
pnpm streamlit-clean
# or:
cd app/streamlit_clean && pip install -r requirements.txt && streamlit run app.py
```

### Headless CLI (Render / cron)

```bash
export PYTHONPATH=/path/to/repo
cd app/streamlit_clean
python cli.py credits
python cli.py run --list-id <uuid> --campaign-id <uuid> --mode test_50
python cli.py checkpoints
```

See [doc/render-outreach.md](../../doc/render-outreach.md) for Render deployment.

## Environment

Requires in repo root `.env`:

| Variable | Purpose |
|----------|---------|
| `MYEMAILVERIFIER_API_KEY` | Bulk email verification |
| `INSTANTLY_API_KEY` | List fetch, purge, campaign push |

## Pipeline

1. Select source Instantly list
2. Select target campaign
3. Choose run mode (dry / test-50 / full / custom)
4. Execute: quick pre-filter → MyEmailVerifier → optional list purge → push valid leads
5. Review results; workspace duplicate check always on during push

## Checkpoint recovery

Interrupted runs can resume via checkpoint UI. See `checkpoint.py` and `recover_checkpoint.py`.
