"""
Unit tests for L7 — audit.record_event.

Hermetic: no DB, no Langfuse, no network. A fake async sessionmaker captures the
SQL bind params; Langfuse is disabled (uninstalled in this env) so the hook is a
no-op. Asserts the input is hashed (not stored raw), the write is
failure-tolerant, reasons are serialized, and tenant_id is always bound.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

import pytest

import orchestrator.guard_rails.audit as audit
from orchestrator.guard_rails.audit import record_event


# ─── Fake async session / sessionmaker ────────────────────────────────────────


class _FakeSession:
    """Records execute() params; supports async-context-manager use."""

    def __init__(self, store: list[dict[str, Any]], *, commit_raises: bool = False) -> None:
        self._store = store
        self._commit_raises = commit_raises
        self.committed = False

    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *exc: Any) -> None:
        return None

    async def execute(self, _sql: Any, params: dict[str, Any]) -> None:
        self._store.append(params)

    async def commit(self) -> None:
        if self._commit_raises:
            raise RuntimeError("commit failed")
        self.committed = True


class _FakeSessionmaker:
    """Callable returning a fresh _FakeSession (mirrors async_sessionmaker())."""

    def __init__(self, store: list[dict[str, Any]], *,
                 commit_raises: bool = False, build_raises: bool = False) -> None:
        self._store = store
        self._commit_raises = commit_raises
        self._build_raises = build_raises
        self.last_session: _FakeSession | None = None

    def __call__(self) -> _FakeSession:
        if self._build_raises:
            raise RuntimeError("cannot open session")
        self.last_session = _FakeSession(self._store, commit_raises=self._commit_raises)
        return self.last_session


@pytest.fixture
def captured_params(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, Any]]:
    store: list[dict[str, Any]] = []
    sm = _FakeSessionmaker(store)
    # Override the lazy getter so no real engine is ever built.
    monkeypatch.setattr(audit, "_get_sessionmaker", lambda: sm)
    return store


# ─── Hashing — never store raw input ──────────────────────────────────────────


class TestHashing:
    async def test_input_is_sha256_hashed(self, captured_params: list[dict[str, Any]]) -> None:
        raw = "this is the secret requirement text"
        await record_event("tenant-1", "L2", "blocked", score=90, input_text=raw)
        params = captured_params[0]
        expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        assert params["input_sha256"] == expected

    async def test_raw_input_never_appears_in_sql_params(
        self, captured_params: list[dict[str, Any]]
    ) -> None:
        raw = "UNIQUE-SENTINEL-PAYLOAD-12345"
        await record_event("tenant-1", "L1", "blocked", reasons=["fake_delimiters:1"], input_text=raw)
        params = captured_params[0]
        serialized = json.dumps({k: str(v) for k, v in params.items()})
        assert raw not in serialized

    async def test_null_input_yields_null_hash(self, captured_params: list[dict[str, Any]]) -> None:
        await record_event("tenant-1", "L2", "passed_low", input_text=None)
        assert captured_params[0]["input_sha256"] is None


# ─── Failure tolerance — never raise into request path ────────────────────────


class TestFailureTolerance:
    async def test_sessionmaker_build_failure_swallowed(
        self, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        # structlog renders to stdout in this repo, so assert on captured stdout.
        sm = _FakeSessionmaker([], build_raises=True)
        monkeypatch.setattr(audit, "_get_sessionmaker", lambda: sm)
        # Must NOT raise.
        await record_event("tenant-1", "L2", "blocked", score=90, input_text="x")
        assert "guard_rails.audit.write_failed" in capsys.readouterr().out

    async def test_commit_failure_swallowed(
        self, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        store: list[dict[str, Any]] = []
        sm = _FakeSessionmaker(store, commit_raises=True)
        monkeypatch.setattr(audit, "_get_sessionmaker", lambda: sm)
        await record_event("tenant-1", "L2", "flagged", score=70, input_text="x")
        assert "guard_rails.audit.write_failed" in capsys.readouterr().out


# ─── Reasons serialization & binding ──────────────────────────────────────────


class TestSerializationAndBinding:
    async def test_reasons_serialized_as_json(self, captured_params: list[dict[str, Any]]) -> None:
        reasons = ["persona_hijack", "asks the model to roleplay"]
        await record_event("tenant-1", "L2", "blocked", score=90, reasons=reasons, input_text="x")
        params = captured_params[0]
        assert json.loads(params["reasons"]) == reasons

    async def test_reasons_default_empty_list(self, captured_params: list[dict[str, Any]]) -> None:
        await record_event("tenant-1", "L1", "passed_low", input_text="x")
        assert json.loads(captured_params[0]["reasons"]) == []

    async def test_tenant_id_always_bound(self, captured_params: list[dict[str, Any]]) -> None:
        await record_event("tenant-XYZ", "L2", "blocked", score=90, input_text="x")
        assert captured_params[0]["tenant_id"] == "tenant-XYZ"

    async def test_all_columns_present(self, captured_params: list[dict[str, Any]]) -> None:
        await record_event(
            "tenant-1", "L2", "blocked", sprint_id="sprint-9", score=88,
            reasons=["c", "r"], input_text="x",
        )
        params = captured_params[0]
        assert set(params.keys()) == {
            "id", "tenant_id", "sprint_id", "layer", "verdict", "score",
            "reasons", "input_sha256", "created_at",
        }
        assert params["sprint_id"] == "sprint-9"
        assert params["layer"] == "L2"
        assert params["verdict"] == "blocked"
        assert params["score"] == 88

    async def test_score_none_for_l1(self, captured_params: list[dict[str, Any]]) -> None:
        await record_event("tenant-1", "L1", "blocked", reasons=["x"], input_text="y")
        assert captured_params[0]["score"] is None
