/**
 * Build director-qa.docx — full Q&A document for the director meeting.
 * Run: NODE_PATH=<global> node build-qa-docx.js
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, Table, TableRow, TableCell, ShadingType,
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
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text })],
    spacing: { after: 80 },
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

// ─── Document ────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "AI Workforce Demo",
  title: "Director Q&A — AI Scrum Team",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "2E75B6", font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
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
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: [
      // ── Title ──
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Director Q&A — AI Scrum Team" })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Plain-English answers for executive review",
          italics: true, color: "595959", size: 24,
        })],
        spacing: { after: 280 },
      }),
      divider(),

      // ── Section: Your Questions ──
      heading("Section 1: Director-Facing Questions", HeadingLevel.HEADING_2),

      // Q1
      question(1, "What are my AI Agents? What kind of coding is in them?"),
      answer("Each agent is just a text file (.md) that tells Claude: \"Act like this person. Follow these rules.\""),
      answer("No traditional code. Just instructions in plain English. Like a job description for an AI."),
      answer("Example: Priya's file says \"You are a PM. Write short user stories. Always include 3 acceptance criteria.\""),

      // Q2
      question(2, "How do I explain this to my director?"),
      answer("Frame it as: \"I gave Claude 8 personalities — each pretending to be a different team role. They follow strict rules and produce work in their lane.\""),
      answer("They are not new technology — they are organized prompts that make AI behave like a coordinated team."),

      // Q3
      question(3, "What level of intelligence do they have?"),
      answer("Senior-level for their specific role. Not god-level.", { run: { bold: true } }),
      bullet("Priya writes stories better than a junior PM"),
      bullet("Arjun codes like a mid-senior backend dev"),
      bullet("Raj reviews like a strict tech lead"),
      bullet("They cannot replace a Principal Engineer or VP"),
      answer("Think: a team of 8 capable mid-senior engineers, not 8 geniuses."),

      // Q4
      question(4, "They work independently — how do they coordinate?"),
      answer("They don't talk to each other directly. You (the human) are the conductor.", { run: { bold: true } }),
      answer("You hand work from one to the next:"),
      answer("You → Priya → (review) → You → Arnav → (review) → You → Arjun", { run: { color: "2E75B6", italics: true } }),
      answer("They also flag dependencies to each other in their output (e.g., \"Arjun, Rohit needs to land users table first\") — but YOU read those flags and route the work."),

      // Q5
      question(5, "How does the human stay in the loop?"),
      answer("At every handoff, you decide:"),
      bullet("Approve → pass to the next agent"),
      bullet("Send back → ask for changes"),
      bullet("Stop → not the right direction"),
      answer("Just like a manager reviewing each team member's work before handing it off."),

      // Q6
      question(6, "How do agents interact with each other?"),
      answer("Indirectly, through artifacts:", { run: { bold: true } }),
      bullet("Priya produces a story → Arnav reads the story → designs the API"),
      bullet("Arnav produces an API spec → Arjun reads it → writes the code"),
      bullet("Arjun produces code → Maya reads it → writes tests"),
      answer("Think of it like a shared whiteboard. Everyone reads what's on it; nobody talks face-to-face."),

      // Q7
      question(7, "Can they generate a daily report for the Scrum Master?"),
      answer("Yes.", { run: { bold: true, color: "2E7D32" } }),
      answer("You can have a \"scrum-master\" agent that:"),
      bullet("Reads each agent's recent output"),
      bullet("Summarises what got done"),
      bullet("Flags what's blocked"),
      bullet("Drafts the standup talking points"),
      answer("Run it every morning. The Scrum Master walks into standup pre-briefed."),

      // Q8
      question(8, "What if a user suggests a change mid-sprint?"),
      answer("Three steps:"),
      bullet("Priya updates the story with the new requirement"),
      bullet("Each affected agent reads the change and reports what needs to update (Arjun: \"my API needs a new field\", Sara: \"UI needs a new input\")"),
      bullet("You approve the impact list → agents update only the affected code"),
      answer("No standup. No Slack chaos. Just smart routing.", { run: { italics: true } }),

      // Q9
      question(9, "Can the team take more tasks now that AI agents help?"),
      answer("Yes — realistically 30–40% more throughput. Why?", { run: { bold: true } }),
      bullet("Less time typing boilerplate"),
      bullet("Faster handoffs (no waiting for someone's email)"),
      bullet("Tests written automatically (devs don't skip them)"),
      bullet("Documentation updated continuously"),
      bullet("Mid-sprint changes don't blow up the sprint"),
      answer("Same team. More throughput.", { run: { bold: true, color: "2E75B6" } }),

      // Q10
      question(10, "What if a human rejects an AI change?"),
      answer("The change doesn't merge. Period.", { run: { bold: true } }),
      answer("But the impact is also handled:"),
      bullet("If Arjun's code depended on the rejected change → his code is rolled back / refactored"),
      bullet("If Maya's tests depended on it → tests are updated"),
      bullet("If Sara's UI used it → UI is reverted"),
      answer("The AI traces dependencies and tells you what else needs to change when you reject something."),

      divider(),

      // ── Section: Likely Follow-Up Questions ──
      heading("Section 2: Likely Follow-Up Questions From The Director", HeadingLevel.HEADING_2),

      question(11, "What if Claude is down?"),
      answer("Work pauses until Claude is back online. Same way a Jira outage halts work today. The agents are not critical infrastructure — they're a productivity layer."),

      question(12, "How much does this cost?"),
      answer("Zero extra cost. We are on the Claude Max plan already. The 8 agents use the existing subscription."),

      question(13, "Who owns the AI-generated code?"),
      answer("We do. Code generated under our paid account is our intellectual property. Anthropic does not retain or train on it."),

      question(14, "What about IP and data security?"),
      answer("Claude Max does not train on our data. Code, prompts, and conversations stay private. For enterprise use, we can move to Claude for Enterprise with stricter SOC 2 controls."),

      question(15, "Can it learn from our codebase?"),
      answer("Yes. The agents read the project's files on every run and adapt to our coding standards, naming conventions, and architecture patterns. No fine-tuning required."),

      question(16, "What if it makes a mistake?"),
      answer("Same as a junior developer making a mistake — the human reviewer catches it. That is the entire point of the human-in-the-loop design. AI drafts, humans approve."),

      question(17, "Is this a science project or production-ready?"),
      answer("Production-ready for augmenting a team. Not for replacing one. The agents accelerate experienced engineers — they do not replace the judgment, accountability, or stakeholder management humans provide."),

      question(18, "How do we scale this to more teams?"),
      answer("Just clone the agent files into any project. They are reusable across all teams. Each team can also customize the .md files to match their domain (e.g., a payments team would tweak Sneha to know PCI requirements)."),

      question(19, "How do we customize per project?"),
      answer("Edit the .md files to add our coding standards, naming conventions, tech-stack preferences, or compliance constraints. Takes 15 minutes per agent."),

      divider(),

      // ── Closing ──
      heading("Closing Thought", HeadingLevel.HEADING_2),
      new Paragraph({
        children: [new TextRun({
          text: "AI agents do not replace the team. They give every team member a personal assistant who handles the boring 40%. The team stays the same size — they just deliver more, with fewer meetings.",
          italics: true, size: 24, color: "1F3864",
        })],
        spacing: { before: 200, after: 280 },
        indent: { left: 360 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Same team. Same tools. Same budget. 30–40% more throughput.",
          bold: true, size: 26, color: "2E75B6",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "director-qa.docx";
  fs.writeFileSync(out, buf);
  console.log(`✓ Wrote ${out} (${buf.length.toLocaleString()} bytes)`);
});
