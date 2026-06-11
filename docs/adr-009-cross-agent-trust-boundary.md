# ADR-009: L6 — Cross-Agent Trust Boundary via Field-Level Provenance on SprintState

**Status:** Proposed — pending human architect approval.
**Date:** 2026-06-11
**Author:** Arnav (architect agent).
**Layer:** L6 `cross_agent_trust` in the Guard Rails layer map (`orchestrator/guard_rails/__init__.py`).
**Sprint:** Sprint 3 (design only now).
**Sibling ADRs:** [ADR-007 (L4 canary + output)](./adr-007-canary-and-pydantic-output.md), [ADR-008 (L5 RAG sanitization)](./adr-008-rag-sanitization.md).

> **Defense-in-depth position.** L1–L2 guard the user→system edge; L5 guards the memory→system edge; L4 guards the model→output edge. **L6 guards the agent→agent edge.** Once Agent A's output is validated by L4, it flows into `SprintState` and becomes Agent B's input. L6 makes that flow *typed and attributed* so Agent B consumes structured fields with known provenance — never another agent's raw, free-form text spliced into its prompt.

---

## Context

The 16 agents communicate through `SprintState` (`orchestrator/state/sprint_state.py`), the "single source of truth flowing through the LangGraph sprint graph" (docstring, lines 217-223). Agents "read from and write to this state through structured state updates — never through direct mutation" (lines 3-5). State is already strict-typed and multi-tenant (`tenant_id` on `SprintState`, `SprintTask`, `AMCPMessage`, `EscalationEvent`, `AgentHandoff`).

But the typing today answers *what shape* a field is, not *who wrote it and whether it has cleared the guard rails*. Two gaps:

1. **Untyped free-text channels exist inside the typed state.** `SprintTask.notes` (str), `SprintTask.blocked_reason` (str), `AMCPMessage.payload` (`dict[str, Any]`), `AgentHandoff.instructions` (str) and `.context` (`dict[str, Any]`), `pending_human_decisions` (`list[dict[str, Any]]`), and `messages` (`list[dict[str, Any]]`, append-only via the `add_messages` reducer) are all places where one agent can deposit arbitrary text that a downstream agent then reads. If Agent B drops Agent A's `handoff.instructions` straight into its prompt, an injection that rode in through A (or through A's memory via the L5 surface) crosses the agent boundary unchecked. This is the *confused-deputy* risk: B trusts A's text as if it were trusted instruction.

2. **No provenance.** When Agent B reads `prd_confidence_score` or a `notes` string, there is no machine-checkable record of *which agent wrote it*, *when*, *whether it passed L1/L2/L4*, and *whether it is data vs instruction*. SEC cannot audit "did any agent consume an unvalidated peer field?" because the metadata to answer it doesn't exist.

**The sprint non-goal is explicit: no LangGraph / SprintState rewrites.** Therefore L6 must be **purely additive** to `SprintState` — new optional fields and new wrapper types that default to empty/None, leaving every existing field, reducer (`add_messages`, line 278), and graph node working unchanged.

**NFRs in scope.** L6 adds no model calls — it is pure data structure + a validation helper. The added per-handoff cost is constructing a small provenance record. State must stay under the 70% context cap (docstring line 222: "never embed raw code here; use artifact_refs") — L6 *reinforces* this by pushing agents toward typed fields + `ArtifactRef` and away from dumping raw text.

---

## Decision

### A new additive `Provenance` wrapper type

Introduce a Pydantic model that tags a value with its origin and guard-rail status:

> `Provenance{ source_agent: AgentRole, written_at: datetime, classification: Literal["DATA","INSTRUCTION","UNTRUSTED_TEXT"], guard_layers_cleared: list[str] (e.g. ["L1","L4"]), checksum_sha256: str, tenant_id: str }`

The pattern mirrors the existing `ArtifactRef` (lines 102-114), which already carries `created_by: AgentRole`, `created_at`, and `checksum_sha256` — L6 generalizes that "every artifact knows its author" discipline from artifacts to *fields*.

### Additive provenance carriers on SprintState (no rewrites)

