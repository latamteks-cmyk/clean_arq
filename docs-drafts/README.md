# 📄 docs-drafts/ — Living Drafts & Work-in-Progress Documentation

This directory contains **all draft documentation, work-in-progress technical specs, RFCs, requirements, templates, handoff context cards, and experiments** for the SmartEdify project.

**Nothing in this directory is considered “official” or “production-ready.”**  
Promotion to the main `/docs/` directory requires review, approval, and compliance with project conventions.

---

## 📁 Structure Overview

```

docs-drafts/
├── requirements/   # Business & functional requirements (per service/module or cross-service)
├── specs/          # Draft technical specs (per service or global)
├── rfc/            # Formal RFCs (Requests for Comments)
├── templates/      # Templates for specs, ADRs, context cards, checklists, etc.
├── handoffs/       # Context cards for session handoffs or technical transitions
├── experiments/    # Technical experiments, prototypes, or benchmarks
├── archive/        # Historical or deprecated drafts (not in active use)
└── README.md       # This file — usage, workflow, conventions

```

---

## 🚦 Rules & Workflow

### **1. Purpose**
- Use this directory to collaborate on all documentation that is **not yet official**.
- Here you can develop requirements, specs, propose architectural changes, experiment with new ideas, or work on drafts with multiple contributors (human or AI).

### **2. Naming Conventions**
- Use clear names and, if possible, **prefix files with the date** and context:
  - Example: `20251005-asset-service-async-draft.md`
  - For RFCs: `2024-10-rfc-multitenancy.md`
  - For requirements: `identity-requirements.md`, `tenancy-requirements.md`
- Indicate the draft status in the filename if relevant (`-draft`, `-wip`, `-proposal`).

### **3. Subfolders**
- Place drafts in the appropriate subfolder:
  - `requirements/`: **Business and functional requirements, user stories, and acceptance criteria** for any service/module or cross-service. All requirements must map to fixed data models; changes need an RFC.
  - `specs/`: Technical specs in progress (by service or global).
  - `rfc/`: RFCs (proposed major changes or design discussions).
  - `templates/`: Markdown templates for common docs (requirements, specs, ADRs, context cards, checklists).
  - `handoffs/`: Context cards for dev or technical handoffs.
  - `experiments/`: Technical experiments, proof-of-concepts, or benchmarks.
  - `archive/`: Outdated or superseded drafts.

### **4. Promotion to Official Documentation**
- **When a draft is ready to become official:**
  1. Open a Pull Request (PR) moving the file to `/smartedify_app/docs/` or the relevant location.
  2. Ensure it is reviewed and approved by the architecture/tech lead.
  3. Update cross-references and notify the team of the change.
  4. Remove or archive the original draft from `docs-drafts/`.

### **5. Periodic Clean-Up**
- The contents of this directory are subject to **regular review and clean-up**.
- Outdated drafts or superseded proposals should be moved to `/archive/` with a brief note.

---

## ✍️ Best Practices

- **Collaborate openly:** Drafts are for brainstorming, experimentation, and early alignment.
- **Comment liberally:** Use Markdown comments or tracked changes to explain decisions and gather feedback.
- **Keep it tidy:** Use subfolders and README files to keep drafts organized and easy to find.
- **Automate where possible:** Consider scripts for promoting, archiving, or linting draft files.

---

## 🤝 Contributing to Drafts

- Any contributor (human or AI) can propose, edit, or comment on drafts here.
- Always refer to `CONTRIBUTING.md` for guidelines on moving drafts to production.
- **Questions or suggestions?**  
  Open a discussion or contact the architecture team.

---

_This directory is the “sandbox” for ideas, designs, requirements, and innovation — help keep it organized and valuable!_
```

---

