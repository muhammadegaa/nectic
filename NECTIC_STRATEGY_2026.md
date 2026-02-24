# Nectic Strategy 2026 — Living Document

**Goal:** Get funded by Y Combinator  
**Last updated:** February 2026  
**Research:** See `RESEARCH_YC_2026.md` for validated pain points and competitive landscape.

---

## 1. YC Alignment

### RFS Fit (Spring 2026)

- **Cursor for PM** — Same pattern: upload data → ask question → get answer. PM = product discovery; Finance = operational discovery. "Cursor for FP&A."
- **Vertical AI** — Finance first. 42% of FP&A time spent gathering data; we eliminate that.
- **AI-native workflows** — "Ask" replaces "request a report"; systems change, not just automation.

### What YC Looks For

- **Clear communication** — One sentence: "Finance teams spend 5+ hours/week recreating reports. We let them ask the question and get the answer in 30 seconds."
- **Specific problem** — 82% use 4+ systems; 69% spend 5+ hrs/week on reports; 89% make decisions on bad data (insightsoftware, Pigment)
- **Traction** — Demo tries, LOIs; show momentum between application and interview

### Peers (W26)

- **Pollinate** — Supply chain; $100k+ automated purchasing volume
- **Jinba** — Chat-to-workflow; 40,000 users at financial institutions
- **Unisson** — AI product specialist for customer-facing teams

**Gap:** Need traction (demo tries + 1–2 LOIs) and sharper wedge (spend questions first).

---

## 2. Product Strategy

### One-Liner

> "Finance teams spend 5+ hours a week recreating reports. Nectic lets them ask the question—'What's our burn rate?' 'How much did we spend on software?'—and get the answer in 30 seconds. No SQL, no dashboards."

### Wedge (Sharp)

- **First question type:** Spend. Burn rate, top expenses, category breakdown. Validated, recurring pain.
- **Not:** "AI for all data." **Not:** "Replace BI." **Yes:** Eliminate the 42% of FP&A time spent gathering data.

### Changes (Priority)

| # | Change | Why |
|---|--------|-----|
| 1 | **Instant demo** — "Try now" on landing, no signup | Traction metric; 60-second wow |
| 2 | **Excel/CSV upload** — Connect → chat | 96% FP&A use Excel; removes friction |
| 3 | **2-step onboarding** — Connect data → Chat | Cut agent config; faster to value |
| 4 | **One default agent** — No config for v1 | Simplify story; power users in Settings |

### Cut for v1

- Agent creation UI
- Model/memory/tools config (smart defaults)
- OAuth, workflow builder
- Multiple LLM providers (OpenAI only)

---

## 3. Traction Playbook

### Targets (8–12 weeks before application)

| Metric | Target | How |
|--------|--------|-----|
| Demo tries | 100+ | "Try now" on landing; share |
| Beta signups | 50+ | Waitlist / early access |
| Paying / LOI | 3–5 | Outbound to finance teams (50–200 emp) |
| User interviews | 3–5 | "What would you pay?" |

### Fastest Path

1. Launch "Try Nectic" demo — No signup, sample Finance data, 3 suggested prompts
2. Post on HN, Twitter, LinkedIn
3. Outbound 20 finance leads — "Your team waits days for spend reports. We do it in 30 seconds."
4. Iterate — Fix what breaks; add what users ask for

---

## 4. Application Narrative

**Problem:** FP&A spends 42% of time gathering data and 25–40% on manual repetitive tasks (copy-paste, formatting, data chasing). 69% spend 5+ hours/week recreating reports. 89% make decisions on inaccurate or incomplete data. 82% use 4+ systems; integration is the top barrier.

**Solution:** Nectic lets finance teams ask the question and get the answer in 30 seconds. Connect your data (Excel, CSV, or database)—ask "What's our burn rate?" or "How much did we spend on software?"—no SQL, no BI setup, no IT ticket.

**Why now:** LLMs can reliably query structured data. YC RFS Spring 2026: "Cursor for PM" — same pattern. Finance = operational discovery.

**Traction:** [Fill with real numbers: X demo tries, Y signups, Z LOIs. One quote from a user.]

