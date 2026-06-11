"""Add guard_rail_events — append-only L1/L2 guard-rail audit log.

Revision ID: 005_guard_rail_events
Revises: 004_tags
Create Date: 2026-06-11 09:00:00 UTC

============================================================================
SCOPE
============================================================================

One change:

  1. CREATE TABLE guard_rail_events  — append-only audit log for every
     L1 (regex/heuristic) and L2 (model-scored) guard-rail decision made
     at ingestion and during the sprint.

This table is the SOC2-queryable audit trail for the Guard Rails v1
subsystem (Phase 2, Story 3).  It records WHAT the guard rails decided,
not the content they decided on (see DESIGN DECISIONS — no raw payload).

============================================================================
QUERY PATTERNS SERVED
============================================================================

  Q1  SELECT id, layer, verdict, score, reasons, input_sha256, created_at
        FROM guard_rail_events
       WHERE tenant_id = $1 AND created_at > $2
       ORDER BY created_at DESC
      (dashboard time-window feed — the primary read path; "show me
       guard-rail activity for this tenant since <window start>")

  Q2  SELECT layer, COUNT(*)
        FROM guard_rail_events
       WHERE tenant_id = $1 AND created_at > $2
       GROUP BY layer
      (dashboard counts by layer — L1 vs L2 volume for the window)

  Q3  SELECT id, layer, score, reasons, input_sha256, created_at
        FROM guard_rail_events
       WHERE tenant_id = $1 AND verdict = $2 AND created_at > $3
       ORDER BY created_at DESC
      (security drill-down — "show me the blocked/flagged events for this
       tenant in the window"; verdict='blocked' is the selective, high-value
       filter — the minority of rows in a mostly passed_low log)

  Q4  SELECT verdict, COUNT(*)
        FROM guard_rail_events
       WHERE tenant_id = $1 AND created_at > $2
       GROUP BY verdict
      (dashboard counts by verdict — blocked/flagged/passed_low breakdown)

============================================================================
DESIGN DECISIONS
============================================================================

guard_rail_events.id — String(36), matching platform convention (see
  migration 001a_users / 004_tags).  The migration stores ids as
  String(36); the SQLAlchemy model uses UUID(as_uuid=False) — both render
  to the same Postgres column type.  The audit writer (Arjun's audit.py)
  generates the id application-side, so there is no server-side default.

NO foreign keys on tenant_id or sprint_id — intentional.  This is an
  append-only audit log, mirroring the existing `agent_events` table
  (sprint_models.py::AgentEventModel), which also carries no FKs.
  Rationale (Sneha):
    - L1/L2 run at INGESTION, BEFORE the SprintState row is persisted, so
      sprint_id is frequently NULL at write time — an FK to sprints would
      be unsatisfiable for legitimately pre-sprint events.
    - An FK turns the audit insert into a dependency on the parent row's
      existence and lock state.  A failed/blocked audit write would then
      block or fail the request path.  This violates the failure-tolerant
      design: the guard rail decision must always be recordable, even if
      the tenant/sprint row is mid-transaction or absent.
  Integrity of tenant_id/sprint_id is enforced application-side by the
  audit writer, not by referential constraints.

sprint_id — NULLable, by design (see above).  NULL here means "this event
  occurred at ingestion before a sprint existed," which is a valid and
  expected state — NOT "unknown."  Documented so the dashboard treats a
  NULL sprint_id as "pre-sprint / ingestion-time," not as missing data.

score — Integer, NULLable.  Only L2 (model-scored) events produce a
  numeric score; L1 (regex/heuristic) events have none.  NULL here means
  "no score applies to this layer," which is the correct semantics — a
  default of 0 would be a lie (0 is a real, low score for L2).

reasons — JSONB.  A structured list/object of the rules or signals that
  fired (e.g. matched patterns, model rationale tags).  JSONB over JSON:
  binary-validated on write, GIN-indexable if a hot path emerges, and
  consistent with tenants.config / sprints.state / agent_events.payload
  in this codebase.  No GIN index added now — reasons is read as a blob in
  Q1/Q3, never filtered on in v1.  Add a targeted functional index if a
  sprint identifies a hot `reasons @> ...` query.

input_sha256 — String(64), the lowercase hex SHA-256 of the inspected
  input.  This is the ONLY fingerprint of the content we retain.

NO raw payload column — intentional (Sneha).  We store input_sha256 only.
  The audit log proves a decision was made about a specific input (via the
  hash) without ever persisting the input itself.  If forensic raw-payload
  retention is ever required, that is an ADR-level decision that must come
  with encryption-at-rest and a retention/erasure policy — it must NOT be
  bolted on here.

created_at — NOT NULL, server default NOW().  Every audit event has a
  time; NULL would mean "we don't know when," which is never a valid state
  for an audit row.  The audit writer may also pass an explicit created_at
  (like episodic.py does for agent_events); the server default guarantees a
  value even if it does not.

layer / verdict — String, application-constrained enums:
    layer   ∈ {"L1", "L2"}
    verdict ∈ {"blocked", "flagged", "passed_low"}
  Kept as plain String (not a Postgres ENUM type) to match the codebase
  convention (agent_role / event_type on agent_events are plain String) and
  to avoid the migration cost of ALTER TYPE ... ADD VALUE when a future
  layer (L3) or verdict is introduced.  The application validates the set.

----------------------------------------------------------------------------
INDEXES
----------------------------------------------------------------------------

ix_guard_rail_events_tenant_created  (tenant_id, created_at)
  Serves Q1 (the primary dashboard window read) and the predicate of
  Q2/Q4 (the GROUP BY counts scan the same tenant+window range, then
  aggregate in memory — layer/verdict each have only 2-3 distinct values,
  so a grouping index buys nothing).  Column order (tenant_id, created_at)
  is intentional: tenant_id is the equality predicate (leading), created_at
  the range predicate (trailing) — textbook composite ordering, and it lets
  the ORDER BY created_at DESC be served from the index.  REQUIRED by intake.

ix_guard_rail_events_tenant_verdict_created  (tenant_id, verdict, created_at)
  Serves Q3 (security drill-down: blocked/flagged events for a tenant in a
  window).  This earns its keep: verdict='blocked' is the selective, hot
  filter — in a healthy system the overwhelming majority of rows are
  'passed_low', so an index that lets the planner jump straight to the
  minority 'blocked'/'flagged' rows (and order them by created_at without a
  sort) is materially cheaper than filtering them out of the Q1 range scan.

REJECTED: (tenant_id, layer, created_at).
  layer has cardinality 2 (L1, L2).  A leading-equality index on a 2-value
  column is barely more selective than the tenant_id scan alone; Q2's
  GROUP BY layer is served acceptably by aggregating over the Q1 index
  range.  The write cost and storage of a third index do not pay for
  themselves.  Add it only if EXPLAIN on production volume shows Q2 as a hot
  bottleneck.

============================================================================
LOCKING / PRODUCTION SAFETY
============================================================================

CREATE TABLE guard_rail_events:
  Takes ACCESS EXCLUSIVE on the NEW table only.  No existing table
  (tenants, sprints, agent_events, users, ...) is touched, locked, or
  rewritten.  Zero impact on the live request path.

CREATE INDEX (both indexes):
  Created on an empty, brand-new table inside the same transaction as the
  CREATE TABLE — instantaneous (no rows to scan).  Because the table starts
  empty, there is NO need for CREATE INDEX CONCURRENTLY here; the cost of a
  full index build on an empty relation is nil.
    NOTE for the future: once this table is large, any NEW index added in a
    later migration MUST use CREATE INDEX CONCURRENTLY (outside a txn) to
    avoid locking writes to the audit log.

Estimated total migration time on production:
  < 1 second.  Single empty CREATE TABLE + two empty index builds.
  No back-fill scripts required (append-only, starts empty).

============================================================================
ROLLBACK SAFETY
============================================================================

downgrade() drops the indexes then the table, in reverse dependency order.
DROP TABLE removes its own indexes, but the explicit drop_index calls are
kept for symmetry/readability and to make the reversal auditable.

DATA LOSS on downgrade: this is an audit log — dropping the table destroys
the audit trail it holds.  Because the table has no dependents (no FKs
point at it, no FKs point out of it), the drop is structurally clean, but
the SOC2 audit data is irrecoverable.  Standard deprecation/export window
applies if the table has carried production audit rows for more than one
sprint (see team standards) — export before rollback in production.

============================================================================
IDEMPOTENCY NOTE
============================================================================

Running upgrade() twice will fail on the second run (table already exists).
This is correct Alembic behavior — the alembic_version table prevents
re-execution.  If you need a manual re-apply on a broken state, run
downgrade() first.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "005_guard_rail_events"
down_revision = "004_tags"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── guard_rail_events ───────────────────────────────────────────────────────
    # Append-only audit log for L1/L2 guard-rail decisions.  No FKs (see
    # docstring DESIGN DECISIONS): L1/L2 run at ingestion before SprintState
    # exists, so sprint_id is frequently NULL, and an FK-backed audit write
    # must never be able to block/fail the request path.
    op.create_table(
        "guard_rail_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        # NULLable: ingestion-time (L1/L2) events occur before a sprint row
        # is persisted — NULL means "pre-sprint," a valid state.
        sa.Column("sprint_id", sa.String(36), nullable=True),
        # layer  ∈ {"L1","L2"} — plain String, app-validated enum.
        sa.Column("layer", sa.String(), nullable=False),
        # verdict ∈ {"blocked","flagged","passed_low"} — plain String, app-validated.
        sa.Column("verdict", sa.String(), nullable=False),
        # NULLable: only L2 produces a score; NULL ≠ 0 (0 is a real low score).
        sa.Column("score", sa.Integer(), nullable=True),
        # Structured rule/signal trace.  Read as a blob in v1; no GIN index.
        sa.Column("reasons", postgresql.JSONB(), nullable=False),
        # SHA-256 hex of the inspected input — the ONLY content fingerprint
        # retained.  No raw payload column (see DESIGN DECISIONS / Sneha).
        sa.Column("input_sha256", sa.String(64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )

    # Serves Q1 (dashboard window feed) + the predicate of Q2/Q4 group-by
    # counts.  (tenant_id eq-predicate, created_at range-predicate) — also
    # serves ORDER BY created_at DESC from the index.  REQUIRED by intake.
    op.create_index(
        "ix_guard_rail_events_tenant_created",
        "guard_rail_events",
        ["tenant_id", "created_at"],
    )

    # Serves Q3 (security drill-down on blocked/flagged).  verdict is the
    # selective, hot filter; created_at trailing serves the ordered scan.
    op.create_index(
        "ix_guard_rail_events_tenant_verdict_created",
        "guard_rail_events",
        ["tenant_id", "verdict", "created_at"],
    )


def downgrade() -> None:
    # Reverse order: indexes, then the table.  No FKs in or out — clean drop.
    # (DROP TABLE would remove the indexes anyway; explicit for auditability.)
    op.drop_index(
        "ix_guard_rail_events_tenant_verdict_created",
        table_name="guard_rail_events",
    )
    op.drop_index(
        "ix_guard_rail_events_tenant_created",
        table_name="guard_rail_events",
    )
    op.drop_table("guard_rail_events")
