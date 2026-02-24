# Nectic Strategy 2026 — Living Document

**Goal:** Get funded by Y Combinator  
**Last updated:** February 2026

---

## 1. YC Alignment

### RFS Fit (Spring 2026)

- **Vertical AI** — Finance first; "instant reports from your data"
- **AI-native workflows** — "Ask your data" replaces "request a report"; systems change, not just automation
- **Cursor for PM** — Nectic helps product/business get data; Cursor helps engineers build

### What YC Looks For

- **Clear communication** — One sentence: "Upload Excel. Ask a question. Get the answer in 30 seconds."
- **Specific problem** — Finance teams wait days for reports; data in 47+ places; 81% cite data quality as #1 AI barrier
- **Traction** — Demo tries, beta users, LOIs; show momentum between application and interview

### Peers (W26)

- **Pollinate** — Supply chain; "$100k+ purchasing volume through automated workflows"
- **Jinba** — NL workflow; "40,000 enterprise users at major financial institutions"
- **Unisson** — AI SME agents for customer-facing teams

**Gap:** No sharp wedge, no traction, too much config, no instant demo.

---

## 2. Product Strategy

### One-Liner

> "Nectic turns your spreadsheets and finance data into a CFO you can chat with. Upload Excel or connect Firestore—ask 'What's our burn rate?' and get the answer in 30 seconds. No SQL, no dashboards."

### Changes (Priority)

| # | Change | Why |
|---|--------|-----|
| 1 | **Instant demo** — "Try now" on landing, no signup | Traction metric; 60-second wow |
| 2 | **Excel upload** — First-class; connect → chat | 74% use Excel; removes friction |
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

**Problem:** Finance and ops teams run on Excel and email. Getting a simple report takes days because data lives in 47+ places and nobody has time to build dashboards. 81% of enterprises say data quality/availability is their top AI barrier.

**Solution:** Nectic connects to your data (Excel, Firestore, PostgreSQL) and answers questions in natural language. Upload a spreadsheet or connect your DB—ask "What's our burn rate?" and get the answer in 30 seconds. No SQL, no BI tools, no IT ticket.

**Why now:** LLMs can reliably query structured data. Spreadsheets and legacy DBs haven't changed—but the interface has. "Ask your data" replaces "request a report."

**Traction:** [Fill with real numbers: X demo tries, Y beta users, Z LOIs. One quote from a user.]

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
