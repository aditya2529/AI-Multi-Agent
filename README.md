# AI Multi-Agent Scrum Team

> **A reusable team of 8 named AI agents that work like a Scrum team.**
> Built for Claude Code (VS Code extension) using Anthropic Claude.

---

## 🎯 Who's On The Team?

| Agent | Role | When to Use |
|---|---|---|
| 🟣 **priya-pm** | Product Manager / BA | Draft user stories, ACs, edge cases |
| 🔵 **arnav-architect** | Solution Architect | System design, API contracts, DB schema |
| 🟢 **arjun-backend** | Backend Engineer | Python/FastAPI services, business logic |
| 🟡 **sara-frontend** | Frontend Engineer | React / Next.js UI, components, tests |
| 🟠 **rohit-database** | Database Engineer | PostgreSQL schema, migrations, indexes |
| 🔴 **maya-qa** | QA Engineer | Unit / integration / E2E tests |
| ⚫ **raj-reviewer** | Code Reviewer | PR reviews against SOLID, complexity |
| 🟪 **sneha-security** | Security Reviewer | OWASP, auth, compliance, threat modeling |

---

## 🚀 How To Use

### 1. Clone this repo into any project

```bash
git clone https://github.com/aditya2529/AI-Multi-Agent.git temp
mv temp/.claude /path/to/your/project/
rm -rf temp
```

### 2. Open the project in VS Code with Claude Code extension

The agents are auto-detected from `.claude/agents/`.

### 3. Invoke an agent

In the Claude Code chat or terminal, type:

```
Use priya-pm to draft a user story for [your feature]
```

Then continue the workflow:

```
Use arnav-architect to design the API for Priya's story
Use arjun-backend to implement Arnav's design
Use maya-qa to write tests
Use raj-reviewer to review the code
```

---

## 💡 Key Principles

1. **AI drafts, humans approve** — every agent produces a draft. Human review is required before merge.
2. **Brevity by default** — agents keep outputs lean (under 200-250 words) unless you ask for "enterprise" or "full audit" mode.
3. **Cross-team handoffs** — each agent flags open items and suggests the right teammate for follow-up.
4. **Parallel work** — Maya + Sara can run in parallel; backend + frontend in parallel once contract is set.
5. **Human in the loop** — Sneha defers auth/PII decisions to human security leads. Priya defers business calls to humans.

---

## 📂 Repo Structure

```
AI-Multi-Agent/
├── .claude/
│   └── agents/             ← The 8 AI teammates
│       ├── priya-pm.md
│       ├── arnav-architect.md
│       ├── arjun-backend.md
│       ├── sara-frontend.md
│       ├── rohit-database.md
│       ├── maya-qa.md
│       ├── raj-reviewer.md
│       └── sneha-security.md
├── demo-assets/            ← Director pitch + demo evidence
│   ├── director-pitch.docx
│   ├── director-pitch.md
│   ├── director-slide.pptx
│   ├── director-slide.pdf
│   ├── director-slide.md
│   └── demo-evidence.md
└── README.md
```

---

## 🎬 What This Is For

This is a **coordination framework**, not a code-generation hack.

The pitch: **AI agents do the typing and the chasing. Humans focus on judgment, design, and review. Same team. Same tools. 30–40% more sprint throughput.**

See `demo-assets/director-pitch.md` for the full one-pager.

---

## 📜 License

Personal use. Customize the agent prompts for your own team's style and constraints.

---

**Built by:** Aditya Kumar · 2026
