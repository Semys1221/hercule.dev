#!/usr/bin/env python3
"""Relaunch VPS scrape workers: sync geo config, reset geo state, restart systemd."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

REPO = Path(__file__).resolve().parents[2]
load_dotenv(REPO / ".env")
sys.path.insert(0, str(REPO / "app" / "streamlit_scraper"))

from bootstrap.vps_control import VpsConfig, _connect_ssh, _ssh_exec, worker_status  # noqa: E402

DEBUG_LOG = REPO / ".cursor" / "debug-371b26.log"
SESSION_ID = "371b26"
DEBUG_ENDPOINT = "http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d"

SYNC_PATHS = (
    "app/streamlit_scraper/commune_passes.py",
    "app/streamlit_scraper/core_logic.py",
    "app/streamlit_scraper/outscraper_client.py",
    "app/streamlit_scraper/main.py",
    "app/streamlit_scraper/configs/_bases/common.py",
    "app/streamlit_scraper/configs/cabinets_expertise_comptable_vol_config.py",
    "app/streamlit_scraper/configs/cabinets_conseiller_financier_config.py",
)


def _debug_log(hypothesis_id: str, message: str, data: dict, *, run_id: str = "relaunch") -> None:
    # region agent log
    payload = {
        "sessionId": SESSION_ID,
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": "scripts/streamlit_scraper/relaunchVpsScrapers.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    with open(DEBUG_LOG, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")
    try:
        import urllib.request

        urllib.request.urlopen(
            urllib.request.Request(
                DEBUG_ENDPOINT,
                data=json.dumps(payload).encode(),
                headers={
                    "Content-Type": "application/json",
                    "X-Debug-Session-Id": SESSION_ID,
                },
                method="POST",
            ),
            timeout=1,
        )
    except Exception:
        pass
    # endregion


def _remote_python(cfg: VpsConfig, script: str) -> tuple[int, str, str]:
    import base64

    repo = cfg.repo_root
    encoded = base64.b64encode(script.encode("utf-8")).decode("ascii")
    cmd = (
        f"cd {repo}/app/streamlit_scraper && "
        f"export HERCULE_DATA_ROOT={cfg.data_root} PYTHONPATH={repo} && "
        f"echo {encoded} | base64 -d | {repo}/.venv/bin/python"
    )
    return _ssh_exec(cfg, cmd, timeout=120)


def sync_repo_files(cfg: VpsConfig) -> tuple[bool, list[str]]:
    uploaded: list[str] = []
    try:
        client = _connect_ssh(cfg)
        sftp = client.open_sftp()
        try:
            for rel in SYNC_PATHS:
                local = REPO / rel
                remote = f"{cfg.repo_root}/{rel}"
                sftp.put(str(local), remote)
                uploaded.append(rel)
        finally:
            sftp.close()
            client.close()
    except Exception as exc:
        _debug_log("H0", "sync failed", {"error": str(exc), "uploaded": uploaded})
        return False, uploaded
    _debug_log("H0", "sync ok", {"uploaded": uploaded})
    return True, uploaded


def relaunch_comptable_vol(cfg: VpsConfig) -> tuple[bool, str]:
    script = """
import json, os
from config_loader import load_config
from commune_passes import initial_geo_state

preset = 'cabinets_expertise_comptable_vol'
data_root = os.environ['HERCULE_DATA_ROOT']
path = f'{data_root}/streamlit_scraper/output/{preset}/scrape_state.json'
config = load_config(preset)
geo_phase, query_pass, skip_places = initial_geo_state(config)
with open(path, encoding='utf-8') as f:
    state = json.load(f)
before = {k: state.get(k) for k in ('geo_reload_exhausted','reload_round','query_pass','geo_phase','instantly_pushed')}
state.pop('geo_reload_exhausted', None)
state['reload_round'] = 0
state['reload_round_pushed_start'] = int(state.get('instantly_pushed', 0) or 0)
state['geo_phase'] = geo_phase
state['query_pass'] = query_pass
state['skip_places'] = skip_places
state['last_completed_batch_index'] = -1
state['last_submitted_batch_index'] = -1
state['inflight_tasks'] = []
state['status'] = 'incomplete'
with open(path, 'w', encoding='utf-8') as f:
    json.dump(state, f, indent=2)
print(json.dumps({'before': before, 'after': {'geo_reload_exhausted': state.get('geo_reload_exhausted'), 'reload_round': state.get('reload_round'), 'query_pass': state.get('query_pass'), 'geo_phase': state.get('geo_phase')}}))
"""
    code, out, err = _remote_python(cfg, script)
    _debug_log("H1", "comptable_vol geo reset", {"exit": code, "stdout": out[:500], "stderr": err[:500]})
    if code != 0:
        return False, err or out or f"exit {code}"
    restart = _ssh_exec(cfg, "systemctl restart hercule-scraper-comptable-vol", timeout=60)
    _debug_log("H1", "comptable_vol restart", {"exit": restart[0], "out": restart[1][:200]})
    return restart[0] == 0, out.strip() or "restarted"


def relaunch_conseiller(cfg: VpsConfig) -> tuple[bool, str]:
    script = """
