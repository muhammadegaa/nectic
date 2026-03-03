# Nectic Product Breakdown — Senior PM View

**Date:** February 2026  
**Status:** Awaiting approval  
**Principle:** Validate first. Build only what users pay for.

---

## 1. Current State

| What exists | What's missing |
|-------------|----------------|
| Demo with sample data (zero config) | Real user data flow |
| Landing page (YC-grade, roast-fixed) | Excel/CSV upload |
| Full agent creation UI (4 tabs, many configs) | Connect → Chat flow |
| Firebase/Firestore backend | Citation (row-level) |

**Tension:** Strategy says "Connect → Chat." Codebase has "Create Agent → Configure → Chat." These are different products.

---

## 2. Strategic Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Simplify agent creation** | Keep agent model, strip to name + collections only | Reuses existing infra | Still "agent" mental model. Doesn't match NECTIC wedge. |
| **B. Connect → Chat (no agents)** | New flow: Upload Excel → Chat. No agent step. | Matches strategy. Simpler. | Requires new flow. Demo path diverges from agent path. |
| **C. Hybrid** | Demo = Connect → Chat. Agents = power users only, hidden. | Best of both | Two code paths. More to maintain. |

**Recommendation:** **B** for v1. NECTIC.md explicitly cuts agent creation. The wedge is "30-second answers," not "configure an AI agent."

---

## 3. Success Criteria (v1)

- User uploads Excel/CSV → sees their data in chat → asks "What's our burn rate?" → gets answer in 30 seconds
- No signup for demo. Signup only when "Connect your data" (persistent)
- Citation: user sees which rows the answer came from

---

## 4. Todo Breakdown (Phased)

### Phase 0 — Validation Gate (No code)

| # | Todo | Owner | Done |
|---|------|-------|------|
| 0.1 | 5 user interviews completed | You | |
| 0.2 | 1+ LOI ("Would you pay when we add Excel upload?") | You | |

**Gate:** Do not start Phase 1 until 0.1 + 0.2 are done.

---

### Phase 1 — Connect → Chat (Core v1)

| # | Todo | Scope | Deps |
|---|------|-------|------|
| 1.1 | Excel/CSV upload endpoint | Parse file, infer schema, store in temp collection (or in-memory for demo). 10MB, 10K rows max. | None |
| 1.2 | Upload UI | Single page: drag-drop or file picker → "Your data is ready. Ask a question." | 1.1 |
| 1.3 | Chat on uploaded data | Reuse demo chat API but swap sample data for user's uploaded data. Session-scoped. | 1.1 |
| 1.4 | Citation | In assistant response, show "Based on rows X–Y" or similar. | 1.3 |

**Outcome:** User can upload Excel → chat → get answer with citation. No agent creation.

---

### Phase 2 — De-scope / Hide Agent Creation

| # | Todo | Scope | Deps |
|---|------|-------|------|
| 2.1 | Hide agent creation from nav | Remove "Create Agent" from main nav. Keep route for existing users. | None |
| 2.2 | Demo CTA → Upload flow | "Try now" goes to upload page, not demo with sample data. Sample data = fallback if no upload. | 1.2 |
| 2.3 | Optional: Slim agent creation | If agent creation is needed for Firebase users, reduce to: Name + Connect data. 1 tab. | Phase 1 done |

---

### Phase 3 — Traction & Localization

| # | Todo | Scope | Deps |
|---|------|-------|------|
| 3.1 | Demo analytics | Track: uploads, questions asked, completion. Vercel Analytics or PostHog. | 1.2 |
| 3.2 | Bahasa UI | Landing, upload, chat. Indonesia-first. | Phase 1 done |
| 3.3 | IDR pricing | Simple monthly. | 2+ LOIs |

---

## 5. What We're NOT Doing (v1)

- Agent creation UI as primary path
- OAuth (Slack, etc.)
- Visual workflow builder
- Intent mappings
- Multi-LLM provider selection
- Database connection form (Firestore/Excel only)

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| Schema inference from Excel is wrong | Start with simple tables. Common columns: date, amount, category, vendor. |
| Users expect "persistent" data | v1 = session only. "Connect your data" (signup) = Phase 2. |
| Agent creation users break | Keep route. Hide from nav. Add banner: "New: Upload Excel and chat. No setup." |

---

## 7. Approval Checklist

Before I execute Phase 1:

- [ ] You approve Phase 1 scope (1.1–1.4)
- [ ] You confirm: Connect → Chat is the primary path (no agent creation for new users)
- [ ] You confirm: Validation gate (0.1, 0.2) is your responsibility; I proceed with build assuming it will be met

**Reply with:** "Approved" or specific changes. I will not execute until you approve.
