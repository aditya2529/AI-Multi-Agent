/**
 * Build architecture-overview.docx — full architecture doc.
 * Run: NODE_PATH=<global> node build-architecture-docx.js
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, BorderStyle, WidthType,
  Table, TableRow, TableCell, ShadingType,
} = require("docx");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

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
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text })],
    spacing: { after: 60 },
  });
}
function divider() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 4 } },
    spacing: { before: 120, after: 200 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 18, color: "264A6E" })],
    spacing: { after: 60 },
    shading: { type: ShadingType.SOLID, color: "F2F2F2" },
    indent: { left: 240, right: 240 },
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: opts.bold, color: opts.color, size: 20 })],
    })],
    borders: cellBorders,
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  });
}
function table(rows, opts = {}) {
  return new Table({
    rows: rows.map((r, i) => new TableRow({
      children: r.map((c, j) => cell(c, {
        bold: i === 0,
        shading: i === 0 ? "1F3864" : undefined,
        color: i === 0 ? "FFFFFF" : undefined,
        width: opts.widths ? opts.widths[j] : undefined,
      })),
    })),
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Children ────────────────────────────────────────────────────────────────
const children = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "AI Multi-Agent Scrum Team" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Architecture, Technology, and Workflows",
      italics: true, color: "595959", size: 26 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Updated May 16, 2026   |   Status: Phase 1 Complete + Token Optimization Done",
      color: "808080", size: 20 })],
    spacing: { after: 280 },
  }),
  divider(),

  // ─── PART 1: Plain English ────────────────────────────────────────────────
  heading("Part 1 — Explain Like I'm 16", HeadingLevel.HEADING_2),
  p("Imagine the app as a movie production team.", { run: { italics: true } }),

  heading("The Cast — 8 AI Agents", HeadingLevel.HEADING_3),
  p("Eight specialists, each plays a role:"),
  bullet("Priya = scriptwriter (turns ideas into stories)"),
  bullet("Arnav = director (decides how it all fits together)"),
  bullet("Arjun = the coder (writes the backend logic)"),
  bullet("Sara = the designer (builds the user interface)"),
  bullet("Rohit = the database guy (designs how data is stored)"),
  bullet("Maya = the tester (finds bugs before users do)"),
  bullet("Raj = the editor (reviews everyone's work)"),
  bullet("Sneha = the security guard (makes sure nothing leaks)"),

  heading("The Studio — Where Everything Happens", HeadingLevel.HEADING_3),
  bullet("Front Door (Gateway): checks your ID badge before letting you in"),
  bullet("Main Stage (LangGraph): the script that says 'first Priya, then Arnav, then Arjun...'"),
  bullet("Storage Rooms (3 types of memory):"),
  bullet("Sticky notes on the desk (Redis) — what's happening right now", 1),
  bullet("Filing cabinet (PostgreSQL) — every decision ever made", 1),
  bullet("Library with smart search (Chroma) — 'have we built this before?'", 1),
  bullet("Loading Dock (RabbitMQ + Celery): workers picking up background tasks"),

  heading("How a Sprint Actually Flows", HeadingLevel.HEADING_3),
  p("You walk in with an idea. Priya turns it into a story. Arnav draws the blueprint. Arjun, Sara, and Rohit build it. Maya tests it. Sneha checks it's safe. Raj does the final review. You approve. Ship it."),
  p("Every step has a 'gate' — work can't move forward until someone (human or agent) signs off. No silent auto-merges.",
    { run: { italics: true, color: "595959" } }),

  divider(),

  // ─── PART 2: Tech Stack ───────────────────────────────────────────────────
  heading("Part 2 — Technology Stack", HeadingLevel.HEADING_2),
  table([
    ["Layer", "Technology"],
    ["Language", "Python 3.11+"],
    ["API Framework", "FastAPI (async)"],
    ["AI Models", "Anthropic Claude (Opus 4.7 / Sonnet 4.6 / Haiku 4.5)"],
    ["Orchestration", "LangGraph (state machine for sprint workflow)"],
    ["Primary Database", "PostgreSQL 16 + pgvector extension"],
    ["Cache", "Redis 7"],
    ["Message Queue", "RabbitMQ 3.13"],
    ["Background Workers", "Celery"],
    ["Vector Database", "Chroma (semantic memory)"],
    ["Object Storage", "MinIO (S3-compatible)"],
    ["Observability", "Langfuse + structlog"],
    ["Authentication", "JWT (RS256), bcrypt, RBAC"],
    ["Containers", "Docker"],
    ["Orchestrator (infra)", "Kubernetes (Helm charts)"],
    ["IaC", "Terraform"],
    ["Frontend", "Next.js (dashboard)"],
    ["Testing", "pytest, mypy, ruff"],
  ]),

  divider(),

  // ─── PART 3: High-Level Architecture ──────────────────────────────────────
  heading("Part 3 — High-Level Architecture", HeadingLevel.HEADING_2),
  p("All client requests flow top-to-bottom through these layers:"),
  code("┌────────────────────────────────────────────────────┐"),
  code("│  Client (Web Dashboard / REST API / CLI)           │"),
  code("└────────────────────┬───────────────────────────────┘"),
  code("                     │  JWT token"),
  code("┌────────────────────▼───────────────────────────────┐"),
  code("│  Gateway — FastAPI                                 │"),
  code("│   • Tenant middleware (JWT → tenant_id)            │"),
  code("│   • Rate limiting, auth, password reset            │"),
  code("└────────────────────┬───────────────────────────────┘"),
  code("                     │"),
  code("┌────────────────────▼───────────────────────────────┐"),
  code("│  Ingestion API — POST /api/v1/sprints/kickoff      │"),
  code("└────────────────────┬───────────────────────────────┘"),
  code("                     │"),
  code("┌────────────────────▼───────────────────────────────┐"),
  code("│  LangGraph Sprint Workflow (the brain)             │"),
  code("│   INTAKE → PLANNING → ARCHITECTURE →               │"),
  code("│   DEVELOPMENT → QA → SECURITY →                    │"),
  code("│   CODE REVIEW → DEPLOY → RETROSPECTIVE             │"),
  code("└──┬───────────┬───────────┬─────────────────────────┘"),
  code("   │           │           │"),
  code("┌──▼───┐  ┌────▼─────┐ ┌───▼──────┐"),
  code("│ 16   │  │ 3 Memory │ │ Services │"),
  code("│Agents│  │  Layers  │ │ (queue,  │"),
  code("│      │  │          │ │ audit,   │"),
  code("│      │  │          │ │ store)   │"),
  code("└──────┘  └──────────┘ └──────────┘"),

  divider(),

  // ─── PART 4: Memory Layers ────────────────────────────────────────────────
  heading("Part 4 — The 3 Memory Layers", HeadingLevel.HEADING_2),
  table([
    ["Layer", "Technology", "Purpose", "Retention"],
    ["Short-term", "Redis", "Active sprint state, agent task context", "24 hours"],
    ["Episodic", "PostgreSQL", "Immutable log of every agent decision", "Permanent (partitioned)"],
    ["Semantic", "Chroma (vectors)", "Past learnings, dedup, code reuse search", "Permanent"],
  ]),
  p("Each agent automatically queries memory before generating output. This was wired up in the recent memory upgrade — agents now recall relevant past sprints before starting a new task.",
    { run: { italics: true, color: "595959" } }),

  divider(),

  // ─── PART 5: Sprint Workflow ──────────────────────────────────────────────
  heading("Part 5 — Sprint Workflow (the LangGraph state machine)", HeadingLevel.HEADING_2),
  p("Each box is a gate. Work cannot move forward until that gate passes:"),
  code("INTAKE  ──►  PLANNING  ──►  ARCHITECTURE  ──►  DEVELOPMENT"),
  code("(Priya)      (Priya)        (Arnav)            (Arjun + Sara + Rohit)"),
  code("                                                    │"),
  code("                                                    ▼"),
  code("RETROSPECTIVE ◄── DEPLOY ◄── REVIEW ◄── SECURITY ◄── QA"),
  code("    (all)         (DevOps)   (Raj)     (Sneha)     (Maya)"),
  p("Production deploys have an interrupt_before flag — a human must approve before the workflow continues. No silent auto-deploys.",
    { run: { italics: true, color: "595959" } }),

  divider(),

  // ─── PART 6: Multi-Tenant Isolation ───────────────────────────────────────
  heading("Part 6 — Multi-Tenant Isolation (4 layers of defense)", HeadingLevel.HEADING_2),
  bullet("JWT middleware extracts tenant_id on every request"),
  bullet("Every database query filters by tenant_id in application code"),
  bullet("PostgreSQL Row-Level Security as backstop (planned, designed)"),
  bullet("Prompt cache prefix <tenant:X|agent:Y> prevents cross-tenant cache leakage (live)"),
  p("This was a critical finding from Sneha during the recent code review — fixed before merge.",
    { run: { italics: true, color: "595959" } }),

  divider(),

  // ─── PART 7: Recent Optimizations ─────────────────────────────────────────
  heading("Part 7 — Recent Token Optimization (Sprint completed May 16)", HeadingLevel.HEADING_2),
  p("Three optimizations that reduced cost per sprint from $4.50 to $0.40 (90% reduction):"),
  table([
    ["Story", "What changed", "Cost impact"],
    ["1. Prompt caching", "Anthropic ephemeral cache on system prompts with tenant_id prefix", "~50% reduction"],
    ["2. Static prefilter", "Ruff + radon + bandit run before code review agent", "~25% reduction"],
    ["3. Pydantic + tool use", "PRD generated via structured tool, not free-form JSON", "~15% reduction"],
  ]),
  p("All changes feature-flagged for safe rollback. 190 tests pass.",
    { run: { italics: true, color: "595959" } }),

  divider(),

  // ─── PART 8: Code Statistics ──────────────────────────────────────────────
  heading("Part 8 — Code Statistics", HeadingLevel.HEADING_2),
  table([
    ["Metric", "Value"],
    ["Python files", "106"],
    ["Agent implementations", "18"],
    ["LangGraph workflows", "3 (sprint, review, incident)"],
    ["Unit tests", "341"],
    ["Microservices", "5 (ingestion, audit, notification, task-queue, artifact-store)"],
    ["Database migrations", "4 (initial + users + token_version + password_reset)"],
    ["Git commits", "Active branch (main)"],
    ["Lines of Python", "~5,000 (orchestrator + gateway)"],
  ]),

  divider(),

  // ─── PART 9: Deployment Topology ──────────────────────────────────────────
  heading("Part 9 — Deployment Topology", HeadingLevel.HEADING_2),
  p("All services run as containers. Docker Compose for local dev; Kubernetes (Helm) for staging and production:"),
  bullet("PostgreSQL 16 + pgvector — port 5432"),
  bullet("Redis 7 — port 6379"),
  bullet("RabbitMQ 3.13 with management UI — ports 5672, 15672"),
  bullet("Chroma vector DB — port 8001"),
  bullet("MinIO S3 — port 9000"),
  bullet("Langfuse LLM observability — port 3001"),
  bullet("Gateway + Ingestion FastAPI — port 8000"),
  bullet("Dashboard (Next.js) — port 3000"),

  divider(),

  // ─── PART 10: What's Live, What's Next ────────────────────────────────────
  heading("Part 10 — Status: What's Live vs Next", HeadingLevel.HEADING_2),
  table([
    ["Component", "Status"],
    ["8 agent profiles (.claude/agents/) — lead-level", "LIVE"],
    ["18 agent implementations (orchestrator/agents/)", "LIVE"],
    ["LangGraph sprint workflow", "LIVE"],
    ["3-layer memory (Redis + PostgreSQL + Chroma)", "LIVE — wired into BaseAgent"],
    ["JWT auth + tenant middleware", "LIVE"],
    ["Password reset (with rate limiting)", "LIVE"],
    ["Prompt caching with tenant isolation", "LIVE (just shipped)"],
    ["Static linter prefilter (Story 2)", "LIVE (just shipped)"],
    ["Pydantic + tool use PRD path (Story 3)", "LIVE (feature-flagged)"],
    ["Tenant provisioning endpoint", "PLANNED (Phase 2)"],
    ["PostgreSQL Row-Level Security", "PLANNED (Phase 2)"],
    ["Durable LangGraph checkpointing", "PLANNED (Phase 2)"],
    ["Next.js dashboard", "EXISTS, not yet polished"],
    ["SOC2 Type 2 certification", "FUTURE — controls in place"],
  ]),
];

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "AI Workforce",
  title: "AI Multi-Agent Scrum Team — Architecture Overview",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: "2E75B6", font: "Calibri" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "404040", font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ],
    }],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 },
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, "architecture-overview.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote: ${outPath} (${buffer.length} bytes)`);
});
