/**
 * Build human-ai-integration.docx — director-facing doc on how AI agents
 * integrate with the existing human team, including the notification plan.
 * Run: NODE_PATH=<global> node build-integration-flow-docx.js
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
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text })],
    spacing: { after: 60 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 18, color: "264A6E" })],
    spacing: { after: 40 },
    shading: { type: ShadingType.SOLID, color: "F2F2F2" },
    indent: { left: 240, right: 240 },
  });
}
function callout(text, color = "595959") {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color })],
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
  // ─── Title ────────────────────────────────────────────────────────────────
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "Human + AI Integration Plan" })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "How the 8 AI agents fit into the existing Scrum team — with frictionless notifications and impact-aware rejection",
      italics: true, color: "595959", size: 24,
    })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "AI Multi-Agent Scrum Team   |   Director Proposal   |   May 16, 2026",
      color: "808080", size: 20,
    })],
    spacing: { after: 280 },
  }),
  divider(),

  // ─── Part 1: Why This Matters ─────────────────────────────────────────────
  heading("Part 1 — Why Human-in-the-Loop Matters", HeadingLevel.HEADING_2),
  p("Concern from the director was clear: AI agents must augment, not replace, the existing team. Every AI output must be reviewed by the right human before it moves forward. The team must stay in control, comfortable, and not feel surveilled or sidelined."),
  p("This document explains:"),
  bullet("How each AI agent hands off to the right human reviewer"),
  bullet("How notifications work — without spamming or interrupting the team"),
  bullet("What happens when a human rejects an AI output — including automatic impact analysis"),
  bullet("Where we are today vs. what we need to build"),

  divider(),

  // ─── Part 2: The Workflow ─────────────────────────────────────────────────
  heading("Part 2 — The Integration Workflow", HeadingLevel.HEADING_2),
  p("Each AI agent is paired with a human counterpart. Work flows agent → human, never agent → production."),

  heading("Visual Flow", HeadingLevel.HEADING_3),
  code("Priya (AI PM)        ─►  Real Business Analyst  ─►  Approve / Reject"),
  code("                                                       │"),
  code("Arnav (AI Architect) ─►  Real Solution Architect ─►   Approve / Reject"),
  code("                                                       │"),
  code("Arjun (AI Backend)   ─►  Real Backend Developer  ─►   Approve / Reject"),
  code("Sara (AI Frontend)   ─►  Real Frontend Developer ─►   Approve / Reject"),
  code("Rohit (AI DBA)       ─►  Real Database Engineer  ─►   Approve / Reject"),
  code("                                                       │"),
  code("Maya (AI QA)         ─►  Real QA Lead            ─►   Approve / Reject"),
  code("Sneha (AI Security)  ─►  Real Security Engineer  ─►   Approve / Reject"),
  code("Raj (AI Reviewer)    ─►  Real Tech Lead          ─►   Approve / Reject"),

  heading("The 4 Rules", HeadingLevel.HEADING_3),
  bullet("Rule 1: Every AI output is a draft — never auto-applied"),
  bullet("Rule 2: Every draft notifies the right human counterpart — no manual routing"),
  bullet("Rule 3: Approve → next agent fires automatically (no human babysitting the chain)"),
  bullet("Rule 4: Reject → automatic impact analysis runs before the human writes a reason"),

  divider(),

  // ─── Part 3: Rejection Flow ───────────────────────────────────────────────
  heading("Part 3 — What Happens When a Human Rejects", HeadingLevel.HEADING_2),
  p("Rejection isn't just 'send back to AI.' It triggers an automatic chain to make the team's job easier:"),

  heading("Step-by-step", HeadingLevel.HEADING_3),
  p("1. Human clicks Reject (with optional reason)"),
  p("2. Impact analysis runs automatically:", { run: { bold: true } }),
  bullet("Which downstream agents have already started work on this artifact?", 1),
  bullet("Which artifacts depend on the rejected one?", 1),
  bullet("Estimated rework hours if we keep going vs. roll back?", 1),
  p("3. Notification sent to all affected agents and their human counterparts"),
  p("4. The originating agent gets the rejection reason and impact summary, regenerates"),
  p("5. New draft goes back through the same approval flow"),

  callout("Example: real BA rejects Priya's story. System auto-detects Arnav already started designing based on it. System pauses Arnav, notifies the Architect that the spec is changing, gives an estimated 2-hour rework. Architect knows to wait before continuing — no wasted work."),

  divider(),

  // ─── Part 4: Notification Design ──────────────────────────────────────────
  heading("Part 4 — Frictionless Notification Design", HeadingLevel.HEADING_2),
  p("Key principle: the team should never feel like they're being asked to babysit AI. Notifications must be lightweight, contextual, and actionable in one click."),

  heading("Primary channel: Slack", HeadingLevel.HEADING_3),
  p("One dedicated Slack channel per project (e.g., #proj-citi-ai-handoffs)."),
  p("Each agent posts a single message when its draft is ready:"),
  code("[Priya] Drafted story US-042: User Profile Edit"),
  code("Confidence: 8/10  |  Story Points: 5  |  Open Questions: 1"),
  code("[ View Draft ]  [ ✅ Approve ]  [ ❌ Reject ]  [ 💬 Comment ]"),
  p("The reviewer clicks one button. Done. No portal, no login, no tab-switching."),

  heading("Secondary channel: Email digest (optional)", HeadingLevel.HEADING_3),
  p("Managers get a daily 5-line summary:"),
  bullet("'Priya completed 3 stories. 2 approved, 1 awaiting BA review.'"),
  bullet("'Arjun delivered 2 PRs. Both approved by tech lead.'"),
  bullet("'Sneha flagged 1 security issue — under review.'"),
  callout("Designed to be readable in 15 seconds. Click any line for detail."),

  heading("Tertiary channel: VS Code inline (for active developers)", HeadingLevel.HEADING_3),
  p("If a developer is already in VS Code working on the repo, they see a small notification icon in the activity bar:"),
  bullet("'2 AI handoffs awaiting your review.'"),
  bullet("Click → review panel opens in the editor, no context switch"),

  heading("What we will NOT do", HeadingLevel.HEADING_3),
  bullet("No surveillance-style pings (no 'AI is faster than you' messages)"),
  bullet("No email per handoff (Slack is the primary signal)"),
  bullet("No requirement to use a new web portal"),
  bullet("No notifications outside working hours by default"),

  divider(),

  // ─── Part 5: Current State (Honest) ───────────────────────────────────────
  heading("Part 5 — Where We Are Today (Honest Gap Analysis)", HeadingLevel.HEADING_2),
  p("This is what works today vs. what we need to build:"),
  table([
    ["Capability", "Status", "Gap"],
    ["Agent prompts require human approval", "LIVE", "—"],
    ["Audit log of every agent decision", "LIVE", "—"],
    ["LangGraph workflow with phase gates", "LIVE", "Only 1 hard gate (production deploy)"],
    ["Slack notification per handoff", "NOT BUILT", "Need to build the bot + buttons"],
    ["Approve / Reject buttons in Slack", "NOT BUILT", "Need to wire to LangGraph state"],
    ["Reviewer auto-routing (who gets pinged)", "NOT BUILT", "Need reviewer config per agent"],
    ["Reject → impact analysis", "NOT BUILT", "Need dependency graph + estimator"],
    ["Email digest for managers", "NOT BUILT", "Need digest service + template"],
    ["VS Code inline notification", "NOT BUILT", "Need extension hook"],
  ]),

  callout("Honest assessment: the philosophy is built in. The plumbing is not. Building this is what makes the platform safe for real adoption.", "9C2A2A"),

  divider(),

  // ─── Part 6: Rollout Plan ─────────────────────────────────────────────────
  heading("Part 6 — Rollout Plan (3 Phases)", HeadingLevel.HEADING_2),

  heading("Phase 1 (Sprint 1-2): Slack Notifications", HeadingLevel.HEADING_3),
  bullet("Build the Slack bot that posts agent drafts"),
  bullet("Wire Approve / Reject buttons to LangGraph"),
  bullet("Configure reviewer mapping (who gets pinged for each agent)"),
  bullet("Outcome: humans control the team via Slack — no portal needed"),

  heading("Phase 2 (Sprint 3-4): Impact Analysis + Email Digest", HeadingLevel.HEADING_3),
  bullet("Build the dependency graph (which artifacts affect which)"),
  bullet("Build the rejection impact estimator"),
  bullet("Build the daily email digest for managers"),
  bullet("Outcome: rejection is informed — humans see ripple effects before deciding"),

  heading("Phase 3 (Sprint 5-6): VS Code Integration + Polish", HeadingLevel.HEADING_3),
  bullet("Build the VS Code inline review panel"),
  bullet("Add per-team notification preferences (frequency, channels, working hours)"),
  bullet("Add metrics dashboard: approval rate, rejection reasons, time-to-approval"),
  bullet("Outcome: every developer's workflow includes AI handoffs naturally"),

  divider(),

  // ─── Part 7: Risk Mitigation ──────────────────────────────────────────────
  heading("Part 7 — Risk Mitigation", HeadingLevel.HEADING_2),
  table([
    ["Risk", "Mitigation"],
    ["Team feels surveilled or replaced", "Notifications are agent-side, not human-side. We never message a human about another human's performance."],
    ["Notification fatigue", "Slack is primary, email is digest-only, working hours respected, per-user mute settings."],
    ["AI bypasses human review by accident", "LangGraph gates enforce approval at the workflow level — physically impossible to skip."],
    ["Human approves carelessly to clear the queue", "Approval requires comment if confidence < 70%. Audit trail shows who approved what."],
    ["Reviewer is on leave / unavailable", "Configurable backup reviewer per agent. Notification fails over after 4 hours."],
    ["Impact analysis is wrong or misleading", "Estimates clearly labeled as estimates. Human sees the dependency graph itself, not just the number."],
  ]),

  divider(),

  // ─── Part 8: Success Metrics ──────────────────────────────────────────────
  heading("Part 8 — How We Measure Success", HeadingLevel.HEADING_2),
  table([
    ["Metric", "Target"],
    ["Time from agent draft → human approval", "< 4 working hours (median)"],
    ["Approval rate (first attempt)", "> 75%"],
    ["Reject → rework time", "< 1 hour with impact analysis"],
    ["Notification fatigue score (team survey)", "> 4 / 5 ('not intrusive')"],
    ["Team adoption rate (devs using their AI agent)", "> 80% within 4 sprints"],
    ["Sprint throughput improvement", "+30% by Sprint 6"],
  ]),

  divider(),

  // ─── Part 9: Director Talk Track ──────────────────────────────────────────
  heading("Part 9 — How to Pitch This to the Director", HeadingLevel.HEADING_2),
  p("Use this exact sequence:"),
  p("\"Sir, you asked how this fits with the existing team. Here's the answer:\"", { run: { italics: true } }),
  p("1. Every AI output is a draft. Real humans approve.", { run: { italics: true } }),
  p("2. Notifications come through Slack — one click to approve or reject. No new portal.", { run: { italics: true } }),
  p("3. If a human rejects, we automatically tell them the impact — which other work is affected and how many hours of rework.", { run: { italics: true } }),
  p("4. We have a 3-phase rollout. Phase 1 is Slack notifications — 2 sprints to build. Low risk.", { run: { italics: true } }),
  p("5. Success metric: 75% first-time approval, < 4 hour turnaround, team rates it 4 out of 5 for 'not intrusive'.", { run: { italics: true } }),
  p(""),
  p("\"Want to greenlight Phase 1?\"", { run: { italics: true, bold: true } }),
];

const doc = new Document({
  creator: "AI Workforce",
  title: "Human + AI Integration Plan",
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
  const outPath = path.join(__dirname, "human-ai-integration.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote: ${outPath} (${buffer.length} bytes)`);
});
