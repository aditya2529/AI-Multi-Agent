# Run of Show — Director Demo (≈10 minutes)

**Goal:** show the AI Scrum Team working live, then prove it's safe. End with a clear ask.

---

## Pre-flight (do this Monday, not Tuesday morning)

- [ ] Office laptop: repo pulled (`git pull`), VS Code open, Claude Code **logged in**.
- [ ] **Smoke test** — ask one agent (e.g. Priya) a tiny task and confirm it responds. This proves the office firewall isn't blocking the API. **If it fails, you have a day to fix it.**
- [ ] Open and ready: `director-slide.pptx` (slide 1), `guard-rails-demo.md` (attack payloads to copy-paste), a terminal.
- [ ] Backup plan ready: the recorded demo video, in case the office network blocks the live API.

---

## Minute-by-minute

| Time | What you do | What you say |
|---|---|---|
| **0:00–1:30** | Slide 1 | "Same team, same budget — AI does the typing and the chasing, humans review. ~30–40% more throughput. 8 specialist agents: PM, architect, backend, frontend, DB, QA, reviewer, security." |
| **1:30–4:00** | **Live in VS Code:** give Priya one small story; show her draft it. Hand to one more agent. | "This is a real team, not autocomplete. Watch Priya turn a one-line ask into a proper story." *(Keep the story tiny so it's fast.)* |
| **4:00–5:00** | Switch to **Slide 2** | "Now the question you're about to ask: what stops this going rogue? We built guard rails." |
| **5:00–7:30** | **Live:** paste the **3 L1 attacks** from `guard-rails-demo.md`, one at a time. Each is rejected instantly. | "Hidden-instruction attack — blocked. Fake system tag — blocked. Encoded payload — blocked. All before it costs a single token." |
| **7:30–8:30** | Point at Slide 2 proof | "25 out of 25 fresh attacks blocked in testing. Reviewer scored it 96/100. 4 of 7 layers live, 3 more designed. Every block logged per customer — SOC2-ready." |
| **8:30–10:00** | Close + ask | "What would you need to see to make this a yes?" / "Who else should see this?" *(Keep `director-demo-qa.docx` open for tough questions.)* |

---

## Top 3 questions + one-line answers (full set in director-demo-qa.docx, Section J)

1. **"What stops it going rogue?"** → A 7-layer guard-rail system; 3 active gates before a token is ever spent.
2. **"Doesn't all that safety cost more / slow it down?"** → No — Layer 1 is free, the AI check is pennies, and blocked attacks never reach the expensive model. It *saves* money under attack.
3. **"Is one customer's data safe from another's?"** → Every check carries the customer ID, including the cache key. Blocks are logged per customer, and we store only a fingerprint of the input — never the raw text.

---

## Do NOT

- ❌ Attempt a first-time install/setup on stage. Everything must already work from Monday's smoke test.
- ❌ Quote an accuracy % you didn't actually run. The honest, verified numbers are 25/25 attacks blocked and Raj 96/100.
- ❌ Paste a real customer's data. Use the sample story only.

---

## If the office network blocks the live API

Don't panic or debug on stage. Say: *"Live environment's locked down here — let me show you the recorded run,"* switch to the video, and walk the two slides. The story still lands.