import json, os
from config_loader import load_config
from commune_passes import initial_geo_state

preset = 'cabinets_conseiller_financier'
data_root = os.environ['HERCULE_DATA_ROOT']
out_dir = f'{data_root}/streamlit_scraper/output/{preset}'
removed = []
for pattern in ('workspace_emails.json', 'workspace_emails.json.tmp'):
    path = os.path.join(out_dir, pattern)
    if os.path.isfile(path):
        os.remove(path)
        removed.append(path)
config = load_config(preset)
geo_phase, query_pass, skip_places = initial_geo_state(config)
path = f'{out_dir}/scrape_state.json'
with open(path, encoding='utf-8') as f:
    state = json.load(f)
before = {k: state.get(k) for k in ('geo_reload_exhausted','reload_round','query_pass','geo_phase','status','continuous_zero_streak')}
state.pop('geo_reload_exhausted', None)
state['reload_round'] = 0
state['reload_round_pushed_start'] = int(state.get('instantly_pushed', 0) or 0)
state['geo_phase'] = geo_phase
state['query_pass'] = query_pass
state['skip_places'] = skip_places
state['last_completed_batch_index'] = -1
state['last_submitted_batch_index'] = -1
state['inflight_tasks'] = []
state['continuous_zero_streak'] = 0
state['status'] = 'incomplete'
with open(path, 'w', encoding='utf-8') as f:
    json.dump(state, f, indent=2)
print(json.dumps({'removed': removed, 'before': before, 'after': {'query_pass': state.get('query_pass'), 'geo_phase': state.get('geo_phase'), 'reload_round': state.get('reload_round')}}))
"""
    code, out, err = _remote_python(cfg, script)
    _debug_log("H2", "conseiller cache clear + geo reset", {"exit": code, "stdout": out[:500], "stderr": err[:500]})
    if code != 0:
        return False, err or out or f"exit {code}"
    restart = _ssh_exec(cfg, "systemctl restart hercule-scraper-conseiller-financier", timeout=60)
    _debug_log("H2", "conseiller restart", {"exit": restart[0], "out": restart[1][:200]})
    return restart[0] == 0, out.strip() or "restarted"


def collect_post_status(cfg: VpsConfig) -> dict[str, object]:
    report: dict[str, object] = {}
    for preset, svc in [
        ("cabinets_expertise_comptable_vol", "hercule-scraper-comptable-vol"),
        ("cabinets_conseiller_financier", "hercule-scraper-conseiller-financier"),
    ]:
        svc_cfg = VpsConfig(
            host=cfg.host,
            user=cfg.user,
            password=cfg.password,
            repo_root=cfg.repo_root,
            data_root=cfg.data_root,
            service_name=svc,
        )
        st = worker_status(cfg=svc_cfg)
        data_root = cfg.data_root
        for name in ("worker_heartbeat.json", "scrape_state.json"):
            cmd = f"cat {data_root}/streamlit_scraper/output/{preset}/{name} 2>/dev/null"
            code, stdout, _ = _ssh_exec(cfg, cmd, timeout=30)
            if code == 0 and stdout.strip():
                try:
                    report[f"{preset}/{name}"] = json.loads(stdout)
                except json.JSONDecodeError:
                    report[f"{preset}/{name}"] = stdout[:300]
        cmd = f"tail -n 5 {data_root}/streamlit_scraper/output/{preset}/scrape.log 2>/dev/null"
        _, log_tail, _ = _ssh_exec(cfg, cmd, timeout=30)
        report[f"{preset}/scrape_log_tail"] = log_tail
        report[f"status_{preset}"] = st
    return report


def main() -> int:
    cfg = VpsConfig.from_env()
    if not cfg:
        print("VPS not configured")
        return 1

    results: dict[str, object] = {}
    ok_sync, uploaded = sync_repo_files(cfg)
    results["sync"] = {"ok": ok_sync, "uploaded": uploaded}
    if not ok_sync:
        print(json.dumps(results, indent=2))
        return 1

    ok1, msg1 = relaunch_comptable_vol(cfg)
    results["comptable_vol"] = msg1
    ok2, msg2 = relaunch_conseiller(cfg)
    results["conseiller"] = msg2

    time.sleep(20)
    post = collect_post_status(cfg)
    results["post_relaunch"] = post
    _debug_log("H3", "post-relaunch snapshot", post, run_id="post-relaunch")

    print(json.dumps(results, indent=2, default=str))
    return 0 if ok1 and ok2 else 1


if __name__ == "__main__":
    raise SystemExit(main())
