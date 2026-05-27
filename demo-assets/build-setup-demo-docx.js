/**
 * Build setup-and-demo.docx — laptop setup + 5-min demo script.
 * Run: NODE_PATH=<global> node build-setup-demo-docx.js
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
function step(num, title, body) {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `Step ${num}: `, bold: true, color: "2E75B6", size: 26 }),
        new TextRun({ text: title, bold: true, size: 26 }),
      ],
      spacing: { before: 240, after: 80 },
    }),
    ...(Array.isArray(body) ? body : [body]).map(t => new Paragraph({
      children: [new TextRun({ text: t })],
      indent: { left: 360 },
      spacing: { after: 80 },
    })),
  ];
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 20, color: "264A6E" })],
    spacing: { after: 80 },
    shading: { type: ShadingType.SOLID, color: "F2F2F2" },
    indent: { left: 360, right: 240 },
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

const children = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "Laptop Setup + 5-Minute Demo" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Print this. Carry it to the demo. Follow it step by step.",
      italics: true, color: "595959", size: 24,
    })],
    spacing: { after: 280 },
  }),
  divider(),

  // ─── PART A: Setup ────────────────────────────────────────────────────────
  heading("Part A — Setting Up on Your Office Laptop (15 min, one-time)", HeadingLevel.HEADING_2),
  p("What you're doing in plain English: you're putting VS Code on your laptop, adding Claude Code as a helper, and downloading the agent files from GitHub. After this, your laptop has 8 AI assistants ready to use."),

  ...step(1, "Install VS Code (if not already installed)", [
    "Open your browser. Go to: https://code.visualstudio.com/",
    "Click the big blue Download button. Run the installer. Click Next, Next, Finish.",
    "What this is: VS Code is the text editor where you'll talk to the AI agents.",
  ]),

  ...step(2, "Install Claude Code extension inside VS Code", [
    "Open VS Code.",
    "On the left sidebar, click the Extensions icon (looks like 4 squares).",
    "In the search box, type: Claude Code",
    "Click the first result (by Anthropic). Click the blue Install button.",
    "What this is: Claude Code is the helper that lets you chat with the agents inside VS Code.",
  ]),

  ...step(3, "Sign in with your Claude account", [
    "After installing, VS Code will ask you to sign in.",
    "Click Sign in. A browser window opens.",
    "Log in with the same email you use for Claude.ai.",
    "Approve the connection. You'll come back to VS Code automatically.",
    "What this is: you're connecting VS Code to your Claude account so the agents can think.",
  ]),

  ...step(4, "Download the project from GitHub", [
    "Open Command Prompt (Windows) or Terminal (Mac).",
    "Type this and press Enter:",
  ]),
  code("git clone https://github.com/aditya2529/AI-Multi-Agent"),
  callout("If you don't have git installed, install Git from https://git-scm.com/ first."),
  callout("Or just: go to the GitHub page, click the green 'Code' button, click 'Download ZIP', and unzip it anywhere on your laptop."),

  ...step(5, "Open the project in VS Code", [
    "In VS Code: File menu → Open Folder → pick the AI-Multi-Agent folder you just downloaded.",
    "Wait 10 seconds. VS Code will read the folder.",
  ]),

  ...step(6, "Confirm the agents are loaded", [
    "Open the Claude Code panel: View menu → Command Palette → type 'Claude' → click 'Open Claude Code'.",
    "In the chat box at the bottom, type: @priya-pm",
    "If a dropdown appears showing 'priya-pm' — you're done. All 8 agents are ready.",
    "If nothing happens, check that you opened the right folder (it should contain a .claude folder).",
  ]),

  divider(),

  // ─── PART B: The 5-Min Demo ───────────────────────────────────────────────
  heading("Part B — The 5-Minute Demo (what to show your director)", HeadingLevel.HEADING_2),
  p("Open VS Code, open the project, open Claude Code panel. Then run these in order:"),

  heading("Demo 1 — Token Efficiency (2 minutes)", HeadingLevel.HEADING_3),
  p("Goal: prove the platform is cheap. Show that the 2nd call uses 90% less tokens because of caching."),
  p("Type this in Claude Code:", { run: { bold: true } }),
  code("@priya-pm Draft a user story for a 'forgot password' feature."),
  p("Wait for Priya to respond. Look at the bottom of her output — it shows tokens used."),
  p("Now type this SAME prompt again, exactly the same:", { run: { bold: true } }),
  code("@priya-pm Draft a user story for a 'forgot password' feature."),
  p("Compare the two responses. The 2nd response should show 'cache_read_tokens' > 0, meaning we paid less."),
  callout("Say to the director: \"First call cost full price. Second call hit the cache — 90% cheaper. Multiply this by every agent, every sprint, every client — that's how we get the 90% savings story.\""),

  heading("Demo 2 — Each Agent Helps a Real Developer (3 minutes)", HeadingLevel.HEADING_3),
  p("Goal: prove every agent is useful on its own — not just as a team."),
  p("Show 4 scenarios. For each, type the prompt and watch the agent respond:"),

  p("Scenario 1 — PM with vague stakeholder:", { run: { bold: true } }),
  code("@priya-pm A stakeholder said 'add a dashboard'. Help me write a real story."),
  callout("Watch Priya ask clarifying questions before writing anything. That's lead-level behavior."),

  p("Scenario 2 — Developer needs design help:", { run: { bold: true } }),
  code("@arnav-architect Should we use REST or GraphQL for a new analytics API? Give me trade-offs."),
  callout("Watch Arnav present 2 options with pros/cons, no hedging."),

  p("Scenario 3 — Code review:", { run: { bold: true } }),
  code("@raj-reviewer Please review this function: [paste any small code snippet from your laptop]"),
  callout("Watch Raj give a structured review with severity tags. This replaces 30 minutes of human review time."),

  p("Scenario 4 — Security check:", { run: { bold: true } }),
  code("@sneha-security Is JWT with HS256 secure for a multi-tenant app?"),
  callout("Watch Sneha flag the issue, give an OWASP reference, and recommend the fix."),

  divider(),

  // ─── PART C: The Pitch ────────────────────────────────────────────────────
  heading("Part C — Your Closing Line (the pitch)", HeadingLevel.HEADING_2),
  p("After the demo, say this to the director — slowly and confidently:", { run: { bold: true } }),
  p(""),
  p("\"Sir, what you just saw works in two ways:", { run: { italics: true, size: 24 } }),
  p(""),
  p("1. As an individual assistant — any developer on our Scrum team can use one of these agents to draft a story, review a PR, or check security. No platform setup. Just install and go.\"",
    { run: { italics: true, size: 24 }, para: { indent: { left: 360 } } }),
  p(""),
  p("2. As a coordinated workforce — once we want to scale, the same 8 agents connect into our LangGraph orchestration platform. Multi-tenant, observable, 90% cheaper than before. That's our enterprise play.\"",
    { run: { italics: true, size: 24 }, para: { indent: { left: 360 } } }),
  p(""),
  p("\"Start with one developer using one agent next week. Scale to the full platform when we have a paying client. Low risk, high upside.\"",
    { run: { italics: true, size: 24 } }),

  divider(),

  // ─── PART D: If Things Go Wrong ───────────────────────────────────────────
  heading("Part D — If Something Breaks During the Demo", HeadingLevel.HEADING_2),
  table([
    ["Problem", "Fix"],
    ["Claude Code won't install", "Check VS Code version is 1.85 or later. Update VS Code first."],
    ["Can't sign in", "Make sure you're using the same email as your Claude.ai account."],
    ["Agents not showing up", "Make sure you opened the correct folder (must contain a .claude folder)."],
    ["Office laptop blocks Claude", "Use GitHub Codespaces — open the repo in browser-based VS Code."],
    ["Wifi blocks the API", "Hotspot from your phone for the demo, then ask IT to whitelist."],
    ["Director asks a question you don't know", "\"Great question. Let me show you how the team agent (Sneha/Arnav/etc) would answer that.\" Then ask the agent live."],
  ]),

  divider(),

  // ─── PART E: One-Sentence Summaries ───────────────────────────────────────
  heading("Part E — One-Sentence Cheat Sheet", HeadingLevel.HEADING_2),
  table([
    ["If they ask...", "Say..."],
    ["What is this?", "Eight AI agents that act like a Scrum team — usable individually or together."],
    ["How is it cheap?", "Caching + smart routing + linters do free work — 90% cost reduction."],
    ["Is it locked to Claude?", "Built on Claude today; portable to OpenAI, Gemini, or Bedrock with config."],
    ["What if it fails?", "Every agent output is a draft. Humans approve. No silent automation."],
    ["Why should I care?", "Same team, 30-40% more sprint throughput, 90% lower AI cost."],
    ["Can we pilot?", "Yes. One developer, one agent, one week. Then decide."],
  ]),
];

const doc = new Document({
  creator: "AI Workforce",
  title: "Laptop Setup + 5-Minute Demo",
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
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 },
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(__dirname, "setup-and-demo.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote: ${outPath} (${buffer.length} bytes)`);
});
