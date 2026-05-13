/**
 * Build director-pitch.docx from director-pitch.md content.
 * Run: node build-pitch-docx.js
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak,
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

function tableCell(text, bg, bold) {
  return new TableCell({
    borders: cellBorders,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR, color: "auto" } : undefined,
    width: { size: 3120, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: !!bold, size: 22 })],
      }),
    ],
  });
}

// ─── Document ────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: "AI Workforce Demo",
  title: "AI-Assisted SDLC Team — Director Pitch",
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
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "404040", font: "Calibri" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "ol",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
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
    children: [
      // ── Title ──
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "AI-Assisted SDLC Team — Director Pitch" })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Same team. Same tools. Same budget. 30–40% more throughput.",
          italics: true, color: "595959", size: 24,
        })],
        spacing: { after: 280 },
      }),
      divider(),

      // ── Problem ──
      heading("The Problem", HeadingLevel.HEADING_2),
      p("Our engineers spend 30–40% of every sprint on low-value work:"),
      bullet("Writing boilerplate code"),
      bullet("Drafting test cases"),
      bullet("Chasing requirement changes"),
      bullet("Reworking on stale context"),
      p("That's hours every day spent typing — not thinking.", { run: { bold: true } }),
      divider(),

      // ── Solution ──
      heading("The Solution", HeadingLevel.HEADING_2),
      p("AI agents do the work. Engineers review and decide.", { run: { bold: true } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "Jira Story  →  AI Agent builds  →  Human reviews  →  Merge",
          bold: true, color: "2E75B6", size: 24,
        })],
        spacing: { before: 120, after: 200 },
      }),
      p("Plus an impact-aware coordination layer (SyncIQ) that keeps everyone in sync when stories change mid-sprint."),
      divider(),

      // ── How It Works (Table) ──
      heading("How It Works End-to-End", HeadingLevel.HEADING_2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2080, 4000, 3280],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Stage", bold: true, color: "FFFFFF" })] })],
              }),
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 4000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "AI Agent Does", bold: true, color: "FFFFFF" })] })],
              }),
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 3280, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Human Does", bold: true, color: "FFFFFF" })] })],
              }),
            ],
          }),
          ...[
            ["Story drafting", "Generates ACs + edge cases", "PM reviews & approves"],
            ["Backend coding", "Writes API + unit tests", "Backend dev reviews PR"],
            ["Frontend coding", "Builds UI + validations", "Frontend dev reviews"],
            ["Database work", "Writes migrations", "SQL dev reviews"],
            ["QA testing", "Generates test cases", "QA reviews & runs"],
          ].map(([a, b, c], i) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 2080, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: a, bold: true })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 4000, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: b })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: c })] })],
                }),
              ],
            })
          ),
        ],
      }),
      p("Humans move from typing → reviewing. Higher-value work, faster delivery.", {
        run: { bold: true, italics: true }, para: { spacing: { before: 200, after: 200 } },
      }),
      divider(),

      // ── Magic ──
      heading("The Magic: Mid-Sprint Story Changes", HeadingLevel.HEADING_2),
      p("When PM changes a story mid-sprint, here's what happens automatically:"),
      new Paragraph({
        numbering: { reference: "ol", level: 0 },
        children: [new TextRun({ text: "AI detects the change (new AC, modified validation, etc.)" })],
      }),
      new Paragraph({
        numbering: { reference: "ol", level: 0 },
        children: [new TextRun({ text: "AI scans all already-built code, tests, and docs for impact" })],
      }),
      new Paragraph({
        numbering: { reference: "ol", level: 0 },
        children: [new TextRun({ text: "AI updates the affected files and opens a follow-up PR" })],
      }),
      new Paragraph({
        numbering: { reference: "ol", level: 0 },
        children: [new TextRun({ text: "Affected team members get one IDE/Slack ping" })],
      }),
      new Paragraph({
        numbering: { reference: "ol", level: 0 },
        children: [new TextRun({ text: "Human reviews, approves, merges" })],
      }),
      new Paragraph({
        children: [new TextRun({
          text: '   "Hey Arjun, story #142 changed. AI updated your /login endpoint. Please review the diff — 2 lines."',
          italics: true, color: "595959",
        })],
        spacing: { before: 160, after: 160 }, indent: { left: 720 },
      }),
      p("No standup. No Slack thread. No re-work from scratch.", { run: { bold: true } }),
      divider(),

      // ── What it is / is not ──
      heading("What It Is NOT", HeadingLevel.HEADING_2),
      bullet("Not replacing engineers"),
      bullet("Not tracking productivity"),
      bullet("Not silent auto-merges (humans always approve)"),
      bullet("Not noisy — max 3 pings per dev per day"),

      heading("What It IS", HeadingLevel.HEADING_2),
      bullet("AI builds first drafts, humans refine"),
      bullet("Mid-sprint changes auto-propagate to affected code"),
      bullet("Only relevant people get notified, in tools they already use"),
      bullet("Humans stay fully accountable"),
      divider(),

      // ── Numbers ──
      heading("The Numbers", HeadingLevel.HEADING_2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 2340, 2340],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 4680, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true, color: "FFFFFF" })] })],
              }),
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 2340, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Today", bold: true, color: "FFFFFF" })] })],
              }),
              new TableCell({
                borders: cellBorders, shading: { fill: "1F3864", type: ShadingType.CLEAR, color: "auto" },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                width: { size: 2340, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "With AI + SyncIQ", bold: true, color: "FFFFFF" })] })],
              }),
            ],
          }),
          ...[
            ["Engineer's day spent typing", "~60%", "~20%"],
            ["Engineer's day spent reviewing", "~40%", "~80%"],
            ["Coordination time per sprint", "12–22 hrs/dev", "2–4 hrs/dev"],
            ["Mid-sprint scope change rework", "1–3 days", "30 min review"],
            ["Sprint throughput", "Baseline", "+30–40%"],
            ["Defects caught late", "Common", "Rare"],
          ].map(([a, b, c], i) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: a })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: b })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  shading: { fill: i % 2 === 0 ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: c, bold: c.includes("+") })] })],
                }),
              ],
            })
          ),
        ],
      }),
      p(""),
      divider(),

      // ── Next Step ──
      heading("Next Step", HeadingLevel.HEADING_2),
      p("Want to see a 10-minute recorded demo of one AI agent in action?", { run: { bold: true } }),
      p(""),
      bullet("Built on a sample project — no real office data, no security risk"),
      bullet("Shows: story drafting → AI writes code → human reviews → mid-sprint change → AI updates affected code automatically"),
      bullet("Available as a recorded video — re-watchable, shareable"),
      bullet("No commitment, no budget ask — just a look at what's possible"),
      divider(),

      // ── Bottom Line ──
      heading("The Bottom Line", HeadingLevel.HEADING_2),
      new Paragraph({
        children: [new TextRun({
          text: "Same team. Same tools. Same budget.",
          bold: true, size: 26, color: "1F3864",
        })],
        spacing: { after: 80 },
        indent: { left: 360 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "AI handles the typing and the chasing.",
          size: 24, color: "404040",
        })],
        spacing: { after: 80 },
        indent: { left: 360 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Engineers focus on judgment, design, and review.",
          size: 24, color: "404040",
        })],
        spacing: { after: 160 },
        indent: { left: 360 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Result: 30–40% more throughput — without burning anyone out.",
          bold: true, size: 26, color: "2E75B6",
        })],
        spacing: { after: 320 },
        indent: { left: 360 },
      }),
      divider(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "Ready when you are. 🎯",
          bold: true, size: 28, color: "1F3864",
        })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "director-pitch.docx";
  fs.writeFileSync(out, buf);
  console.log(`✓ Wrote ${out} (${buf.length.toLocaleString()} bytes)`);
});