**Stage:** Validation. Using low-cost infra for POC. Building toward Excel upload and real connectors.

---

## 5. What to Do Next

### Phase 1: Sharp Demo (2–3 weeks)

1. Landing page revamp — New positioning, "Try now" CTA
2. Demo mode — No signup; pre-seeded Finance chat; 3 suggested prompts
3. Analytics — Track demo tries, signups
4. Simplify — Hide agent creation; single-agent default

### Phase 2: Excel Upload (2–3 weeks)

1. Excel/CSV upload — Parse, infer schema, temp collection
2. Connect → Chat flow — After upload, go straight to chat
3. Limit — 10MB, 10K rows

### Phase 3: Traction (4–6 weeks)

1. Launch — HN, Twitter, LinkedIn
2. Outbound — 20 finance leads, 5 demos, 2 LOIs
3. Iterate — Fix, add, validate pricing

### Phase 4: Application (1–2 weeks before deadline)

1. Update application with traction numbers
2. Prepare 60-second live demo
3. Practice "What do you do?" in one sentence

---

## 6. Indonesia (Supporting Context)

**Use for:** Market validation, expansion path, backup funding if not YC.

- **Pain validated:** 81% cite data silos; 74% Excel; 65M MSMEs
- **Funding backup:** Mandiri Capital, MDI Ventures, East Ventures, AC Ventures
- **Localization (post-YC):** Bahasa UI, Sahabat-AI, IDR pricing

---

## 7. Enhancements & Revamp (Concrete)

### Landing Page

| Current | Revamp |
|---------|--------|
| "Internal AI that never leaks" (generic) | "Turn your spreadsheets into a CFO you can chat with" (Finance wedge) |
| "Talk to us" (no link) | **"Try now"** → `/demo` (no signup) |
| "Get Started Free" → signup | Keep; add "Try now" as primary CTA above it |

**Files:** `src/components/hero-section.tsx`, `src/components/cta-section.tsx`

### Demo Mode (New)

- **Route:** `/demo` — Public, no auth
- **Flow:** Pre-seeded Finance chat; 3 suggested prompts ("What's our burn rate?", "Top 5 expenses?", "Total revenue?")
- **Backend:** New `/api/chat/demo` or extend chat API with `?demo=true` + fixed demo agent config; skip `requireAuth` for demo
- **CTA:** "Connect your own data" → signup

**New files:** `src/app/demo/page.tsx`, `src/app/api/chat/demo/route.ts` (or modify existing chat route)

### Agent Creation (Simplify)

| Current | Revamp |
|---------|--------|
| 9 tabs: Basic, Collections, Model, Memory, Tools, OAuth, Workflow, DB, Preview | **2 steps:** Connect data (Finance default) → Chat |
| User picks collections, model, memory, tools, OAuth, workflow | Auto-configure; one default agent per workspace |
| Preview tab inside agent creation | Move Preview to `/demo` for public; keep for logged-in users |

**Files:** `src/app/agents/new/page.tsx` — Collapse to minimal flow or hide behind "Advanced" for v1

### Excel Upload (New)

- **Flow:** Upload CSV/Excel → Parse → Infer schema → Create temp collection → Chat
- **Limit:** 10MB, 10K rows
- **Placement:** New step before or instead of "Connect Firestore" in onboarding

**New:** `src/components/ExcelUpload.tsx`, `src/app/api/upload/route.ts`, schema inference logic

### Chat UX (Enhance)

- **Suggested prompts:** Already exist in chat page; ensure Finance-focused ("What's our burn rate?", "Top expenses by category?")
- **Citation:** Show which table/row answer came from (builds trust)
- **Export:** "Download as CSV" for table answers

**Files:** `src/app/agents/[id]/chat/page.tsx`

### Cut / Hide for v1

- OAuth connections tab
- Workflow builder tab
- Tool marketplace (or reduce to 3 default tools)
- Model/memory config (use smart defaults)

---

## 8. Ops

**Local dev:** See `README.md`  
**Production:** Vercel; env vars in `.env.example`  
**Health check:** `https://nectic.vercel.app/api/health`
