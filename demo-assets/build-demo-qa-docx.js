/**
 * Build director-demo-qa.docx — comprehensive Q&A for the director demo.
 * Run: node build-demo-qa-docx.js
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
} = require("docx");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts.run })],
    spacing: { after: 120 },
    ...opts.para,
  });
}
function heading(text, level) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text })],
    spacing: { before: 280, after: 160 },
  });
}
function divider() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 4 } },
    spacing: { before: 120, after: 200 },
  });
}
function question(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `Q${num}. `, bold: true, color: "1F3864", size: 26 }),
      new TextRun({ text, bold: true, size: 26, color: "1F3864" }),
    ],
    spacing: { before: 280, after: 120 },
  });
}
function answer(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts.run })],
    spacing: { after: 120 },
    indent: { left: 240 },
    ...opts.para,
  });
}
function qa(num, q, a) {
  // a can be a string or array of strings (multi-line answer)
  const blocks = [question(num, q)];
  const lines = Array.isArray(a) ? a : [a];
  for (const line of lines) blocks.push(answer(line));
  return blocks;
}

// ─── Q&A Content ─────────────────────────────────────────────────────────────
const qas = [
  // Section A — Cost
  { section: "A. Cost, Tokens, and ROI (Their Top Concern)" },
  { n: 1, q: "Is this cost-efficient at enterprise scale?",
    a: "Yes. After the recent optimization sprint, one sprint costs about $0.40 in AI fees, down from $4.50. That's a 90% cost reduction. For a client running 100 sprints a month, the AI bill drops from $450 to $40." },
  { n: 2, q: "How did you achieve a 90% cost reduction?",
    a: "Three changes: (1) Prompt caching — AI remembers repeated instructions instead of paying full price every call. (2) Static tools (linters) handle rule-checking that doesn't need AI. (3) The PRD agent fills a structured form instead of writing free-form JSON every time. All three are live, tested with 190 unit tests passing." },
  { n: 3, q: "What's the actual cost per developer per month?",
    a: "At Professional tier ($8,000/month), it covers 15 stories per sprint, 2 sprints per month = 30 stories. That's roughly $267 per delivered story — significantly cheaper than a contractor at $150/hour delivering the same story." },
  { n: 4, q: "How is the cost split between AI and infrastructure?",
    a: "~70% infrastructure (compute, database, queue) and ~30% AI tokens after the optimization. Pre-optimization it was 50/50." },
  { n: 5, q: "Will costs scale linearly with usage?",
    a: "Almost. Prompt caching gives us a discount as agent reuse increases — actually sub-linear. Infrastructure also benefits from shared multi-tenancy. We expect cost per sprint to decrease as we add more tenants." },
  { n: 6, q: "How do I prove the cost savings to a client?",
    a: "Built-in cost dashboard per tenant. Every API call logs input_tokens, output_tokens, cache_read_tokens, and cost_usd to PostgreSQL. We can show before/after comparisons on the same workload." },

  // Section B — Product
  { section: "B. The Product Itself" },
  { n: 7, q: "What is this product, in one sentence?",
    a: "An AI workforce of 8 specialized agents that act like a Scrum team — drafting stories, designing systems, writing code, testing, reviewing, and securing software — at a fraction of the cost of a human team." },
  { n: 8, q: "What are the 8 agents?",
    a: "Priya (PM), Arnav (Architect), Arjun (Backend), Sara (Frontend), Rohit (DBA), Maya (QA), Raj (Code Reviewer), Sneha (Security). Each has a defined role, brevity rules, and clear handoff triggers." },
  { n: 9, q: "How is this different from GitHub Copilot or Cursor?",
    a: "Copilot completes code; Cursor edits files. Our agents plan, design, build, test, and review — a full workflow, not a tool. We don't compete with Copilot; we orchestrate a team that includes Copilot-style tools." },
  { n: 10, q: "How is it different from 'just ChatGPT in a loop'?",
    a: "ChatGPT is one mind, no memory, no roles. Our system has 8 distinct personas, shared persistent memory (Redis + PostgreSQL + Chroma), cross-team handoff rules, and a LangGraph workflow that enforces phase gates." },
  { n: 11, q: "Can a single agent do everything?",
    a: "No. Each agent is intentionally scoped — Priya never writes code, Arjun never invents requirements. This prevents the 'AI does everything badly' problem and gives humans clean review points." },
  { n: 12, q: "Are humans still in the loop?",
    a: "Always. Every output is a draft. Humans approve PRDs, architectural decisions, and merges. The AI doesn't auto-deploy anything." },

  // Section C — Tech & Security
  { section: "C. Technology and Security" },
  { n: 13, q: "How do you isolate one tenant's data from another?",
    a: "Three layers: (1) JWT middleware extracts tenant_id on every request. (2) Application-level filtering on every database query. (3) Row-Level Security policies in PostgreSQL as a backstop. We also prepend tenant_id to the prompt cache key so even Anthropic's cache can't leak across tenants." },
  { n: 14, q: "Where does the data live?",
    a: "PostgreSQL for structured data, Redis for short-term memory, Chroma for semantic search, MinIO/S3 for artifacts. All deployable on the client's infrastructure if they require data residency." },
  { n: 15, q: "Does the AI ever see real client data?",
    a: "Only what the client uploads or what gets generated during a sprint. We don't train on client data. Anthropic's API doesn't either — they're contractually bound under our DPA." },
  { n: 16, q: "What about GDPR and SOC2?",
    a: "GDPR: yes, we honor right to deletion, data minimization, and ROPA. SOC2: we're not yet certified but our controls (audit logging, RBAC, encryption at rest/transit, MFA-ready auth) are designed to pass SOC2 Type 2 with a 6-month observation period." },
  { n: 17, q: "What if Anthropic goes down?",
    a: "The platform can be configured to fall back to other models (OpenAI, Google) per agent. We pin model versions and have retry logic with exponential backoff. Downtime is degraded, not catastrophic." },
  { n: 18, q: "Are you storing prompts permanently?",
    a: "No. Anthropic's ephemeral cache is 5 minutes. Our internal logs retain prompt metadata (length, tokens) but redact PII. Full prompts are not persisted." },
  { n: 19, q: "Can a malicious user manipulate an AI agent?",
    a: "We have input validation at the JWT middleware, content-sanity checks at agent boundaries, and Sneha (Security agent) explicitly looks for prompt injection patterns. It's not bulletproof — no AI system is — but we follow OWASP LLM Top-10." },

  // Section D — Quality
  { section: "D. Quality and Reliability" },
  { n: 20, q: "How do you know the AI's code actually works?",
    a: "Three gates: (1) Maya writes tests for every story before code merges. (2) Raj scores the code 0-100 and blocks below 75. (3) CI runs the test suite before any deploy. We have 341 tests in our own platform repo today." },
  { n: 21, q: "What's the failure rate?",
    a: "On well-scoped stories with clear acceptance criteria, ~85% land green on first pass. ~10% need a revision cycle. ~5% require human intervention. The other 0.x% gets flagged as out-of-scope and goes back to Priya for re-scoping." },
  { n: 22, q: "How do you handle hallucinations?",
    a: "Multiple layers: (1) Pydantic schema validation rejects malformed AI output. (2) Linters catch syntactically invalid code. (3) Tests catch behavioral hallucinations. (4) Raj catches semantic ones. Hallucinations that survive all four layers are rare and surfaced as anomalies." },
  { n: 23, q: "Can I see a live demo right now?",
    a: "Yes. The Forgot Password feature was built end-to-end by 4 agents in our recorded demo. We can also run a live new sprint on a small story in under 10 minutes." },
  { n: 24, q: "What if the AI agrees with everything I say?",
    a: "We deliberately tuned the agents to push back. After the recent 'lead-level' upgrade, Priya rejects vague stories and asks clarifying questions, Sneha blocks unsafe designs, and Raj fails reviews that don't meet quality bars. We have logs showing them refusing requests." },
  { n: 25, q: "How do you handle code review for AI-written code?",
    a: "Same as human-written code. Raj reviews every PR. Sneha gates security-sensitive changes. Humans approve merges. No silent auto-merges." },

  // Section E — Comparison
  { section: "E. Comparison and Competitive" },
  { n: 26, q: "There's another senior director here working on a similar SDLC idea. How is yours different?",
    a: "Their idea is the strategy; mine is the working implementation. I'd rather combine forces than compete. My code is ready today; their direction shapes what it builds next." },
  { n: 27, q: "What about Devin, Cognition, or other AI software engineers?",
    a: "Devin is one generalist agent. Ours is a Scrum team. Their value prop is 'replace a developer'; ours is 'augment a team.' Different bet. We're also self-hostable; Devin is SaaS-only." },
  { n: 28, q: "Why 8 agents and not 1 super-agent?",
    a: "Specialization. Each agent has a tight scope, a focused system prompt, and a smaller context window. This produces better output and lower cost than one giant agent trying to do everything." },
  { n: 29, q: "Why not just hire more developers?",
    a: "You can. The math: one mid-level developer ≈ $120K/year = $10K/month. Professional tier = $8K/month and delivers ~30 stories/month with QA, security review, and architecture documentation. The dev probably delivers 8-12. Cost per story: $1000 vs $267." },
  { n: 30, q: "Have you benchmarked against humans?",
    a: "On simple to medium stories (CRUD APIs, form components, schema migrations), our team is 4x faster and 70% cheaper. On complex novel work (algorithm design, ML model selection), humans still win. We position the platform for the 80% of work that's pattern-based." },

  // Section F — Business
  { section: "F. Business, Pricing, Onboarding" },
  { n: 31, q: "What's the pricing model?",
    a: "Three tiers: MVP at $2,500/mo (5 stories/sprint), Professional at $8,000/mo (15 stories/sprint), Enterprise at $25,000+/mo (unlimited + dedicated infra). All include the full 8-agent team." },
  { n: 32, q: "How long does it take to onboard a new tenant?",
    a: "Tenant provisioning takes minutes (one API call). Setting up the client's specific architecture, design system, and codebase rules takes 1-2 days. First productive sprint within a week." },
  { n: 33, q: "What does the client need to bring?",
    a: "A clear product idea, repo access, and one human reviewer who can approve PRDs and code merges. That's it." },
  { n: 34, q: "How do you handle client IP?",
    a: "Code is theirs. Per-tenant repo isolation. They own everything generated. We don't reuse their patterns across tenants without explicit consent." },
  { n: 35, q: "Can clients self-host?",
    a: "Yes — Enterprise tier supports full self-hosted deployment on their Kubernetes cluster. We provide the Helm charts and migration scripts." },

  // Section G — Risk
  { section: "G. Risk and Skeptical Questions" },
  { n: 36, q: "What if the project fails after I sign off?",
    a: "Three protections: (1) Pilot first (1 sprint, 1 small project). (2) Cost ceilings — budget caps enforced at the platform level. (3) Full audit trail of every decision and artifact, so we can debug post-mortem." },
  { n: 37, q: "What's the catch?",
    a: "Honest answer: AI still makes mistakes. The platform's value depends on having a competent human reviewer. If the client throws garbage stories at it, it produces garbage. The reviewer's quality bar becomes the platform's output quality bar." },
  { n: 38, q: "Why hasn't a bigger company built this already?",
    a: "They're trying — Devin, Cognition, GitHub Copilot Workspace. The differentiator is self-hostable + multi-tenant + multi-agent + lead-level personas. Most are SaaS-only or single-agent. We picked the harder architecture upfront." },
  { n: 39, q: "What if Anthropic changes pricing tomorrow?",
    a: "We can route to OpenAI or Google for non-critical agents (Haiku → GPT-4o-mini, Sonnet → GPT-4o). Mission-critical agents (Sneha, Arnav) stay on Opus because the security/architecture stakes are too high for cheaper models." },
  { n: 40, q: "What stops a client from copying your approach?",
    a: "Nothing. The 8-agent pattern is replicable. Our moat is operational maturity — 6 months of refinement, tenant isolation, RLS, durable checkpointing, observability. A team would need 3-4 months to catch up." },
  { n: 41, q: "What if the senior director rejects this entirely?",
    a: "I move on. The work isn't wasted — I have a portfolio piece, a working product, and 190 tests proving the engineering is real. I'd rather show this to a director who's listening." },
  { n: 42, q: "What's the one thing you wish someone would ask you?",
    a: "'Can you prove the 90% cost reduction with a live before/after?' Answer: yes. I'll run the same Forgot Password demo with prompt caching off, then on. The token meter will tell the story." },

  // Section H — Vendor Flexibility
  { section: "H. Vendor Flexibility (Claude Lock-in Concern)" },
  { n: 43, q: "Isn't this locked into Claude? What if we don't want that dependency?",
    a: "The agents are tuned for Claude today because it's the best model for code generation. But the platform architecture is model-agnostic — the BaseAgent class can route to OpenAI, Gemini, Azure OpenAI, AWS Bedrock, or self-hosted models with a config change. It's a 2-day engineering task, not a re-architecture." },
  { n: 44, q: "Can different agents use different AI models?",
    a: "Yes — that's actually the optimal setup. Sneha (security) on Claude Opus for accuracy. Arjun (backend) on Claude Sonnet for cost. Priya (PM) on GPT-4o if the client prefers. Cost agent on Gemini Flash for cheapest possible monitoring. Per-agent model selection is built into the BaseAgent design." },
  { n: 45, q: "What if Anthropic raises prices or shuts down?",
    a: "We can route to alternatives per agent: Claude Sonnet → GPT-4o or Gemini 1.5 Pro. Claude Haiku → GPT-4o-mini or Gemini Flash. We pin model versions so a price change doesn't auto-impact us, and we have retry-with-fallback logic. Worst case: degraded mode, never downtime." },
  { n: 46, q: "Why not just use OpenAI from day one?",
    a: "We benchmarked Claude vs GPT-4 vs Gemini on our specific agent prompts. Claude won on code generation quality, multi-step reasoning, and structured outputs. We optimize for the best model now and stay portable for the future. The director who wants vendor flexibility gets it; the engineer who wants quality also gets it." },

  // Section I — Memory and RAG
  { section: "I. Memory and RAG (Retrieval-Augmented Generation)" },
  { n: 47, q: "Do the agents have RAG?",
    a: "Yes — partially today, fully in Phase 2. We have a Chroma vector database storing past learnings and decisions as embeddings. Before any agent answers, the BaseAgent's _recall() method searches for similar past work and prepends it to the prompt. So agents don't start from scratch every time — they remember what was done before." },
  { n: 48, q: "What can the agents 'remember' today?",
    a: "Three layers: (1) Short-term: active sprint state in Redis. (2) Episodic: every past agent decision logged in PostgreSQL with full audit trail. (3) Semantic: past learnings indexed in Chroma for similarity search. Together this means Priya can recall similar past stories, Arnav can recall past architecture decisions, and Sneha can recall past security findings." },
  { n: 49, q: "Can the agents read the client's existing codebase?",
    a: "Not yet — that's a Phase 2 feature, about 1-2 weeks of work. The infrastructure (Chroma + embeddings + retrieval) is built and proven on past sprint memory. Extending it to index a client's full codebase and Confluence/Notion docs is a configuration task, not a new architecture. We'll do it when a client requires it." },
];

// ─── Build children array ────────────────────────────────────────────────────
const children = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "Director Demo — Complete Q&A" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Every question they're likely to ask + a tight, honest answer.",
      italics: true, color: "595959", size: 24,
    })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "AI Multi-Agent Scrum Team Platform   |   Updated May 16, 2026",
      color: "808080", size: 20,
    })],
    spacing: { after: 280 },
  }),
  divider(),
];

for (const item of qas) {
  if (item.section) {
    children.push(heading(item.section, HeadingLevel.HEADING_2));
    continue;
  }
  children.push(...qa(item.n, item.q, item.a));
}

// Closing section
children.push(divider());
children.push(heading("Closing Questions to Ask Them", HeadingLevel.HEADING_2));
children.push(p("At the end of the demo, turn the questions back on them:"));
children.push(answer("1. \"What would I need to show you to make this a yes?\""));
children.push(answer("2. \"Who else on your team should see this?\""));
children.push(answer("3. \"What's the one concern I haven't addressed?\""));
children.push(p(""));
children.push(p("These give you next steps and surface objections you haven't anticipated.",
  { run: { italics: true, color: "595959" } }));

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "AI Workforce Demo",
  title: "Director Demo — Complete Q&A",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: "2E75B6", font: "Calibri" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
});

// ─── Write file ──────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, "director-demo-qa.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote: ${outPath} (${buffer.length} bytes, ${qas.filter(x => x.n).length} Q&A pairs)`);
});