Add **new optional fields** alongside (never replacing) the existing ones:

- `field_provenance: dict[str, Provenance]` on `SprintState` — keyed by field name, default empty. Records who last wrote the security-relevant scalar fields (`prd_confidence_score`, `security_cleared`, `code_review_cleared`, `canary_percentage`, etc.). Empty dict ⇒ behaves exactly as today.
- A `provenance: Provenance | None = None` field added to `AgentHandoff` and to `SprintTask` (defaulted `None`). When present, the consuming agent has the metadata to decide trust; when absent (legacy / not-yet-migrated), behavior is unchanged.
- `AMCPMessage.payload` keeps its `dict[str, Any]` shape (no rewrite) but gains a sibling `payload_provenance: Provenance | None = None`.

### The consumption rule (the actual trust boundary)

The boundary is enforced at *consumption*, not just storage. The rule downstream agents follow:

1. **Typed scalars/enums** (e.g. `security_cleared: bool`, `prd_confidence_score: float`) are trusted *as data* — they are already constrained by their types and Pydantic validators. An agent acts on these directly.
2. **Free-text peer fields** (`handoff.instructions`, `task.notes`, `payload` strings) are, by default, classified `UNTRUSTED_TEXT`. A consuming agent **must not splice them verbatim into its system prompt as instruction.** It either (a) treats them as quoted *data* inside the L3 untrusted-input delimiters, or (b) re-runs L1 (`sanitize_input`) on them at consumption — reusing the same primitive as L5, applied at the agent→agent edge instead of the memory→agent edge.
3. An agent that needs a *richer* contract than a scalar consumes the upstream agent's **L4-validated Pydantic output model** (ADR-007) referenced via `ArtifactRef`, not the peer's prose. **This is the explicit hand-off contract between L4 and L6:** L4 guarantees the producer emitted a valid typed object; L6 guarantees the consumer reads that typed object (with provenance) rather than raw text.

### Provenance is stamped by the framework, not the agent

To keep this from being optional-in-practice, the provenance record is populated by the same `BaseAgent`/graph plumbing that already writes state updates and creates `ArtifactRef`s (`base_agent._make_artifact_ref`, lines 276-288). An agent calling the state-update helper gets provenance stamped automatically (source_agent = `self.role`, guard_layers_cleared from what L1/L4 reported on its output). Agents don't hand-author provenance, so they can't forget it.

---

## Alternatives considered

| # | Alternative | Why rejected |
|---|---|---|
| 1 | **Rewrite SprintState to make every text field a typed sub-model** | Directly violates the sprint non-goal ("no LangGraph/SprintState rewrites"). Would touch every graph node and reducer. Additive optional fields get ~90% of the safety at near-zero blast radius. Rejected. |
| 2 | **Per-agent allow/deny matrix ("BE may read DBA fields but not SEC fields")** | A static capability matrix across 16 agents × dozens of fields is high-maintenance and brittle as the graph evolves. Provenance + the consumption rule scales without a combinatorial config. A matrix can be layered on later *using* provenance if a concrete need appears. Rejected for now. |
| 3 | **Sign each field with a cryptographic per-agent key** | Heavy: key management, rotation, verification cost on every read. Inside a single trust domain (our own orchestrator process) the threat is confused-deputy injection, not field forgery by an external party. `checksum_sha256` for integrity + `source_agent` for attribution is proportionate. Crypto signing is over-engineering for the in-process threat model. Rejected. |
| 4 | **Enforce only at write (validate output) and assume reads are safe** | That is L4's job, not L6's. L4 validates the producer; it cannot know how a *consumer* will use a field. The confused-deputy risk lives at consumption. L6 must add the consumption-side rule, so write-only is insufficient. Rejected. |
| 5 | **Free-text classification via a model judge at each consumption** | Adds model calls to the agent→agent hot path. Provenance carries the classification cheaply (stamped once at write); re-running L1 deterministically at consumption is microseconds. A judge is unjustified cost. Rejected. |

---

## Consequences

