/**
 * Build director-slide.pptx — single executive slide from director-slide.md.
 * Run: NODE_PATH=<global> node build-slide-pptx.js
 */
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";          // 13.333" x 7.5" widescreen
pres.title = "AI-Assisted SDLC Team — Director Brief";
pres.author = "AI Workforce Demo";

// ─── Palette: Midnight Executive ─────────────────────────────────────────────
const NAVY     = "1E2761";
const NAVY_DK  = "131A47";
const ICE      = "CADCFC";
const ACCENT   = "F96167";   // coral for stat callouts
const TEXT     = "1A1A1A";
const MUTED    = "555555";
const WHITE    = "FFFFFF";

const slide = pres.addSlide();
slide.background = { color: WHITE };

// ─── Title block (top-left) ──────────────────────────────────────────────────
slide.addText("AI-Assisted SDLC Team", {
  x: 0.5, y: 0.35, w: 8.5, h: 0.7,
  fontFace: "Georgia", fontSize: 36, bold: true, color: NAVY,
  margin: 0,
});

slide.addText("AI builds. Engineers review. Throughput goes up.", {
  x: 0.5, y: 1.05, w: 8.5, h: 0.4,
  fontFace: "Calibri", fontSize: 18, italic: true, color: MUTED,
  margin: 0,
});

// ─── LEFT COLUMN — The shift ─────────────────────────────────────────────────

// Problem statement
slide.addText("THE PROBLEM", {
  x: 0.5, y: 1.7, w: 4.0, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});
slide.addText(
  "Engineers spend 30–40% of sprints on low-value work — typing boilerplate, chasing changes, reworking stale code.",
  {
    x: 0.5, y: 2.0, w: 6.0, h: 0.65,
    fontFace: "Calibri", fontSize: 13, color: TEXT,
  }
);

// The shift flow
slide.addText("THE SHIFT", {
  x: 0.5, y: 2.85, w: 4.0, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});

// Flow arrow boxes
const flowY = 3.2;
const flowH = 0.55;
const boxes = [
  { x: 0.5,  w: 1.5, text: "Jira Story",   fill: ICE,  fg: NAVY },
  { x: 2.15, w: 1.7, text: "AI Agent\nbuilds",   fill: NAVY, fg: WHITE },
  { x: 4.0,  w: 1.7, text: "Human\nreviews", fill: NAVY, fg: WHITE },
  { x: 5.85, w: 1.3, text: "Merge ✓",    fill: ICE,  fg: NAVY },
];
boxes.forEach((b) => {
  slide.addShape(pres.ShapeType.roundRect, {
    x: b.x, y: flowY, w: b.w, h: flowH,
    fill: { color: b.fill }, line: { color: b.fill }, rectRadius: 0.08,
  });
  slide.addText(b.text, {
    x: b.x, y: flowY, w: b.w, h: flowH,
    fontFace: "Calibri", fontSize: 12, bold: true, color: b.fg,
    align: "center", valign: "middle", margin: 0,
  });
});
// Arrows between boxes
[2.0, 3.85, 5.7].forEach((x) => {
  slide.addText("›", {
    x: x, y: flowY, w: 0.18, h: flowH,
    fontFace: "Calibri", fontSize: 22, bold: true, color: NAVY,
    align: "center", valign: "middle", margin: 0,
  });
});

// Agent list
slide.addText("Your AI agents:", {
  x: 0.5, y: 3.95, w: 6.0, h: 0.3,
  fontFace: "Calibri", fontSize: 11, bold: true, color: NAVY,
});
slide.addText(
  [
    { text: "PM/BA", options: { bold: true, color: NAVY } },
    { text: " drafts stories  •  ", options: { color: TEXT } },
    { text: "Backend", options: { bold: true, color: NAVY } },
    { text: " writes APIs + tests  •  ", options: { color: TEXT } },
    { text: "Frontend", options: { bold: true, color: NAVY } },
    { text: " builds UI", options: { color: TEXT } },
    { text: "\n", options: {} },
    { text: "SQL", options: { bold: true, color: NAVY } },
    { text: " writes migrations  •  ", options: { color: TEXT } },
    { text: "QA", options: { bold: true, color: NAVY } },
    { text: " generates test cases", options: { color: TEXT } },
  ],
  {
    x: 0.5, y: 4.25, w: 6.5, h: 0.7,
    fontFace: "Calibri", fontSize: 12, color: TEXT,
    paraSpaceAfter: 4,
  }
);

