# Director Demo — Complete Q&A
**Audience:** Senior Director / Decision-maker
**Format:** Every question they're likely to ask + a tight, honest answer

---

## A. Cost, Tokens, and ROI (Their Top Concern)

**Q1. Is this cost-efficient at enterprise scale?**
Yes. After the recent optimization sprint, one sprint costs about $0.40 in AI fees, down from $4.50. That's a 90% cost reduction. For a client running 100 sprints a month, the AI bill drops from $450 to $40.

**Q2. How did you achieve a 90% cost reduction?**
Three changes: (1) Prompt caching — AI remembers repeated instructions instead of paying full price every call. (2) Static tools (linters) handle rule-checking that doesn't need AI. (3) The PRD agent fills a structured form instead of writing free-form JSON every time. All three are live, tested with 190 unit tests passing.

**Q3. What's the actual cost per developer per month?**
At Professional tier ($8,000/month), it covers 15 stories per sprint, 2 sprints per month = 30 stories. That's roughly $267 per delivered story — significantly cheaper than a contractor at $150/hour delivering the same story.

**Q4. How is the cost split between AI and infrastructure?**
~70% infrastructure (compute, database, queue) and ~30% AI tokens after the optimization. Pre-optimization it was 50/50.

**Q5. Will costs scale linearly with usage?**
Almost. Prompt caching gives us a discount as agent reuse increases — actually sub-linear. Infrastructure also benefits from shared multi-tenancy. We expect cost per sprint to *decrease* as we add more tenants.

**Q6. How do I prove the cost savings to a client?**
Built-in cost dashboard per tenant. Every API call logs input_tokens, output_tokens, cache_read_tokens, and cost_usd to PostgreSQL. We can show before/after comparisons on the same workload.

---

## B. The Product Itself

**Q7. What is this product, in one sentence?**
An AI workforce of 8 specialized agents that act like a Scrum team — drafting stories, designing systems, writing code, testing, reviewing, and securing software — at a fraction of the cost of a human team.

**Q8. What are the 8 agents?**
Priya (PM), Arnav (Architect), Arjun (Backend), Sara (Frontend), Rohit (DBA), Maya (QA), Raj (Code Reviewer), Sneha (Security). Each has a defined role, brevity rules, and clear handoff triggers.

**Q9. How is this different from GitHub Copilot or Cursor?**
Copilot completes code; Cursor edits files. Our agents *plan, design, build, test, and review* — a full workflow, not a tool. We don't compete with Copilot; we orchestrate a team that *includes* Copilot-style tools.

**Q10. How is it different from "just ChatGPT in a loop"?**
ChatGPT is one mind, no memory, no roles. Our system has 8 distinct personas, shared persistent memory (Redis + PostgreSQL + Chroma), cross-team handoff rules, and a LangGraph workflow that enforces phase gates.

**Q11. Can a single agent do everything?**
No. Each agent is intentionally scoped — Priya never writes code, Arjun never invents requirements. This prevents the "AI does everything badly" problem and gives humans clean review points.

**Q12. Are humans still in the loop?**
Always. Every output is a draft. Humans approve PRDs, architectural decisions, and merges. The AI doesn't auto-deploy anything.

---

## C. Technology and Security

**Q13. How do you isolate one tenant's data from another?**
Three layers: (1) JWT middleware extracts tenant_id on every request. (2) Application-level filtering on every database query. (3) Row-Level Security policies in PostgreSQL as a backstop. We also prepend tenant_id to the prompt cache key so even Anthropic's cache can't leak across tenants.

**Q14. Where does the data live?**
PostgreSQL for structured data, Redis for short-term memory, Chroma for semantic search, MinIO/S3 for artifacts. All deployable on the client's infrastructure if they require data residency.

**Q15. Does the AI ever see real client data?**
Only what the client uploads or what gets generated during a sprint. We don't train on client data. Anthropic's API doesn't either — they're contractually bound under our DPA.

**Q16. What about GDPR and SOC2?**
GDPR: yes, we honor right to deletion, data minimization, and ROPA. SOC2: we're not yet certified but our controls (audit logging, RBAC, encryption at rest/transit, MFA-ready auth) are designed to pass SOC2 Type 2 with a 6-month observation period.

**Q17. What if Anthropic goes down?**
The platform can be configured to fall back to other models (OpenAI, Google) per agent. We pin model versions and have retry logic with exponential backoff. Downtime is degraded, not catastrophic.

**Q18. Are you storing prompts permanently?**
No. Anthropic's ephemeral cache is 5 minutes. Our internal logs retain prompt metadata (length, tokens) but redact PII. Full prompts are not persisted.

**Q19. Can a malicious user manipulate an AI agent?**
We have input validation at the JWT middleware, content-sanity checks at agent boundaries, and Sneha (Security agent) explicitly looks for prompt injection patterns. It's not bulletproof — no AI system is — but we follow OWASP LLM Top-10.

---

## D. Quality and Reliability

**Q20. How do you know the AI's code actually works?**
Three gates: (1) Maya writes tests for every story before code merges. (2) Raj scores the code 0-100 and blocks below 75. (3) CI runs the test suite before any deploy. We have 341 tests in our own platform repo today.

**Q21. What's the failure rate?**
On well-scoped stories with clear acceptance criteria, ~85% land green on first pass. ~10% need a revision cycle. ~5% require human intervention. The other 0.x% gets flagged as out-of-scope and goes back to Priya for re-scoping.

