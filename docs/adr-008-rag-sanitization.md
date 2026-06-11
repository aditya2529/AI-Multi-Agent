# ADR-008: L5 — RAG / Memory Sanitization (Read + Write)

**Status:** Proposed — pending human architect approval.
**Date:** 2026-06-11
**Author:** Arnav (architect agent).
**Layer:** L5 `rag_sanitization` in the Guard Rails layer map (`orchestrator/guard_rails/__init__.py`).
**Sprint:** Sprint 3 (design only now).
**Sibling ADRs:** [ADR-007 (L4 canary + output)](./adr-007-canary-and-pydantic-output.md), [ADR-009 (L6 cross-agent trust)](./adr-009-cross-agent-trust-boundary.md).

> **Defense-in-depth position.** L1–L2 sanitize the *user's* request at the API edge. But agents also pull untrusted text from memory — semantic learnings (Chroma) and episodic sprint history — and splice it into the system prompt at `BaseAgent._recall()`. **Memory is a second, unguarded ingress.** L5 extends L1 (and, where affordable, L2) to that ingress on **both** the write path and the read path.

---

## Context

`BaseAgent._recall()` (`orchestrator/agents/base_agent.py` lines 127-160) retrieves two kinds of memory and formats them into a `## Memory Context` block:

- `self._semantic_memory.retrieve_relevant_learnings(query, n_results=3)` — free-text "past learnings" (Chroma vector store).
- `self._episodic_memory.get_tenant_velocity_history(limit=3)` — sprint metrics.

That block is stored in `self._memory_ctx` and **prepended to the system prompt on every model call** (`_call_model()` line 186: `system_prompt = self._memory_ctx + system_prompt`). It sits *above* the static instructions in the trust hierarchy by virtue of position — yet its content originates from prior agent runs and, transitively, from prior user input.

**The exposure.** Today nothing sanitizes memory. Two failure modes:

1. **Read-side injection.** A learning string retrieved from Chroma could contain `ignore all previous instructions` or fake delimiters — exactly the patterns L1's `_INJECTION_INTENT_RE` and `_FAKE_DELIMITER_RE` catch on user input — and it would be injected straight into the system prompt, unfiltered.

2. **Memory POISONING (the Sneha flag — addressed head-on below).** If we *only* filter on read, an attacker who lands one malicious string into memory forces us to re-scan it on every retrieval forever, and any read path that forgets to filter is a latent breach. **Filtering on read is necessary but not sufficient.** The durable fix is to **sanitize on WRITE**: L1-HIGH content must be *blocked from entering memory at all*. A poisoned record that never gets written cannot be retrieved by any consumer, present or future.

**Why both.** Write-time sanitization stops *new* poison at the door. Read-time sanitization is the safety net for (a) records that predate L5, (b) records written by paths that bypass the sanitized writer, and (c) defense-in-depth if the write filter is ever misconfigured. Belt and suspenders, deliberately.

**NFRs in scope.** `_recall()` is on the hot path of *every* agent step and already "fails silently — memory unavailability never blocks execution" (docstring, line 132). L5 must preserve that fail-silent-on-error contract while adding a fail-*closed* path for *detected-malicious* content (a different thing from "memory unavailable"). L1 is microseconds; running it on ≤3 learnings + ≤3 history rows is negligible. L2 (Haiku) is a model call — see the read-side cost decision below.

---

## Decision

### Write path — block poison at ingress (the primary control)

Every write into semantic/episodic memory routes through a sanitizing writer that runs `sanitize_input()` (and `sanitize_metadata()` for structured fields) on the content **before** persistence:

- `severity is HIGH` ⇒ **reject the write.** The record is never stored. Emit an L7 `guard_rail_events` row (layer=`L5`, reason=`memory_write_blocked`, plus the L1 reasons). On a production tenant this is fail-closed (write rejected); on dev, write-with-warning so prompt/memory experimentation isn't bricked (per `__init__.py` line 13).
- `severity is LOW` ⇒ store the **sanitized** form (zero-width stripped, NFKC-normalized) — never the original — exactly the L1 caller contract ("use result.sanitized, never the original", `input_sanitizer.py` lines 13-18).
- `severity is NONE` ⇒ store as-is.

This is implemented as a wrapper at the memory-module boundary (the `SemanticMemory` / `EpisodicMemory` write methods), so *all* writers inherit it — agents never call the raw store directly.

### Read path — defense-in-depth net at `_recall()`

`_recall()` runs L1 over each retrieved item before formatting it into the memory block:

- `HIGH` ⇒ **drop that item** from the block (do not inject it) and emit an L7 row (reason=`memory_read_dropped`). Dropping one poisoned learning is consistent with the existing fail-silent posture: the agent proceeds with the remaining clean items rather than aborting.
- `LOW` ⇒ inject the sanitized form.
- `NONE` ⇒ inject as-is.

The retrieval calls stay wrapped in their existing `try/except` so a sanitizer exception degrades to "skip this block," never a crash (preserving lines 141-142, 153-154 semantics).

### L2 on the read path — cost-bounded, not blanket

Running the Haiku L2 classifier on *every* retrieved learning on *every* step would add a model round-trip to the hottest path in the system. **Decision: L2 runs on the WRITE path (once per record, amortized forever), not on every read.** Read-path L2 is reserved for an optional "deep scan" mode (feature-flagged, off by default) used when L1 flags LOW-but-suspicious content and we want a second opinion before injecting. This keeps the per-step latency budget intact while still getting L2's judgment applied to everything that enters memory.

