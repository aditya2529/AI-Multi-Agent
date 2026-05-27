/**
 * Build simple-demo.docx — the simplest possible demo: build a TODO list
 * end-to-end with all 8 agents in under 10 minutes. Anyone can follow.
 * Run: NODE_PATH=<global> node build-simple-demo-docx.js
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, BorderStyle, WidthType,
  Table, TableRow, TableCell, ShadingType,
} = require("docx");

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
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text })],
    spacing: { after: 60 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 22, color: "264A6E" })],
    spacing: { after: 80 },
    shading: { type: ShadingType.SOLID, color: "F2F2F2" },
    indent: { left: 240, right: 240 },
  });
}
function callout(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "595959" })],
    spacing: { after: 120 },
    indent: { left: 360 },
  });
}
function divider() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 4 } },
    spacing: { before: 200, after: 200 },
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: opts.bold, color: opts.color, size: 20 })],
    })],
    borders: cellBorders,
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
  });
}
function table(rows) {
  return new Table({
    rows: rows.map((r, i) => new TableRow({
      children: r.map(c => cell(c, {
        bold: i === 0,
        shading: i === 0 ? "1F3864" : undefined,
        color: i === 0 ? "FFFFFF" : undefined,
      })),
    })),
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}
function agentBlock(emoji, name, role, prompt, expected) {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${emoji} ${name} — ${role}`, bold: true, size: 28, color: "1F3864" }),
      ],
      spacing: { before: 280, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Type this in Claude Code:", bold: true, size: 22 })],
      spacing: { after: 60 },
    }),
    code(prompt),
    new Paragraph({
      children: [new TextRun({ text: "What you should see:", bold: true, size: 22 })],
      spacing: { before: 80, after: 60 },
    }),
    callout(expected),
  ];
}

const children = [
  // ─── Title ────────────────────────────────────────────────────────────────
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "The Simple Demo: Build a TODO List in 10 Minutes" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "8 AI agents build a complete feature in front of your director. No jargon. No complexity. Just watch.",
      italics: true, color: "595959", size: 24,
    })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Print this. Carry it. Read line by line during the meeting.",
      bold: true, color: "C0392B", size: 22,
    })],
    spacing: { after: 280 },
  }),
  divider(),

  // ─── Part 1: What You're Showing ──────────────────────────────────────────
  heading("What You're Showing (30 seconds to explain)", HeadingLevel.HEADING_2),
  p("\"Sir, I'll build a TODO list feature live. From idea to working code. With 8 AI specialists working as a team. In about 10 minutes.\"", { run: { italics: true, size: 24 } }),
  p("\"Watch each agent do their bit. Then you tell me if this would help our developers.\"", { run: { italics: true, size: 24 } }),

  divider(),

  // ─── Part 2: Before the Demo ──────────────────────────────────────────────
  heading("Before the Demo (set up at your desk, 1 minute)", HeadingLevel.HEADING_2),
  bullet("Open VS Code"),
  bullet("Open the AI-Multi-Agent project folder"),
  bullet("Open Claude Code panel (View → Command Palette → 'Open Claude Code')"),
  bullet("Clear any old conversation (fresh start looks cleaner)"),
  p(""),
  p("That's it. You're ready.", { run: { bold: true } }),

  divider(),

  // ─── Part 3: The Demo Itself ──────────────────────────────────────────────
  heading("The Demo — 8 Steps, 1 Minute Each", HeadingLevel.HEADING_2),
  p("Type each prompt below in order. Read your director the 'What you should see' line BEFORE the agent responds, so they know what to look for."),

  ...agentBlock("📋", "Priya", "Product Manager",
    "@priya-pm Draft a story for adding a TODO list. Users should add, view, and delete tasks.",
    "A short user story with 3 acceptance criteria and a story point estimate. She'll probably ask 1-2 clarifying questions — that's good, it shows she pushes back."),

  ...agentBlock("🏗️", "Arnav", "Architect",
    "@arnav-architect Based on Priya's TODO story, design the API. REST or GraphQL?",
    "A short API design with POST /todos, GET /todos, DELETE /todos/:id. He'll show trade-offs (REST vs GraphQL) before recommending one."),

  ...agentBlock("🗄️", "Rohit", "Database Engineer",
    "@rohit-database Design the database table for the TODO feature. PostgreSQL.",
    "A schema with id, user_id, title, completed, created_at. He'll add indexes and explain why."),

  ...agentBlock("⚙️", "Arjun", "Backend Developer",
    "@arjun-backend Write the FastAPI endpoint for POST /todos using Rohit's schema.",
    "Real Python code. Pydantic models, type hints, error handling. He'll list what he built and what's missing."),

  ...agentBlock("🎨", "Sara", "Frontend Developer",
    "@sara-frontend Build the React component for adding a TODO. Use Tailwind.",
    "A React component with input, submit button, and a list. Loading and error states included."),

  ...agentBlock("🧪", "Maya", "QA Engineer",
    "@maya-qa Write unit tests for Arjun's TODO endpoint. Cover happy path + 2 edge cases.",
    "3 pytest tests: empty title rejected, valid input creates row, missing auth returns 401. She'll list what she tested and what's still risky."),

  ...agentBlock("🔒", "Sneha", "Security Engineer",
    "@sneha-security Audit the TODO feature. Check input validation, auth, OWASP top-10.",
    "Findings table: severity, file, issue, fix. She might flag XSS risk on title field. That's exactly what you want — proof she finds real issues."),

  ...agentBlock("✅", "Raj", "Code Reviewer",
    "@raj-reviewer Review the whole TODO feature. Score it 0-100.",
    "A structured review: verdict, score, findings table, strengths. Should score 75+ since everyone above did their job."),

  divider(),

  // ─── Part 4: The Closing Pitch ────────────────────────────────────────────
  heading("Your Closing Pitch (60 seconds)", HeadingLevel.HEADING_2),
  p("After Raj finishes, pause. Then say this — slowly:", { run: { bold: true } }),
  p(""),
  p("\"Sir, in 10 minutes, 8 AI specialists just built a working feature.\"", { run: { italics: true, size: 24 } }),
  p(""),
  p("\"In real life, this would take a developer 1-2 days. We just compressed it.\"", { run: { italics: true, size: 24 } }),
  p(""),
  p("\"Every agent's work is a draft. Real developers approve before anything ships.\"", { run: { italics: true, size: 24 } }),
  p(""),
  p("\"And the total cost of what you just saw? About 40 cents.\"", { run: { italics: true, size: 24, bold: true } }),
  p(""),
  p("\"Want me to run this for our actual Scrum team next week?\"", { run: { italics: true, size: 24, bold: true } }),

  divider(),

  // ─── Part 5: If Something Breaks ──────────────────────────────────────────
  heading("If Something Breaks (don't panic)", HeadingLevel.HEADING_2),
  table([
    ["Problem", "What to do"],
    ["An agent gives a weird response", "Skip it. Say 'AI isn't perfect — that's why every output is a draft a human reviews.' Move to next agent."],
    ["Claude Code is slow", "Keep talking — explain what's about to happen while it loads."],
    ["You can't remember the prompt", "Just point at this doc. Read the line out loud. No shame."],
    ["Director asks a hard question mid-demo", "Pause the demo. Say 'Great question — let me finish the build, then I'll address it.' Don't break the flow."],
    ["Internet drops", "\"This is exactly why we have on-prem deployment options — but let me show you the architecture instead.\""],
    ["Director seems bored", "Skip Sneha and Raj. Jump to closing pitch. Quality over quantity."],
  ]),

  divider(),

  // ─── Part 6: The Three Questions to Ask At The End ────────────────────────
  heading("3 Questions to Ask Your Director at the End", HeadingLevel.HEADING_2),
  bullet("\"What would you need to see to greenlight a pilot?\""),
  bullet("\"Which developer on our team should try this first?\""),
  bullet("\"Who else here should see this demo?\""),
  p(""),
  callout("These get you next steps. Don't end the meeting without asking at least one of them."),

  divider(),

  // ─── Footer ───────────────────────────────────────────────────────────────
  p(""),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: "Total demo time: 10 minutes. Total questions: 3. Total outcome: a decision.",
      italics: true, color: "595959", size: 22,
    })],
  }),
];

const doc = new Document({
  creator: "AI Workforce",
  title: "The Simple Demo",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: "2E75B6", font: "Calibri" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
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
  const outPath = path.join(__dirname, "simple-demo.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote: ${outPath} (${buffer.length} bytes)`);
});