// Mid-sprint highlight box
slide.addShape(pres.ShapeType.roundRect, {
  x: 0.5, y: 5.1, w: 7.0, h: 1.45,
  fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.1,
});
slide.addText("MID-SPRINT CHANGES — HANDLED AUTOMATICALLY", {
  x: 0.7, y: 5.2, w: 6.6, h: 0.3,
  fontFace: "Calibri", fontSize: 11, bold: true, color: ICE, charSpacing: 2,
});
slide.addText(
  "Story changes → AI detects impact → updates affected code → opens follow-up PR → pings only affected devs → human reviews 2-line diff → merge ✓",
  {
    x: 0.7, y: 5.55, w: 6.6, h: 0.9,
    fontFace: "Calibri", fontSize: 12, color: WHITE,
  }
);

// ─── RIGHT COLUMN — Numbers + Ask ────────────────────────────────────────────

slide.addText("THE NUMBERS", {
  x: 8.0, y: 1.7, w: 4.8, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});

// Numbers table — simple, clean
const rows = [
  [
    { text: "Metric",          options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    { text: "Today",           options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" } },
    { text: "With AI",         options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" } },
  ],
  [
    { text: "Time typing",     options: { color: TEXT } },
    { text: "60%",             options: { color: TEXT, align: "center" } },
    { text: "20%",             options: { color: NAVY, align: "center", bold: true } },
  ],
  [
    { text: "Time deciding",   options: { color: TEXT, fill: { color: "F2F4FB" } } },
    { text: "40%",             options: { color: TEXT, align: "center", fill: { color: "F2F4FB" } } },
    { text: "80%",             options: { color: NAVY, align: "center", bold: true, fill: { color: "F2F4FB" } } },
  ],
  [
    { text: "Coordination",    options: { color: TEXT } },
    { text: "12–22 h",         options: { color: TEXT, align: "center" } },
    { text: "2–4 h",           options: { color: NAVY, align: "center", bold: true } },
  ],
  [
    { text: "Throughput",      options: { color: TEXT, bold: true, fill: { color: "F2F4FB" } } },
    { text: "Baseline",        options: { color: TEXT, align: "center", fill: { color: "F2F4FB" } } },
    { text: "+30–40%",         options: { color: ACCENT, align: "center", bold: true, fill: { color: "F2F4FB" } } },
  ],
];

slide.addTable(rows, {
  x: 8.0, y: 2.05, w: 4.8,
  colW: [2.2, 1.3, 1.3],
  rowH: 0.42,
  fontFace: "Calibri", fontSize: 12,
  border: { type: "solid", color: "D9D9D9", pt: 0.5 },
  margin: 0.08,
  valign: "middle",
});

// Big stat callout
slide.addShape(pres.ShapeType.roundRect, {
  x: 8.0, y: 4.6, w: 4.8, h: 1.0,
  fill: { color: ICE }, line: { color: ICE }, rectRadius: 0.1,
});
slide.addText("+30–40%", {
  x: 8.0, y: 4.65, w: 4.8, h: 0.55,
  fontFace: "Georgia", fontSize: 32, bold: true, color: NAVY,
  align: "center", valign: "middle", margin: 0,
});
slide.addText("sprint throughput uplift", {
  x: 8.0, y: 5.15, w: 4.8, h: 0.35,
  fontFace: "Calibri", fontSize: 12, italic: true, color: NAVY,
  align: "center", valign: "middle", margin: 0,
});

// Next Step
slide.addText("NEXT STEP", {
  x: 8.0, y: 5.8, w: 4.8, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});
slide.addText(
  [
    { text: "Want to see a 10-minute recorded demo?",
      options: { fontSize: 13, bold: true, color: NAVY } },
    { text: "\nOne AI agent · Sample project · No real office data",
      options: { fontSize: 11, color: MUTED, italic: true } },
  ],
  {
    x: 8.0, y: 6.1, w: 4.8, h: 0.7,
    fontFace: "Calibri",
    paraSpaceAfter: 2,
  }
);

// ─── Footer bottom — bottom line tagline ─────────────────────────────────────
slide.addText(
  [
    { text: "Same team. Same tools. Same budget. ", options: { color: MUTED } },
    { text: "AI handles the typing and the chasing.", options: { color: NAVY, bold: true } },
  ],
  {
    x: 0.5, y: 6.85, w: 12.3, h: 0.4,
    fontFace: "Calibri", fontSize: 12, italic: true, align: "center", margin: 0,
  }
);

// Write
pres.writeFile({ fileName: "director-slide.pptx" })
  .then((name) => console.log(`✓ Wrote ${name}`));