**Positive.**
- Establishes an auditable agent→agent trust boundary: SEC can query "did any agent consume an `UNTRUSTED_TEXT` field as instruction?" because provenance + L7 audit make it answerable.
- Closes the confused-deputy gap — an injection that survives into one agent's output cannot silently become another agent's instruction.
- Purely additive: every existing field, validator, reducer, and graph node keeps working; legacy state with empty `field_provenance` behaves exactly as today.
- Reinforces the existing "use ArtifactRef, don't embed raw text" discipline (state docstring line 222) and the L4 contract (consume typed output, not prose).
- Reuses L1 (`sanitize_input`) at the new boundary — no new detection logic.

**Negative / risks.**
- **Provenance is only as good as its coverage.** A code path that mutates state without the stamping helper writes a field with no provenance, which the consumption rule must treat conservatively (absent provenance ⇒ treat free text as `UNTRUSTED_TEXT`). The fail-safe default is correct but means partial migration yields partial protection. **Flagged.**
- **State-size growth.** A `Provenance` record per tracked field adds bytes to `SprintState`, which flows through every node and counts against the 70% context cap. Provenance is metadata (enums, timestamps, hashes) — small — but must be measured; it must never inflate state toward the cap. Keep provenance out of any field that is serialized into a prompt.
- **Consumption discipline is partly a convention.** The framework stamps provenance automatically, but "consume the typed field, not the prose" is enforced by code review + the L4/L6 contract, not by the type system alone. Risk of an agent author bypassing it; mitigated by making the typed path the easy path.
- **Migration ordering.** L6's consumption rule is strongest when L4 (ADR-007) is already validating producer output. Sequence L4 (Sprint 2) before fully relying on L6's "consume the typed output" clause (Sprint 3).

---

## Rollout plan

- **Sprint:** Sprint 3. Builds on L4 (ADR-007, Sprint 2) for the "consume validated typed output" clause; independent of L5 and can land in parallel with ADR-008.
- **Feature flags (env-flag pattern per `base_agent.py` line 20):**
  - `GUARD_L6_STAMP` (framework writes provenance on state updates — safe to enable early; purely additive metadata).
  - `GUARD_L6_ENFORCE` (consuming agents apply the consumption rule / re-sanitize untrusted text). Enable on dev tenants first.
- **Backwards-compat:** all new fields default to empty/`None`. With flags off, `SprintState` is structurally a superset of today's and serializes/deserializes existing state unchanged (new optional fields tolerate absence). No reducer changes; `add_messages` (line 278) is untouched.
- **Fail mode:** absent provenance ⇒ treat peer free-text as `UNTRUSTED_TEXT` (fail-safe). On a production tenant, an agent attempting to consume an `UNTRUSTED_TEXT` field as instruction is blocked + L7-audited; on dev, warn (per `__init__.py` line 13).
- **Verification:**
  1. Additive-compat test: load a pre-L6 serialized `SprintState` snapshot; assert it deserializes and the graph runs unchanged with empty provenance.
  2. Confused-deputy eval: seed `handoff.instructions` with an injection from a producing agent; assert the consuming agent does not execute it (re-sanitized / quoted as data), and an L7 row records the boundary event.
  3. Coverage report: percentage of state writes that carry provenance after migrating Tier-1 (L4) agents — track toward 100%.
  4. State-size guardrail: assert provenance metadata keeps `SprintState` serialized size within budget (well under the 70% context cap).
  5. L7 audit assertion: each blocked consumption writes one `guard_rail_events` row with `layer=L6`.

---

## Open questions for human architect

- Confirm provenance is acceptable to persist in the LangGraph checkpoint (it lands in the checkpointer with the rest of `SprintState`) — any retention/PII concern with storing `source_agent` + timestamps + hashes there?
- Should `messages` (the `add_messages` append-only log) be in L6 scope in Sprint 3, or deferred? It is the largest free-text-ish channel but also the one most coupled to the LangGraph reducer (highest rewrite risk against the non-goal).
- Do we want a per-agent capability matrix (Alternative #2) on the roadmap once provenance exists, or is the provenance + consumption rule sufficient for the contracted compliance scope?