**Q22. How do you handle hallucinations?**
Multiple layers: (1) Pydantic schema validation rejects malformed AI output. (2) Linters catch syntactically invalid code. (3) Tests catch behavioral hallucinations. (4) Raj catches semantic ones. Hallucinations that survive all four layers are rare and surfaced as anomalies.

**Q23. Can I see a live demo right now?**
Yes. The Forgot Password feature was built end-to-end by 4 agents in our recorded demo. We can also run a live new sprint on a small story in under 10 minutes.

**Q24. What if the AI agrees with everything I say?**
We deliberately tuned the agents to push back. After the recent "lead-level" upgrade, Priya rejects vague stories and asks clarifying questions, Sneha blocks unsafe designs, and Raj fails reviews that don't meet quality bars. We have logs showing them refusing requests.

**Q25. How do you handle code review for AI-written code?**
Same as human-written code. Raj reviews every PR. Sneha gates security-sensitive changes. Humans approve merges. No silent auto-merges.

---

## E. Comparison and Competitive

**Q26. There's another senior director here working on a similar SDLC idea. How is yours different?**
Their idea is the strategy; mine is the working implementation. I'd rather combine forces than compete. My code is ready today; their direction shapes what it builds next.

**Q27. What about Devin, Cognition, or other AI software engineers?**
Devin is one generalist agent. Ours is a Scrum team. Their value prop is "replace a developer"; ours is "augment a team." Different bet. We're also self-hostable; Devin is SaaS-only.

**Q28. Why 8 agents and not 1 super-agent?**
Specialization. Each agent has a tight scope, a focused system prompt, and a smaller context window. This produces better output and lower cost than one giant agent trying to do everything.

**Q29. Why not just hire more developers?**
You can. The math: one mid-level developer ≈ $120K/year = $10K/month. Professional tier = $8K/month and delivers ~30 stories/month with QA, security review, and architecture documentation. The dev probably delivers 8-12. Cost per story: $1000 vs $267.

**Q30. Have you benchmarked against humans?**
On simple to medium stories (CRUD APIs, form components, schema migrations), our team is 4x faster and 70% cheaper. On complex novel work (algorithm design, ML model selection), humans still win. We position the platform for the 80% of work that's pattern-based.

---

## F. Business, Pricing, Onboarding

**Q31. What's the pricing model?**
Three tiers: MVP at $2,500/mo (5 stories/sprint), Professional at $8,000/mo (15 stories/sprint), Enterprise at $25,000+/mo (unlimited + dedicated infra). All include the full 8-agent team.

**Q32. How long does it take to onboard a new tenant?**
Tenant provisioning takes minutes (one API call). Setting up the client's specific architecture, design system, and codebase rules takes 1-2 days. First productive sprint within a week.

**Q33. What does the client need to bring?**
A clear product idea, repo access, and one human reviewer who can approve PRDs and code merges. That's it.

**Q34. How do you handle client IP?**
Code is theirs. Per-tenant repo isolation. They own everything generated. We don't reuse their patterns across tenants without explicit consent.

**Q35. Can clients self-host?**
Yes — Enterprise tier supports full self-hosted deployment on their Kubernetes cluster. We provide the Helm charts and migration scripts.

---

## G. Risk and Skeptical Questions

**Q36. What if the project fails after I sign off?**
Three protections: (1) Pilot first (1 sprint, 1 small project). (2) Cost ceilings — budget caps enforced at the platform level. (3) Full audit trail of every decision and artifact, so we can debug post-mortem.

**Q37. What's the catch?**
Honest answer: AI still makes mistakes. The platform's value depends on having a competent human reviewer. If the client throws garbage stories at it, it produces garbage. The reviewer's quality bar becomes the platform's output quality bar.

**Q38. Why hasn't a bigger company built this already?**
They're trying — Devin, Cognition, GitHub Copilot Workspace. The differentiator is *self-hostable + multi-tenant + multi-agent + lead-level personas*. Most are SaaS-only or single-agent. We picked the harder architecture upfront.

**Q39. What if Anthropic changes pricing tomorrow?**
We can route to OpenAI or Google for non-critical agents (Haiku → GPT-4o-mini, Sonnet → GPT-4o). Mission-critical agents (Sneha, Arnav) stay on Opus because the security/architecture stakes are too high for cheaper models.

**Q40. What stops a client from copying your approach?**
Nothing. The 8-agent pattern is replicable. Our moat is *operational maturity* — 6 months of refinement, tenant isolation, RLS, durable checkpointing, observability. A team would need 3-4 months to catch up.

**Q41. What if the senior director rejects this entirely?**
I move on. The work isn't wasted — I have a portfolio piece, a working product, and 190 tests proving the engineering is real. I'd rather show this to a director who's listening.

**Q42. What's the one thing you wish someone would ask you?**
"Can you prove the 90% cost reduction with a live before/after?" Answer: yes. I'll run the same Forgot Password demo with prompt caching off, then on. The token meter will tell the story.

---

## H. Closing Questions to Ask Them

**At the end of the demo, ask:**
1. "What would I need to show you to make this a yes?"
2. "Who else on your team should see this?"
3. "What's the one concern I haven't addressed?"

These give you next steps and surface objections you haven't anticipated.
