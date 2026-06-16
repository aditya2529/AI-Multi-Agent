# Migration 005 (`guard_rail_events`) — Round-Trip Verification

- **Date:** 2026-06-11
- **Status:** ⛔ **BLOCKED — not run** (missing prerequisite: a reachable PostgreSQL instance)
- **Owner:** Rohit (DBA) · Sprint: Guard Rails v1, Phase 3 (verify + demo)
- **Migration:** [`20260611_0900_005_guard_rail_events.py`](../../../memory-layer/postgres/migrations/versions/20260611_0900_005_guard_rail_events.py) — `revision = 005_guard_rail_events`, `down_revision = 004_tags`

> **Honesty note (per the Phase 3 hard rule):** No `upgrade`/`downgrade`/`\d`/row-sample output is shown because none was produced — there is no database in this environment. Nothing below is simulated. This file must be re-generated with real captured output before the migration is claimed "verified."

## Why it's blocked (verified, not assumed)

| Check | Command | Result (2026-06-11) |
|---|---|---|
| Docker engine | `docker version` | `docker: command not found` (not installed) |
| Postgres driver | `python -c "import psycopg2"` | `ModuleNotFoundError` (not installed) |
| Postgres on :5432 | psycopg2 connect to `aiworkforce@localhost:5432` | unreachable (driver absent; no server) |

What *was* verified statically (no DB needed): the Alembic revision chain is valid — `python -m alembic history` resolves `004_tags → 005_guard_rail_events (head)`, and the migration file parses. Schema correctness is asserted by inspection against the 004 pattern only; **apply/rollback against a live engine is unverified.**

## How to unblock (run these, then paste each real output into this file)

From the repo root, with Docker available:

```powershell
# 1. Start Postgres (docker-compose.yml at repo root provides it)
docker compose up -d postgres

# 2. Apply — expect head to land at 005_guard_rail_events
python -m alembic upgrade head
python -m alembic current          # capture: should show 005_guard_rail_events (head)

# 3. Inspect schema — capture \d output: 9 columns + 2 indexes
#    (ix_guard_rail_events_tenant_created, ix_guard_rail_events_tenant_verdict_created)
docker compose exec postgres psql -U aiworkforce -d aiworkforce -c "\d guard_rail_events"

# 4. Writer smoke (run from repo root with DATABASE_URL pointing at the container)
python -c "import asyncio; from orchestrator.guard_rails.audit import record_event; asyncio.run(record_event('demo-tenant','L1','blocked', reasons=['injection_intent_phrase'], input_text='smoke test'))"
#    Then confirm EXACTLY ONE row, input_sha256 is 64-hex, and NO raw text 'smoke test' anywhere:
docker compose exec postgres psql -U aiworkforce -d aiworkforce -c "SELECT tenant_id, layer, verdict, score, reasons, input_sha256, created_at FROM guard_rail_events WHERE tenant_id='demo-tenant';"

# 5. Reader + tenant-isolation smoke (API must be running:
#    `uvicorn services.ingestion.api.main:app --port 8000`). demo-tenant counts the
#    seeded/smoke events; a DIFFERENT tenant must see total_blocked=0.
curl -s -H "Authorization: Bearer <demo-tenant-token>" "http://localhost:8000/api/v1/sprints/guard-rails/stats?window_days=7"
curl -s -H "Authorization: Bearer <other-tenant-token>" "http://localhost:8000/api/v1/sprints/guard-rails/stats?window_days=7"   # expect total_blocked=0

# 6. Round-trip: roll back to 004, confirm table+indexes gone, then re-apply to land at 005
python -m alembic downgrade -1
docker compose exec postgres psql -U aiworkforce -d aiworkforce -c "\dt guard_rail_events"   # expect: no rows / does not exist
python -m alembic current          # capture: should show 004_tags
python -m alembic upgrade head     # leave DB at 005
```

## What to capture for the eventual "VERIFIED" version
Paste, verbatim: the `alembic upgrade head` log, `alembic current` (=005), the full `\d guard_rail_events` (9 cols + 2 indexes), the one-row sample showing a 64-hex `input_sha256` with **no** raw payload, the `downgrade -1` log + proof the table is gone, the `current` (=004), the re-`upgrade` log, and `SELECT version();` (Postgres version). Then flip the status line to ✅ VERIFIED.