### Tenant isolation

L5 reuses the existing `<tenant:X|agent:Y>` scoping discipline that Sneha hardened (referenced in `__init__.py` lines 14-15 and enforced in `_call_model()` line 197). Memory reads/writes are already tenant-scoped; L5 adds no new cross-tenant surface, and the L7 audit rows carry `tenant_id` so a write-block in one tenant can never be confused with another's.

---

## Alternatives considered

| # | Alternative | Why rejected |
|---|---|---|
| 1 | **Read-only sanitization (filter at `_recall()`, leave writes alone)** | This is the exact gap the Sneha flag calls out. It leaves poison resident in the store, requires perfect read-side coverage forever, and any future read path that forgets the filter is a breach. Write-side blocking is the durable fix; read-side alone is rejected as the *sole* control. |
| 2 | **Write-only sanitization (block on write, trust reads)** | Ignores pre-L5 legacy records already in Chroma and any writer that bypasses the sanitizing wrapper. No safety net. Rejected; we keep read-side as defense-in-depth. |
| 3 | **Run L2 (Haiku) on every retrieval** | Adds a model round-trip to the per-step hot path for ≤6 items every step — unacceptable latency/token cost at scale. L2-on-write amortizes the same coverage to once-per-record. Rejected for the read path; kept as opt-in deep-scan. |
| 4 | **Embedding-time anomaly detection (flag learnings whose vectors are outliers)** | Vector-space outlier detection does not map to "contains an injection"; an injection can be semantically on-topic. It is a different (weaker) signal than L1's deterministic intent/delimiter regexes. Possible future augmentation, not a replacement. |
| 5 | **Quarantine instead of reject on write** (store flagged records in a separate space for human review) | Adds a quarantine store, a review queue, and a re-admission workflow — scope creep for Sprint 3. The L7 audit row already gives SEC the visibility; a rejected write can be re-submitted after the source is fixed. Revisit if false-positive rate proves high. |

---

## Consequences

**Positive.**
- Closes the second injection ingress (memory) that L1–L2 at the API edge never see.
- **Directly neutralizes memory poisoning** by blocking L1-HIGH content on write — the Sneha flag, addressed at the source rather than papered over on read.
- Reuses L1 wholesale (`sanitize_input` / `sanitize_metadata`) — no new detection logic, no new false-positive surface, and idempotent (L1 is idempotent by design, `input_sanitizer.py` line 19), so re-sanitizing an already-clean record is safe.
- Preserves `_recall()`'s fail-silent-on-unavailability contract while adding fail-closed-on-malicious.

**Negative / risks.**
- **Legacy backfill.** Records written before L5 are unsanitized. Read-side filtering covers them at runtime, but a one-time offline backfill scan over the existing Chroma collection is recommended to purge resident poison. Scoped as a Sprint-3 follow-up task, not a blocker.
- **False-positive write rejections.** A legitimate learning that happens to contain a flagged phrase (e.g., a retro note literally discussing "the user tried `ignore previous instructions`") would be blocked on write. Mitigation: dev tenants write-with-warning; prod rejections are audited so SEC can spot and tune. **Flagged.**
- **Hot-path additions.** Even microsecond L1 cost is multiplied by every step × ≤6 items; must be load-tested, though expected impact is well within budget.
- **Two enforcement points** (writer wrapper + `_recall()`) must stay in sync on policy; documented as a single shared policy function to avoid drift.

---

## Rollout plan

- **Sprint:** Sprint 3 (depends on L1 shipped — it is — and is independent of L4; can land in parallel with ADR-009).
- **Feature flags (env-flag pattern per `base_agent.py` line 20):**
  - `GUARD_L5_WRITE` (write-path block; enable on dev first, then prod tenants).
  - `GUARD_L5_READ` (read-path drop at `_recall()`).
  - `GUARD_L5_READ_DEEP` (optional L2 read-side deep scan; default `false`).
- **Backwards-compat:** with all flags off, `_recall()` and the memory writers behave exactly as today. The writer wrapper is additive at the memory-module boundary; no agent code changes. `_recall()` gains a per-item sanitize call inside the existing loops — return type and fail-silent semantics unchanged.
- **Fail mode:** memory *unavailable* ⇒ fail silent (unchanged). Memory item *detected malicious* ⇒ drop (read) / reject (write); prod fail-closed, dev warn (per `__init__.py` line 13).
- **Verification:**
  1. Poison-write eval: a learning containing L1-HIGH patterns must be rejected on write and absent from subsequent retrievals.
  2. Legacy-read eval: a pre-seeded poisoned record must be dropped by `_recall()` and never reach the system prompt.
  3. Fail-silent regression: simulated Chroma outage must still return `""` from `_recall()` (no behavior change).
  4. Backfill dry-run report: count of resident records that *would* be purged, reviewed before live backfill.
  5. L7 audit assertion: each block/drop writes one `guard_rail_events` row with `layer=L5`.

---

## Open questions for human architect

- Approve the **offline backfill** scope and timing (purge vs quarantine for legacy poisoned records).
- Confirm `GUARD_L5_READ_DEEP` (L2 on read) stays off-by-default given the hot-path cost — or is there a compliance requirement to L2-scan retrievals inline?
- Episodic history is numeric metrics today (`metric`/`value`); confirm no roadmap item adds free-text fields there that would widen the L5 read surface.
