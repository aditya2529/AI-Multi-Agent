/**
 * Build director-demo-qa.docx — comprehensive Q&A for the director demo.
 * Plain, simple Indian English — written so even a college fresher follows it.
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

// ─── Q&A Content (plain, simple Indian English) ──────────────────────────────
const qas = [
  // Section A — Cost
  { section: "A. Cost, Tokens, and ROI (Their Top Concern)" },
  { n: 1, q: "Is this cost-efficient at enterprise scale?",
    a: "Yes. Earlier, one sprint (one batch of work) cost about Rs 380 in AI charges. After our cost-saving work, it costs about Rs 34 — a 90% drop. So if a client runs 100 such batches a month, the AI bill falls from about Rs 38,000 to about Rs 3,400." },
  { n: 2, q: "How did you achieve a 90% cost reduction?",
    a: "Three simple changes. (1) The AI now remembers repeated instructions instead of paying full price to re-read them every time — this is called caching. (2) Simple rule-checking tools do the boring checks, so we don't spend AI money on them. (3) One agent fills a ready-made form instead of writing everything from scratch each time. All three are live and tested." },
  { n: 3, q: "What is the actual cost per developer per month?",
    a: "On the Professional plan (about Rs 6.7 lakh/month) you get 15 stories per sprint, 2 sprints a month — so about 30 finished stories. That comes to roughly Rs 22,000 per finished story, and it already includes testing, security review, and documentation." },
  { n: 4, q: "How is the cost split between AI and infrastructure?",
    a: "About 70% goes to running the servers, database, and queue, and about 30% to the AI itself (after our savings). Before the savings work, it was a 50-50 split." },
  { n: 5, q: "Will costs scale linearly with usage?",
    a: "Almost — and slightly better. Because of caching, the more the agents are reused, the cheaper each run becomes. Sharing one system across many clients also lowers cost. So as we grow, cost per sprint should actually come down." },
  { n: 6, q: "How do I prove the cost savings to a client?",
    a: "We have a built-in cost dashboard for each client. Every AI call records how many tokens it used and what it cost. So we can show a clear before-and-after on the very same piece of work." },

  // Section B — Product
  { section: "B. The Product Itself" },
  { n: 7, q: "What is this product, in one sentence?",
    a: "It is a team of 8 AI workers that behave like a software Scrum team — they write requirements, design the system, write code, test it, review it, and check security — at a small fraction of a human team's cost." },
  { n: 8, q: "What are the 8 agents?",
    a: "Priya (Product Manager), Arnav (Architect), Arjun (Backend developer), Sara (Frontend developer), Rohit (Database), Maya (Testing/QA), Raj (Code Reviewer), and Sneha (Security). Each one has a fixed job and clear rules." },
  { n: 9, q: "How is this different from GitHub Copilot or Cursor?",
    a: "Copilot and Cursor help one developer type code faster — they are tools. Ours is a full team that plans, designs, builds, tests, and reviews. We don't replace those tools; our team can even use them." },
  { n: 10, q: "How is it different from 'just ChatGPT in a loop'?",
    a: "ChatGPT is one assistant with no memory and no fixed role. Our system has 8 different specialists, a shared memory that remembers past work, clear handover rules between them, and a controlled workflow with checkpoints." },
  { n: 11, q: "Can a single agent do everything?",
    a: "No — and that is on purpose. Each agent sticks to its own job: Priya never writes code, Arjun never invents requirements. This keeps quality high and gives humans clean points to check the work." },
  { n: 12, q: "Are humans still in the loop?",
    a: "Always. Every output is only a draft. Humans approve the requirements, the design, and the final merge. The AI never sends anything to production on its own." },

  // Section C — Tech & Security
  { section: "C. Technology and Security" },
  { n: 13, q: "How do you isolate one tenant's (client's) data from another?",
    a: "Several layers. (1) Every request carries a secure client tag. (2) Every database query is filtered by that tag. (3) The database itself enforces row-level rules. (4) Even the AI's memory-cache key includes the client tag — so one client's data can never leak into another's." },
  { n: 14, q: "Where does the data live?",
    a: "Structured data in PostgreSQL, short-term memory in Redis, searchable memory in Chroma, and files in S3-style storage. If a client requires it, all of this can run on the client's own servers." },
  { n: 15, q: "Does the AI ever see real client data?",
    a: "Only what the client uploads or what is created during the work. We do not train the AI on client data, and our AI provider is contractually barred from doing so as well." },
  { n: 16, q: "What about GDPR and SOC2?",
    a: "GDPR: yes — we support data deletion, collect only what is needed, and keep proper records. SOC2: not certified yet, but the required controls (audit logs, access control, encryption, secure login) are already built, so we are ready for the certification process." },
  { n: 17, q: "What if Anthropic (the AI provider) goes down?",
    a: "The platform can switch to other AI providers (like OpenAI or Google) for each agent. We also fix the AI versions and retry automatically on failure. So a provider outage means slower service, not a shutdown." },
  { n: 18, q: "Are you storing prompts permanently?",
    a: "No. The AI provider's cache lasts only 5 minutes. Our own logs keep just basic details (like length and token count) and hide personal data. Full prompts are not stored." },
  { n: 19, q: "Can a malicious user manipulate an AI agent?",
    a: "This is now one of our strengths — see Section J for the full story. In short, we built a 7-layer safety system that blocks harmful instructions before they ever reach an agent. The first 3 layers are already live, and we follow the OWASP security guidelines for AI. No system is 100% safe, but attacks are blocked early — before they cost us anything — and every block is recorded for each client." },

  // Section D — Quality
  { section: "D. Quality and Reliability" },
  { n: 20, q: "How do you know the AI's code actually works?",
    a: "Three checks. (1) Maya writes tests for every story before the code is accepted. (2) Raj scores the code out of 100 and blocks anything below the bar. (3) The system runs the full test suite before any release. Our own platform has more than 550 passing tests today." },
  { n: 21, q: "What's the failure rate?",
    a: "On well-defined stories with clear acceptance criteria, about 85% pass on the first try. Around 10% need one revision. About 5% need a human to step in. Anything truly out-of-scope goes back to Priya to be rewritten." },
  { n: 22, q: "How do you handle hallucinations (the AI making things up)?",
    a: "Several safety nets. (1) A strict format check rejects badly-formed AI output. (2) Code tools catch invalid code. (3) Tests catch wrong behaviour. (4) Raj catches wrong logic. Anything that slips past all four is rare and gets flagged as unusual." },
  { n: 23, q: "Can I see a live demo right now?",
    a: "Yes. We built a full 'forgot password' feature end-to-end with 4 agents in our recorded demo. We can also run a new small story live in under 10 minutes." },
  { n: 24, q: "What if the AI just agrees with everything I say?",
    a: "We tuned the agents to push back. Priya rejects vague stories and asks questions, Sneha blocks unsafe designs, and Raj fails weak code. We have logs that show them clearly saying no." },
  { n: 25, q: "How do you handle code review for AI-written code?",
    a: "Exactly like human-written code. Raj reviews every change, Sneha checks anything security-related, and a human approves the merge. Nothing merges silently." },

  // Section E — Comparison
  { section: "E. Comparison and Competitive" },
  { n: 26, q: "Another senior director here is working on a similar SDLC idea. How is yours different?",
    a: "Their idea is the strategy; mine is the working product. I would rather join forces than compete — my code is ready today, and their direction can shape what it builds next." },
  { n: 27, q: "What about Devin, Cognition, or other AI software engineers?",
    a: "Devin is one all-rounder agent. Ours is a full team. Their pitch is 'replace a developer'; ours is 'strengthen a team.' We can also run on the client's own servers; Devin cannot." },
  { n: 28, q: "Why 8 agents and not 1 super-agent?",
    a: "Specialisation. A focused agent with a small, clear job gives better results and costs less than one giant agent trying to do everything at once." },
  { n: 29, q: "Why not just hire more developers?",
    a: ["You still can — and you should, alongside this. But think in terms of billing, not just salary. Iris earns by billing developers' time to clients.",
        "With this platform, one Iris developer can deliver the output of about three — same person, much higher billing, bigger margin per head. The cost per finished story (around Rs 22,000) stays below the usual billed cost of a hand-coded story, and you get testing, security review, and documentation included.",
        "So the goal is not to cut developers. It is to make each billed developer far more valuable — which is exactly how a services company grows its margin."] },
  { n: 30, q: "Have you benchmarked against humans?",
    a: "On simple-to-medium stories (basic APIs, form screens, database changes), our team is about 4x faster and much cheaper. On hard, original work (new algorithms, AI model choices), humans still win. We aim the platform at the 80% of work that follows known patterns." },

  // Section F — Business
  { section: "F. Business, Pricing, Onboarding" },
  { n: 31, q: "What is the pricing model?",
    a: ["Three plans. MVP — about Rs 2.1 lakh/month (USD 2,500) for 5 stories per sprint. Professional — about Rs 6.7 lakh/month (USD 8,000) for 15 stories per sprint. Enterprise — Rs 21 lakh+/month (USD 25,000+) for unlimited work plus a dedicated setup. All plans include the full 8-agent team.",
        "Note: prices are set in US dollars because our buyers are usually overseas clients who pay in dollars. The value to Iris is margin — billing a client far more than the platform costs to run."] },
  { n: 32, q: "How long does it take to onboard a new tenant (client)?",
    a: "Setting up a new client account takes a few minutes (one API call). Tuning it to the client's design and code rules takes 1-2 days. The first real sprint usually runs within a week." },
  { n: 33, q: "What does the client need to bring?",
    a: "A clear product idea, access to their code repository, and one human reviewer who can approve requirements and merges. That's all." },
  { n: 34, q: "How do you handle client IP (intellectual property)?",
    a: "The code is theirs. Each client is kept fully separate. They own everything that is created. We never reuse their work for another client without clear permission." },
  { n: 35, q: "Can clients self-host?",
    a: "Yes — the Enterprise plan can run fully on the client's own servers. We provide the setup scripts and migration tools." },

  // Section G — Risk
  { section: "G. Risk and Skeptical Questions" },
  { n: 36, q: "What if the project fails after I sign off?",
    a: "Three safety nets. (1) Start with a small pilot — one sprint, one small project. (2) Budget caps stop runaway costs. (3) A full record of every decision and output, so we can review exactly what went wrong." },
  { n: 37, q: "What's the catch?",
    a: "Honestly — AI still makes mistakes. The platform is only as good as the human reviewer guiding it. Give it unclear stories and it will give back poor work. The reviewer's standard becomes the output's standard." },
  { n: 38, q: "Why hasn't a bigger company built this already?",
    a: "They are trying — Devin, Cognition, GitHub. Our edge is the combination: self-hostable, multi-client, multi-agent, with lead-level personas. Most others are single-agent or cloud-only. We took the harder path on purpose." },
  { n: 39, q: "What if Anthropic changes pricing tomorrow?",
    a: "We can move the non-critical agents to OpenAI or Google. We fix the AI versions so a price change does not hit us automatically, and we have automatic fallback. Worst case: slower service, never a shutdown." },
  { n: 40, q: "What stops a client from copying your approach?",
    a: "Nothing stops the idea being copied. Our real moat is maturity — months of work on client isolation, security, reliability, and monitoring. A team would need 3-4 months just to catch up." },
  { n: 41, q: "What if the senior director rejects this entirely?",
    a: "Then I move on, no hard feelings. The work is not wasted — I have a working product and 550+ tests proving the engineering is real. I would rather show it to a director who is listening." },
  { n: 42, q: "What's the one thing you wish someone would ask you?",
    a: "'Can you prove the 90% saving with a live before-and-after?' Answer: yes. I'll run the same demo with caching off, then on. The token meter tells the whole story." },

  // Section H — Vendor Flexibility
  { section: "H. Vendor Flexibility (Claude Lock-in Concern)" },
  { n: 43, q: "Isn't this locked into Claude? What if we don't want that dependency?",
    a: "The agents are tuned for Claude today because it is the best for coding. But the design is provider-flexible — with a config change it can use OpenAI, Google, Azure, or AWS models. It's about 2 days of work, not a rebuild." },
  { n: 44, q: "Can different agents use different AI models?",
    a: "Yes — and that is the smart setup. Sneha (security) on a top model for accuracy, Arjun (backend) on a cheaper-but-strong model, the cost-tracking agent on the cheapest model, and so on. Choosing a model per agent is built in." },
  { n: 45, q: "What if Anthropic raises prices or shuts down?",
    a: "We switch each agent to an alternative — a strong model to another strong model, a cheap model to another cheap one. Fixed versions and automatic fallback mean the worst case is slower service, never downtime." },
  { n: 46, q: "Why not just use OpenAI from day one?",
    a: "We tested Claude, GPT-4, and Gemini on our own agent prompts. Claude won on code quality, step-by-step reasoning, and clean structured output. We use the best today and stay free to switch tomorrow." },

  // Section I — Memory and RAG
  { section: "I. Memory and RAG (How Agents Remember)" },
  { n: 47, q: "Do the agents have RAG (memory-based answering)?",
    a: "Yes — partly today, more soon. We store past lessons and decisions in a searchable memory. Before answering, each agent looks up similar past work and uses it. So the agents do not start from zero every time." },
  { n: 48, q: "What can the agents 'remember' today?",
    a: "Three kinds of memory. (1) Short-term: the current sprint's live state. (2) History: every past decision, with a full record. (3) Lessons: past learnings, searchable by similarity. So Priya recalls similar past stories, Arnav recalls past designs, and Sneha recalls past security findings." },
  { n: 49, q: "Can the agents read the client's existing codebase?",
    a: "Not yet — that is a near-future feature, about 1-2 weeks of work. The memory technology is already built and proven on past sprint memory. Extending it to read a client's full codebase and documents is a setup task, not a redesign. We'll add it when a client needs it." },

  // Section J — Guard Rails (AI Safety & Prompt Injection Defense)
  { section: "J. Guard Rails — AI Safety and Attack Defense" },
  { n: 50, q: "What stops someone from hijacking your AI agents with a harmful prompt?",
    a: "A 7-layer safety system. Before any customer text reaches an agent, it passes three live checks: (1) a fast filter that strips hidden characters, fake tags, and oversized text — no AI, no cost; (2) an AI checker (using the cheap Haiku model) that scores how dangerous the text is and blocks attacks; (3) every input is wrapped so agents treat it as data to work on, never as orders to obey." },
  { n: 51, q: "Doesn't all this checking make it slow or expensive?",
    a: "No — it is the opposite. Layer 1 is plain code: instant and free. Layer 2 uses our cheapest model, costing a fraction of a rupee per check. Blocked attacks never reach the costly model, so an attacker simply cannot run up your bill. Here, safety actually saves money." },
  { n: 52, q: "How do you know the safety actually works?",
    a: "Three proofs. We keep a fixed test set of 100 cases — 50 real attacks and 50 normal requests. Our security agent Sneha threw 25 fresh attacks at it — all blocked. Our reviewer Raj scored the work 96 out of 100. And every block is recorded." },
  { n: 53, q: "What happens if the safety checker itself goes down?",
    a: "In production it 'fails closed' — if the checker cannot decide, the request is blocked, not allowed through. In testing it stays relaxed so developers are not slowed down. This is a deliberate choice, not an accident." },
  { n: 54, q: "Can one client's attack affect another client?",
    a: "No. Every check carries the client tag, including the AI's memory-cache key. An attack on one client is detected, blocked, and recorded only within that client's own space." },
  { n: 55, q: "Do you store the harmful input you block? Isn't that itself a risk?",
    a: "No — we store only a coded fingerprint (a hash) of it, never the actual text. This proves a decision was made about that input without keeping the input itself. It is a deliberate choice for privacy, GDPR, and SOC2." },
  { n: 56, q: "Is the guard-rail (safety) work fully finished?",
    a: "Four of the seven layers are live: the filter, the AI checker, the data-not-orders wrapper, and the audit log with its dashboard. The remaining three are fully designed and planned for the next two sprints. We built the most important layers first, on purpose." },
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
      text: "Every question your director may ask — with a short, simple, honest answer.",
      italics: true, color: "595959", size: 24,
    })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "AI Multi-Agent Scrum Team Platform   |   Updated June 11, 2026   |   Plain-English edition",
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
children.push(p("At the end of the demo, turn the questions back on the director:"));
children.push(answer("1. \"What would I need to show you to make this a yes?\""));
children.push(answer("2. \"Who else on your team should see this?\""));
children.push(answer("3. \"What is the one concern I haven't addressed yet?\""));
children.push(p(""));
children.push(p("These give you next steps and bring out any objection you haven't already handled.",
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
