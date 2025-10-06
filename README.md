# 🏛️ SmartEdify – Clean Architecture Platform, Multi-Agent & Living Documentation Iteration

Welcome to the root repository of **SmartEdify**, a SaaS solution for governance, management, and operation of smart communities built on clean architecture, automation, Zero Trust security, and human–AI collaboration principles.

---

## 📚 Repository Structure

```

/
├── README.md           # This file. Global vision and instructions.
├── GEMINI.md           # Directives and boundaries for the GEMINI agent (CTO/Architecture).
├── AGENTS.md           # Instructions for other AI agents or collaborative assistants.
├── QWEN.md             # Specific conventions for the QWEN agent.
├── CONTRIBUTING.md     # Mandatory guide for contributions and PRs.
├── onboarding_sesion.md# Quick onboarding instructions and checklist for new devs.
├── referencias/        # Specs, drafts, templates, and documentation in progress.
├── smartedify_app/     # Productive monorepo: source code, services, approved docs, infrastructure.
└── ... (other base files and technical folders)

```

---

## 🚀 Vision & Scope

- **Clean Architecture:** The productive monorepo (`/smartedify_app`) follows clean architecture principles—decoupling, automated testing, and controlled versioning.
- **Multi-Agent & Collaborative AI:** This repo enables simultaneous interaction by developers, architects, and AI assistants, each guided by its own operational manual (`GEMINI.md`, `AGENTS.md`, etc.).
- **Living Documentation & Governance:** All drafts, experiments, templates, and RFCs must be kept in `/referencias/` until formally promoted.
- **Automation & Observability:** CI/CD, contract validation, metrics, and change traceability are part of the design by default.

---

## 🏁 Getting Started / Onboarding

1. **Run the onboarding script (`onboarding.sh`)** if you are new, returning, or switching context.
2. **Read `onboarding_sesion.md`** for the initial checklist and FAQ.
3. **Review `GEMINI.md`, `AGENTS.md`, and `QWEN.md`** according to your agent/role.
4. **Check the `smartedify_app/` structure** for productive development and the `referencias/` directory for specs, templates, and docs in progress.

---

## 🗂️ Documentation & Contribution Policies

- **Any change to approved specs, product docs, or production code must go through a PR, review, and checklist compliance.**
- **Instructions for AI agents and assistants may only be updated via PRs reviewed by the architecture team.**
- **All documentation in progress, experiments, and drafts remain outside `/smartedify_app` until formally approved and promoted.**

---

## 🔗 Key Resources

- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution rules, PR checklist, and documentation requirements.
- [onboarding_sesion.md](./onboarding_sesion.md) — Quick integration guide and checklist.
- [referencias/README.md](./referencias/README.md) — Instructions for working with specs, drafts, and document promotion.
- [smartedify_app/README.md](./smartedify_app/README.md) — Detailed description of the productive monorepo and services architecture.

---

## 🤝 Human–AI Collaboration & Governance

- **Each agent/AI must follow its own directive file (GEMINI, QWEN, AGENTS, etc.).**
- **All contributions are audited, versioned, and subject to peer review.**
- **Compliance with these directives is part of the project’s Definition of Done (DoD).**

---

## 📢 Questions or Suggestions?

To propose changes to architecture, agent directives, or documentation processes, **open a Pull Request** and mention the architecture team.  
Your active participation is key to the continuous innovation, scalability, and quality of SmartEdify.