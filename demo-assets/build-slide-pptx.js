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

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Guard Rails (AI safety / prompt-injection defense)
// ════════════════════════════════════════════════════════════════════════════
const GREEN = "2E7D32";   // "LIVE" status tag
const AMBER = "B26A00";   // "DESIGNED" status tag

const s2 = pres.addSlide();
s2.background = { color: WHITE };

// Title block
s2.addText("Guard Rails — Built-In AI Safety", {
  x: 0.5, y: 0.35, w: 11.0, h: 0.7,
  fontFace: "Georgia", fontSize: 36, bold: true, color: NAVY, margin: 0,
});
s2.addText("Attacks blocked before they cost a token.", {
  x: 0.5, y: 1.05, w: 11.0, h: 0.4,
  fontFace: "Calibri", fontSize: 18, italic: true, color: MUTED, margin: 0,
});

// ─── LEFT COLUMN — the 7 layers ──────────────────────────────────────────────
s2.addText("THE 7 LAYERS", {
  x: 0.5, y: 1.7, w: 4.0, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});

const layers = [
  { n: "L1", name: "Input sanitizer",            desc: "strips hidden characters, fake tags, oversized payloads — no AI, $0", status: "LIVE" },
  { n: "L2", name: "Injection classifier",       desc: "Haiku scores every input; blocks attacks — pennies per check",       status: "LIVE" },
  { n: "L3", name: "Data-not-instructions wrap", desc: "agents treat customer text as data, never as orders",                status: "LIVE" },
  { n: "L4", name: "Output validation + canary", desc: "catches leaks in the AI's own output",                               status: "DESIGNED" },
  { n: "L5", name: "Memory sanitization",        desc: "cleans what agents recall from memory",                              status: "DESIGNED" },
  { n: "L6", name: "Agent-to-agent trust",       desc: "one hijacked agent can't infect the next",                          status: "DESIGNED" },
  { n: "L7", name: "Audit log + dashboard",      desc: "every block recorded per tenant — SOC2-ready",                       status: "LIVE" },
];

const rowY0 = 2.1;
const rowH2 = 0.62;
layers.forEach((L, i) => {
  const y = rowY0 + i * rowH2;
  const live = L.status === "LIVE";
  // number badge
  s2.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: y, w: 0.6, h: 0.5,
    fill: { color: live ? NAVY : ICE }, line: { color: live ? NAVY : ICE }, rectRadius: 0.06,
  });
  s2.addText(L.n, {
    x: 0.5, y: y, w: 0.6, h: 0.5,
    fontFace: "Calibri", fontSize: 14, bold: true, color: live ? WHITE : NAVY,
    align: "center", valign: "middle", margin: 0,
  });
  // name + one-line description
  s2.addText(
    [
      { text: L.name + "  ", options: { bold: true, color: NAVY, fontSize: 13 } },
      { text: L.desc, options: { color: MUTED, fontSize: 11 } },
    ],
    { x: 1.25, y: y, w: 5.4, h: 0.5, fontFace: "Calibri", valign: "middle", margin: 0 }
  );
  // status tag
  s2.addText(L.status, {
    x: 6.7, y: y, w: 1.0, h: 0.5,
    fontFace: "Calibri", fontSize: 10, bold: true, color: live ? GREEN : AMBER,
    align: "center", valign: "middle", margin: 0,
  });
});

// ─── RIGHT COLUMN — the proof ────────────────────────────────────────────────
s2.addText("THE PROOF", {
  x: 8.0, y: 1.7, w: 4.8, h: 0.3,
  fontFace: "Calibri", fontSize: 12, bold: true, color: ACCENT, charSpacing: 2,
});

// Big stat callout
s2.addShape(pres.ShapeType.roundRect, {
  x: 8.0, y: 2.1, w: 4.8, h: 1.15,
  fill: { color: ICE }, line: { color: ICE }, rectRadius: 0.1,
});
s2.addText("25 / 25", {
  x: 8.0, y: 2.15, w: 4.8, h: 0.65,
  fontFace: "Georgia", fontSize: 34, bold: true, color: NAVY,
  align: "center", valign: "middle", margin: 0,
});
s2.addText("fresh attacks blocked in security testing", {
  x: 8.0, y: 2.8, w: 4.8, h: 0.4,
  fontFace: "Calibri", fontSize: 12, italic: true, color: NAVY,
  align: "center", valign: "middle", margin: 0,
});

// Proof checklist
s2.addText(
  [
    { text: "✓ 4 of 7 layers live", options: { bold: true, color: NAVY } },
    { text: "  (3 more designed)\n", options: { color: MUTED } },
    { text: "✓ Raj code review: 96 / 100\n", options: { color: TEXT } },
    { text: "✓ Frozen 100-case attack benchmark\n", options: { color: TEXT } },
    { text: "✓ Every block logged per tenant", options: { color: TEXT } },
  ],
  { x: 8.05, y: 3.45, w: 4.75, h: 1.5, fontFace: "Calibri", fontSize: 13, lineSpacingMultiple: 1.35, margin: 0 }
);

// Why it matters box
s2.addShape(pres.ShapeType.roundRect, {
  x: 8.0, y: 5.1, w: 4.8, h: 1.45,
  fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.1,
});
s2.addText("WHY IT MATTERS", {
  x: 8.2, y: 5.2, w: 4.4, h: 0.3,
  fontFace: "Calibri", fontSize: 11, bold: true, color: ICE, charSpacing: 2,
});
s2.addText(
  "A malicious request is rejected before it ever reaches a paid model — so an attacker can't leak data, hijack an agent, or run up your bill.",
  { x: 8.2, y: 5.55, w: 4.4, h: 0.9, fontFace: "Calibri", fontSize: 12, color: WHITE, margin: 0 }
);

// ─── Footer tagline ──────────────────────────────────────────────────────────
s2.addText(
  [
    { text: "3 gates before a token is spent · 2 more before agents trust each other · ", options: { color: MUTED } },
    { text: "every attempt logged.", options: { color: NAVY, bold: true } },
  ],
  { x: 0.5, y: 6.85, w: 12.3, h: 0.4, fontFace: "Calibri", fontSize: 12, italic: true, align: "center", margin: 0 }
);

// Write
pres.writeFile({ fileName: "director-slide.pptx" })
  .then((name) => console.log(`✓ Wrote ${name} (2 slides)`));
