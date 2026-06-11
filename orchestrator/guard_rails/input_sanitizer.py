"""
L1 — Input Sanitizer.

Pure-Python, deterministic checks that run BEFORE any LLM call. Catches the
cheap, obvious attacks (delimiter spoofing, oversize payloads, encoded
smuggling) so we never spend a token on them. Latency is microseconds.

Severity model:
  HIGH  → reject (caller must not proceed to LLM)
  LOW   → pass through but record reasons (zero-width chars stripped, etc.)
  NONE  → clean

Caller contract:
  result = sanitize_input(text, tenant_id=tid)
  if result.severity is Severity.HIGH:
      raise HTTPException(...)
  use result.sanitized  # never the original

The function is idempotent: sanitize(sanitize(x)) == sanitize(x).
"""
from __future__ import annotations

import base64
import re
import unicodedata
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

# ─── Limits & policy ─────────────────────────────────────────────────────────

# 10 KB default for requirements text. Generous for a story; small enough that
# a 50KB jailbreak payload trips the cap before reaching the classifier.
DEFAULT_MAX_CHARS = 10_000
METADATA_VALUE_MAX_CHARS = 2_000

# Zero-width / invisible characters used to smuggle instructions past visual review.
# Source: Unicode TR9 + common LLM smuggling references.
_ZERO_WIDTH_CHARS = "".join(
    [
        "​",  # ZERO WIDTH SPACE
        "‌",  # ZERO WIDTH NON-JOINER
        "‍",  # ZERO WIDTH JOINER
        "⁠",  # WORD JOINER
        "﻿",  # ZERO WIDTH NO-BREAK SPACE / BOM
        "᠎",  # MONGOLIAN VOWEL SEPARATOR (legacy zero-width)
    ]
)
_ZERO_WIDTH_RE = re.compile(f"[{_ZERO_WIDTH_CHARS}]")

# Threshold above which zero-width usage looks intentional, not incidental.
# Three is conservative; one or two can appear in legitimately copy-pasted text.
_ZERO_WIDTH_HIGH_COUNT = 3

# Bidi controls — flip rendering direction to hide payloads. Always HIGH.
_BIDI_CONTROL_RE = re.compile(r"[‪-‮⁦-⁩]")

# Fake delimiters that mimic the structured-prompt tags Claude (and other LLMs)
# are trained to obey. If user input contains these, they are almost certainly
# an injection attempt — legitimate stories don't contain `</system>`.
_FAKE_DELIMITER_RE = re.compile(
    r"</?\s*(system|assistant|user|untrusted_user_input|user_story|prd|tool_use|"
    r"function_calls|tool_result|antml:[a-z_]+)\s*>"
    r"|<\|(?:im_start|im_end|start_header_id|end_header_id|eot_id)\|>"
    r"|\[/?INST\]",
    re.IGNORECASE,
)

# Base64 blocks worth decoding: 40+ chars of base64 alphabet, optionally padded.
# Short base64 strings (URL tokens, hashes) are noisy and not worth scanning.
_BASE64_BLOCK_RE = re.compile(r"[A-Za-z0-9+/]{40,}={0,2}")

# Patterns that indicate injection intent. Used to scan both the raw text and
# any base64-decoded text. Kept deliberately small — high precision beats
# completeness here (L2 classifier handles the long tail).
#
# Note on the "you are now X" branch: the persona-name token must be matched
# case-sensitively (DAN/STAN/AIM/KEVIN/etc.) — under the outer IGNORECASE
# flag, [A-Z] also matches lowercase letters, so we use (?-i:...) to scope
# case-sensitivity to just that subgroup. Without this scoping, the regex
# matches one letter and then fails the trailing \b boundary check.
_INJECTION_INTENT_RE = re.compile(
    r"\b("
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?"
    r"|disregard\s+(?:the\s+)?(?:system\s+)?prompt"
    r"|you\s+are\s+(?:now|actually)\s+(?-i:[A-Z]{2,})"  # "You are now DAN..."
    r"|reveal\s+(?:your\s+)?system\s+prompt"
    r"|print\s+(?:your\s+)?(?:initial\s+)?instructions?"
    r"|jailbreak\s+mode"
    r")\b",
    re.IGNORECASE,
)


class Severity(str, Enum):
    NONE = "none"
    LOW = "low"
    HIGH = "high"


@dataclass
class SanitizationResult:
    sanitized: str
    severity: Severity = Severity.NONE
    reasons: list[str] = field(default_factory=list)
    original_length: int = 0
    final_length: int = 0

    @property
    def blocked(self) -> bool:
        return self.severity is Severity.HIGH

    def to_audit_dict(self) -> dict[str, Any]:
        """Serialize for the guard_rail_events table (L7). Sanitized text is
        intentionally excluded — callers log a hash, not the content."""
        return {
            "severity": self.severity.value,
            "reasons": list(self.reasons),
            "original_length": self.original_length,
            "final_length": self.final_length,
        }


