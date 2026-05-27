# Token Efficiency Report

**Purpose:** Show where the platform wastes AI tokens — and how moving that logic into code cuts cost without losing quality.

**Date:** May 16, 2026

---

## The Big Idea

AI is expensive. Code is free to run.

Every time we ask the AI to do something that a normal Python function could do, we waste money. The director is right — for enterprise clients to say yes, the platform must use AI **only where AI is needed**: judgment, generation, reasoning.

Everything else — checking rules, counting lines, parsing JSON, validating formats — belongs in code.

---

## Where We Are Wasting Tokens Today

| # | Where | What's Happening Now | Why It's Wasteful |
|---|---|---|---|
| 1 | **Code review agent** | AI is told "check function length <= 40 lines, file length <= 500 lines, complexity <= 10" | Linters (`ruff`, `radon`) do this in milliseconds for free |
| 2 | **PRD generation** | 4,000+ tokens of JSON schema sent on every call | Should be a Pydantic model. AI fills the fields; the schema is in code |
| 3 | **Security review** | AI looks for hardcoded secrets, commented-out code | Tools like `bandit` and `grep` find these instantly |
| 4 | **QA agent** | AI is told "coverage must be >= 80%" | `pytest --cov` returns the exact number. Code reads it |
| 5 | **Confidence scoring** | AI guesses a number 0–100 | Should be calculated: count missing fields × -5 = score |
| 6 | **Edge case lists** | AI asked to list edge cases (empty, null, Unicode, race conditions) | Same standard checklist every time. Hardcode it |
| 7 | **JSON parsing** | Prompts say "output JSON with these keys" | Use **tool use / structured outputs** — fewer tokens, zero parse errors |
| 8 | **System prompts** | Same long prompt sent fresh every call | Anthropic's **prompt caching** cuts repeated context by 90% |
| 9 | **Severity tagging** | AI decides ERROR vs WARNING vs INFO | Rules: bare except = ERROR, missing docstring = WARNING. Code does this |
| 10 | **Cross-tenant routing** | Agent reasoning about who to ping | Already coded in our new "Cross-Team Triggers" — keep it as code |

---

## Estimated Savings

Rough numbers for one sprint (10 stories) on the current system:

| Item | Tokens Today | Tokens After Fix | Savings |
|---|---|---|---|
| PRD schema sent on every call | ~80,000 | ~5,000 (Pydantic model) | 75,000 |
| Code review rule lists | ~40,000 | ~5,000 (rules in linter) | 35,000 |
| Repeated system prompts | ~120,000 | ~12,000 (with prompt caching) | 108,000 |
| Edge case checklists | ~20,000 | ~2,000 (hardcoded) | 18,000 |
| Static analysis prompts | ~30,000 | ~0 (tools do it) | 30,000 |
| **Total per sprint** | **~290,000** | **~24,000** | **~266,000 (92%)** |

**In dollar terms:** ~$4.50 per sprint → ~$0.40 per sprint.

For a Citi-scale client running 100 sprints/month, that's **$450/mo → $40/mo per project**.

---

## Where AI Should Still Run

These need real intelligence — keep them as AI:

- Writing the actual story narrative (Priya)
- Choosing between two architecture options with trade-offs (Arnav)
- Writing code that solves a business problem (Arjun, Sara)
- Designing test scenarios for new behavior (Maya)
- Explaining *why* a code review finding matters (Raj)
- Spotting a non-obvious security threat (Sneha)

---

## What We Will Change

Three concrete moves:

1. **Move static checks to code.** Linters and analyzers run before the AI ever sees the code. AI only reviews what the linter couldn't catch.

2. **Use Anthropic prompt caching.** System prompts and large schemas are cached. We pay full price once, then 10% for every call after.

3. **Use structured outputs (tool use).** Instead of begging the AI to "please return JSON", we declare the output shape as a tool. The AI fills it. Zero parse errors, fewer tokens.

---

## Bottom Line for the Director

> "We agree. We're moving every check that *code can do* into code. AI is reserved for what *only AI can do* — judgment, generation, and reasoning. Expected token cost drops by ~90% per sprint. We can prove this with a side-by-side comparison."
