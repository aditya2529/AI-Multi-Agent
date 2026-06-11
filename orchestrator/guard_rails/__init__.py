"""
Guard Rails subsystem — defense-in-depth between untrusted input and LLM inference.

Layer map:
  L1  input_sanitizer        deterministic checks before any LLM is invoked
  L2  injection_classifier   Haiku 4.5 judge with tenant-scoped cache
  L3  delimiter_hardening    BaseAgent prompt wrapping (handled in BaseAgent)
  L4  output_validation      canary tokens + Pydantic schemas (ADR-007)
  L5  rag_sanitization       L1-L3 applied to memory retrievals (ADR-008)
  L6  cross_agent_trust      strict SprintState typing (ADR-009)
  L7  audit                  guard_rail_events table + Langfuse + dashboard tile

Each layer fails CLOSED on production tenants and OPEN-with-warning on dev tenants.
Tenant isolation is enforced via the same <tenant:X|agent:Y> cache prefix pattern
that Sneha hardened in the token-optimization sprint.
"""
from __future__ import annotations

from orchestrator.guard_rails.audit import record_event
from orchestrator.guard_rails.injection_classifier import (
    BLOCK_THRESHOLD,
    FLAG_THRESHOLD,
    ClassificationResult,
    classify,
)
from orchestrator.guard_rails.input_sanitizer import (
    Severity,
    SanitizationResult,
    sanitize_input,
    sanitize_metadata,
)

__all__ = [
    # L1
    "Severity",
    "SanitizationResult",
    "sanitize_input",
    "sanitize_metadata",
    # L2
    "classify",
    "ClassificationResult",
    "BLOCK_THRESHOLD",
    "FLAG_THRESHOLD",
    # L7
    "record_event",
]