def sanitize_input(text: str, *, max_chars: int = DEFAULT_MAX_CHARS) -> SanitizationResult:
    """Run L1 checks on a single text input.

    Returns a SanitizationResult. The caller is responsible for acting on
    severity (raise on HIGH, log on LOW). The `sanitized` field is always
    safe to forward downstream; do not pass the original through.
    """
    if not isinstance(text, str):
        # Defensive: callers should pass strings; coerce + flag rather than crash.
        text = str(text)

    original_length = len(text)
    reasons: list[str] = []
    severity = Severity.NONE

    # 1. Length cap — reject before doing any other work.
    if original_length > max_chars:
        return SanitizationResult(
            sanitized="",
            severity=Severity.HIGH,
            reasons=[f"length_exceeded:{original_length}>{max_chars}"],
            original_length=original_length,
            final_length=0,
        )

    # 2. Bidi controls — always high severity; no legitimate use case in stories.
    if _BIDI_CONTROL_RE.search(text):
        reasons.append("bidi_control_chars_present")
        severity = Severity.HIGH
        text = _BIDI_CONTROL_RE.sub("", text)

    # 3. Zero-width characters — strip; only flag HIGH if many.
    zw_matches = _ZERO_WIDTH_RE.findall(text)
    if zw_matches:
        text = _ZERO_WIDTH_RE.sub("", text)
        if len(zw_matches) >= _ZERO_WIDTH_HIGH_COUNT:
            reasons.append(f"zero_width_chars_high:{len(zw_matches)}")
            severity = Severity.HIGH
        else:
            reasons.append(f"zero_width_chars_stripped:{len(zw_matches)}")
            severity = _upgrade(severity, Severity.LOW)

    # 4. Unicode NFKC normalization — collapses confusables (e.g., fullwidth
    #    Latin to ASCII) so downstream regex / classifier sees a canonical form.
    normalized = unicodedata.normalize("NFKC", text)
    if normalized != text:
        reasons.append("unicode_normalized")
        severity = _upgrade(severity, Severity.LOW)
        text = normalized

    # 5. Fake delimiter detection — anything mimicking system tags is HIGH.
    fake = _FAKE_DELIMITER_RE.findall(text)
    if fake:
        reasons.append(f"fake_delimiters:{len(fake)}")
        severity = Severity.HIGH

    # 6. Injection-intent regex on the surface text.
    if _INJECTION_INTENT_RE.search(text):
        reasons.append("injection_intent_phrase")
        severity = Severity.HIGH

    # 7. Base64 decode + rescan. We only flag if the decoded content itself
    #    contains injection intent or fake delimiters — otherwise base64 blobs
    #    in legitimate code snippets (image data URLs, signatures) are noisy.
    for block in _BASE64_BLOCK_RE.findall(text):
        decoded = _try_decode_base64(block)
        if decoded is None:
            continue
        if _INJECTION_INTENT_RE.search(decoded) or _FAKE_DELIMITER_RE.search(decoded):
            reasons.append("base64_smuggled_injection")
            severity = Severity.HIGH
            break  # one is enough

    return SanitizationResult(
        sanitized=text,
        severity=severity,
        reasons=reasons,
        original_length=original_length,
        final_length=len(text),
    )


def sanitize_metadata(metadata: dict[str, Any]) -> tuple[dict[str, Any], SanitizationResult]:
    """Recursively sanitize a metadata dict.

    Returns (cleaned_dict, summary_result). The summary aggregates the worst
    severity and concatenates reasons from each scanned value. Non-string
    values pass through untouched (numbers, bools, null).
    """
    aggregate_reasons: list[str] = []
    worst_severity = Severity.NONE
    total_original = 0
    total_final = 0

    cleaned: dict[str, Any] = {}
    for key, value in metadata.items():
        cleaned[key], worst_severity, total_original, total_final = _sanitize_value(
            key,
            value,
            worst_severity,
            aggregate_reasons,
            total_original,
            total_final,
        )

    summary = SanitizationResult(
        sanitized="",  # not applicable for dict aggregate
        severity=worst_severity,
        reasons=aggregate_reasons,
        original_length=total_original,
        final_length=total_final,
    )
    return cleaned, summary


def _sanitize_value(
    key: str,
    value: Any,
    worst: Severity,
    reasons: list[str],
    total_original: int,
    total_final: int,
) -> tuple[Any, Severity, int, int]:
    if isinstance(value, str):
        r = sanitize_input(value, max_chars=METADATA_VALUE_MAX_CHARS)
        if r.reasons:
            reasons.extend(f"metadata.{key}:{reason}" for reason in r.reasons)
        return r.sanitized, _upgrade(worst, r.severity), total_original + r.original_length, total_final + r.final_length

    if isinstance(value, dict):
        cleaned, summary = sanitize_metadata(value)
        if summary.reasons:
            reasons.extend(f"metadata.{key}.{r}" for r in summary.reasons)
        return cleaned, _upgrade(worst, summary.severity), total_original + summary.original_length, total_final + summary.final_length

    if isinstance(value, list):
        out_list: list[Any] = []
        for i, item in enumerate(value):
            cleaned_item, worst, total_original, total_final = _sanitize_value(
                f"{key}[{i}]", item, worst, reasons, total_original, total_final
            )
            out_list.append(cleaned_item)
        return out_list, worst, total_original, total_final

    # Primitives (int, float, bool, None) pass through.
    return value, worst, total_original, total_final


def _try_decode_base64(block: str) -> str | None:
    """Best-effort base64 decode. Returns None on any failure or if decoded
    bytes aren't valid UTF-8 text (binary blobs are not our threat model here)."""
    try:
        # validate=True rejects non-base64 chars; pad if needed.
        padding = "=" * (-len(block) % 4)
        raw = base64.b64decode(block + padding, validate=True)
    except (ValueError, base64.binascii.Error):  # type: ignore[attr-defined]
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None


_SEVERITY_RANK = {Severity.NONE: 0, Severity.LOW: 1, Severity.HIGH: 2}


def _upgrade(current: Severity, candidate: Severity) -> Severity:
    return candidate if _SEVERITY_RANK[candidate] > _SEVERITY_RANK[current] else current
