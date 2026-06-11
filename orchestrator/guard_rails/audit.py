"""
L7 — Audit Writer.

Records every L1/L2 guard-rail decision to the append-only `guard_rail_events`
table and emits a parallel Langfuse trace, so the dashboard tile and the SOC2
audit trail have a single source of truth.

Two hard invariants (Sneha):
  1. NEVER persist or log the raw input. We store input_sha256 only — proof that
     a decision was made about a specific input, without retaining the input.
  2. NEVER raise into the request path. The audit write is best-effort: if the
     DB (or Langfuse) is unreachable, we log a warning and return. A guard-rail
     decision must always be *makeable* even when auditing is degraded — mirrors
     EpisodicMemory._recall()'s fail-silent contract.

Session management is self-contained: this module owns a lazy async
sessionmaker (mirroring password_reset_router) so callers (e.g. the intake)
don't have to thread a DB dependency through just to audit.
"""
from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import datetime
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from orchestrator.observability.langfuse_client import get_observability

log = structlog.get_logger(__name__)

# ─── Lazy session wiring (mirrors gateway/auth/password_reset_router.py) ──────

_engine = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def _get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Lazily build the engine/sessionmaker.

    Indirected through a function so tests can monkeypatch the module-level
    `_sessionmaker` (or this getter) without spinning up a real engine.
    """
    global _engine, _sessionmaker
    if _sessionmaker is None:
        db_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://aiworkforce:aiworkforce_dev@localhost:5432/aiworkforce",
        )
        _engine = create_async_engine(db_url, pool_pre_ping=True)
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _sessionmaker


_INSERT_SQL = text(
    """
    INSERT INTO guard_rail_events
        (id, tenant_id, sprint_id, layer, verdict, score, reasons,
         input_sha256, created_at)
    VALUES
        (:id, :tenant_id, :sprint_id, :layer, :verdict, :score, :reasons::jsonb,
         :input_sha256, :created_at)
    """
)


async def record_event(
    tenant_id: str,
    layer: str,
    verdict: str,
    *,
    sprint_id: str | None = None,
    score: int | None = None,
    reasons: list[str] | None = None,
    input_text: str | None = None,
) -> None:
    """Append one guard-rail decision to the audit log + Langfuse.

    `input_text`, if given, is hashed (SHA-256 hex) and discarded — the raw text
    is never bound to SQL or logged. The entire DB write is wrapped fail-silent;
    the Langfuse hook is independently wrapped. Neither path raises.
    """
    input_sha256 = (
        hashlib.sha256(input_text.encode("utf-8")).hexdigest()
        if input_text is not None
        else None
    )

    await _write_db_event(
        tenant_id=tenant_id,
        layer=layer,
        verdict=verdict,
        sprint_id=sprint_id,
        score=score,
        reasons=reasons,
        input_sha256=input_sha256,
    )
    _emit_langfuse_event(tenant_id=tenant_id, layer=layer, verdict=verdict, score=score)


async def _write_db_event(
    *,
    tenant_id: str,
    layer: str,
    verdict: str,
    sprint_id: str | None,
    score: int | None,
    reasons: list[str] | None,
    input_sha256: str | None,
) -> None:
    """Best-effort INSERT into guard_rail_events. Fail-silent like _recall()."""
    params: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "sprint_id": sprint_id,
        "layer": layer,
        "verdict": verdict,
        "score": score,
        "reasons": json.dumps(reasons or []),
        "input_sha256": input_sha256,
        "created_at": datetime.utcnow(),
    }
    try:
        sm = _get_sessionmaker()
        async with sm() as session:
            await session.execute(_INSERT_SQL, params)
            await session.commit()
    except Exception as exc:  # noqa: BLE001 — auditing must never break the request
        log.warning(
            "guard_rails.audit.write_failed",
            layer=layer,
            verdict=verdict,
            error=str(exc),
            error_type=type(exc).__name__,
        )


def _emit_langfuse_event(
    *, tenant_id: str, layer: str, verdict: str, score: int | None
) -> None:
    """Fire the Langfuse hook. No-op when Langfuse is disabled; never raises."""
    try:
        get_observability().record_guardrail_event(
            tenant_id=tenant_id, layer=layer, verdict=verdict, score=score
        )
    except Exception as exc:  # noqa: BLE001 — observability must never break the request
        log.warning(
            "guard_rails.audit.langfuse_failed",
            layer=layer,
            verdict=verdict,
            error=str(exc),
            error_type=type(exc).__name__,
        )
