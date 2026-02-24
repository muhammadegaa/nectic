# Research: Winning YC 2026 — Nectic

**Purpose:** Ground the idea in real data. No random assumptions. Entrepreneur-grade research.

---

## 1. The Real Pain (Validated)

### FP&A Time Allocation
- **25%** on value-added analysis (what they're hired for)
- **42–46%** gathering data and validation
- **33%** administering processes
- **25–40%** weekly on repetitive manual tasks (copy-paste, formatting, data chasing)
- **61%** of finance leaders cite inadequate systems as most pressing problem
- **2%** of organizations consider FP&A optimized

*Sources: Vena Solutions, FP&A Trends 2025, McKinsey*

### Data Fragmentation
- **93%** of finance teams use multiple tools
- **82%** use 4+ separate systems
- **82%** say poor data integration is biggest obstacle to reporting, forecasting, compliance
- **89%** make monthly decisions on inaccurate or incomplete data
- **1 in 4** rely on gut instinct alone

*Sources: insightsoftware 2024–2026, Pigment CFO Report 2024*

### Manual Reporting Burden
- **79%** of finance leaders say teams are "swamped" with manual work
- **69%** spend 5+ hours/week recreating reports
- **58%** spend 5+ hours/week transferring data between systems
- **39%** of finance time on manual automatable tasks (SMBs: 45–55%)

*Sources: Zuora/CFO.com, Forwardly, Compass AI 2025*

### Ad Hoc Requests
- Board questions, cost variance investigation, reforecasting mid-month
- "How much did we spend?" — common, recurring
- With self-service tools: hours. Without: days to weeks
- Standard reports don't cover these; teams need custom slices

*Sources: Farseer, Go LimeLight, Workday FP&A Survey*

---

## 2. Why "Ask Your Data" Failed Before (NL2SQL)

- **Semantic ambiguity:** Correct SQL, wrong answer. "Sales in Europe" — which dataset? Which year?
- **Schema mapping:** "Commit date" = "break date" in one system. Enterprise synonyms kill generic tools.
- **Implementation cost:** Gartner 2021 — mapping data to keywords too expensive
- **Demos vs production:** Impressive demos, broken in real schemas

**Lesson:** Narrow wedge. One vertical (finance). One question type first (spend/expense). Known schema patterns. Don't claim "any data."

*Sources: Yellowfin BI, HyperArc, DevRev*

---

## 3. YC RFS Spring 2026 — Direct Fit

### Cursor for Product Managers (Andrew Miklas)
> "Imagine a tool where you upload customer interviews and product usage data, ask 'what should we build next?', and get the outline of a new feature... We think there's an opportunity to build a 'Cursor for product management': an AI-native system focused on helping teams figure out what to build."

**Nectic parallel:** Same pattern. Upload data → ask question → get answer. PM = product discovery. Finance = operational discovery. "Cursor for Finance" or "Cursor for FP&A."

### Other RFS (Relevant)
- **AI-Native Hedge Funds** — Finance vertical is hot
- **AI-Native Agencies** — Software margins, AI doing the work

---

## 4. YC W26 Peers — What Got Funded

| Company | Wedge | Traction |
|---------|-------|----------|
| **Pollinate** | Supply chain. Three-way invoice matching. ERP automation. | $100k+ automated purchasing volume |
| **Jinba** | Chat-to-workflow. No engineers. Enterprise permissions. | 40,000+ users at major financial institutions |
| **Unisson** | AI product specialist for customer-facing teams. Learn any product in 15 min. | Implementation, CS, sales eng |

**Pattern:** Specific wedge. Traction (volume or users). Not "we're building AI for data."

**Nectic gap:** Pollinate has $100k volume. Jinba has 40k users. Nectic needs: demo tries, signups, or 1–2 LOIs before interview.

---

## 5. YC Funding Reality

- **40%** of funded companies have no revenue at acceptance
- **Rejection often has no reason** — median app is "pretty good." Others were "particularly stellar." You need to be top tier.
- **Progress between application and interview** — Launch, improve product, get users. YC wants to see you move.
- **Clear explanation** — Jargon-free. Matter-of-fact. First sentence = critical info.
- **Honest about obstacles** — Disclose flaws. Show you've thought about them.

*Sources: YC FAQ, YC whynot.html, YC howtoapply*

---

## 6. Competitors — Funded & Active

| Company | What | Funding/Traction |
|---------|------|-------------------|
| **Meridian** | Agentic financial modeling. Deterministic. Excel/Sheets. | $17M seed (Feb 2026), $5M contracts |
| **sieve** (YC S25) | Data cleaning for hedge funds. API. Replaces manual review. | Citadel/McKinsey founders |
| **Serafis** (YC S25) | AI knowledge graph for institutional investors. Unstructured data. | 12 orgs, $70B AUM |
| **Ask-AI** | Enterprise data silos. 50+ systems. Generative sidekick. | $11M Series A, $20M total |
| **Askdata** (YC W19) | Natural language to data. | Acqui-hired |
| **ChatExcel** | Upload Excel/CSV, ask questions. | 3.2M users |
| **Cube** | FP&A agentic AI. Purpose-built. | Established |

**Nectic differentiation:** Not modeling (Meridian). Not data cleaning (sieve). Not knowledge graph (Serafis). Not workflow automation (Jinba). **Ad hoc answers.** "How much did we spend on X?" — instant. That's the wedge.

---

## 7. SMB Finance Buying (50–200 Employees)

- **70%** use QuickBooks/Xero; **18%** financial management suites
- **88%** satisfied with current accounting tools — not replacing them
- **49%** of CFOs cite data quality blocking critical decisions
- **Pain:** Integration. Data quality. Getting answers from what they have. Not "new accounting software."

**Implication:** Don't sell "replace QuickBooks." Sell "get answers from your existing data in 30 seconds instead of 5 hours."

---

## 8. The Wedge (Sharp)

**Not:** "AI for all your data"  
**Not:** "Replace BI"  
**Not:** "Replace Excel"

**Yes:** FP&A spends 42% of time gathering data. What if they could just ask?

**One-liner:** "Finance teams spend 5+ hours a week recreating reports. We let them ask the question and get the answer in 30 seconds."

**First question type:** Spend. "How much did we spend on software?" "What's our burn rate?" "Top 5 expenses by category?" — validated, recurring, painful.

---

## 9. Traction Path (Fastest)

| Metric | Target | How |
|--------|--------|-----|
| Demo tries | 100+ | "Try now" on landing. Share. Track. |
| Outbound demos | 5 | 20 finance leads (50–200 emp). "Your team spends 5 hrs/week on reports. We do it in 30 seconds." |
| LOIs | 2 | From demos. "Would you pay $X/month?" Get written yes. |
| User interviews | 5 | "What would you pay? What breaks?" |

**Between application and interview:** Ship something. Get 1 LOI. Update application. Show momentum.

---

## 10. What to Cut from Narrative

- **Firestore** — POC infra. Not the product. Don't mention in YC app.
- **"47+ places"** — Unverifiable. Use "4+ systems" (82% stat).
- **"Enterprise ready"** — You're validating. Be honest.
- **"Upload Excel"** — Only if built. Otherwise: "Connect your data" (CSV, spreadsheets, DBs — generic until you ship Excel).

---

## 11. Founder-Market Fit Signal

YC S25 finance companies:
- **sieve:** Nicole Lu (Citadel, McKinsey), Savannah (Bain)
- **Serafis:** Institutional investor focus

**Question:** Do you have finance/FP&A domain experience? Or distribution? Or both? If not, user interviews and LOIs become critical proof.

---

## 12. Summary: What Wins

1. **Sharp wedge** — Spend questions. Finance. 42% time gathering data.
2. **Validated pain** — 5+ hrs/week on reports. 89% decisions on bad data.
3. **Traction** — Demo tries + 1–2 LOIs before interview.
4. **Clear story** — Matter-of-fact. No marketing speak.
5. **Progress** — Ship between application and interview.
6. **Honest** — POC stage. Firestore = validation infra. Building toward Excel/real connectors.

---

## 13. Competitive Reality: Challenges & How to Win

Many similar solutions exist. Some are 10X better funded and AI-first. Here’s how to compete.

### The Competition (Strong)

| Competitor | Strength | Weakness / Gap |
|------------|----------|----------------|
| **Meridian** | $17M, $5M contracts, a16z. Agentic modeling. Goldman/KKR team. Deterministic. | Modeling focus. Enterprise. Weeks to value. |
| **Microsoft Copilot Finance** | Built into M365/Excel. Huge distribution. Variance analysis, reconciliation. | Enterprise-first. Requires M365. Complex setup. |
| **ChatExcel** | 3.2M users. Upload, ask. | Weak on complex calcs, large datasets. Limited viz. Paid for full access. Consumer/small biz. |
| **Cube** | FP&A platform. Agentic AI. Established. | Enterprise pricing. Implementation. Platform, not "just ask." |
| **ChatFin** | Finance-specific. ERP/CRM/HRIS connectors. Understands EBITDA, deferred revenue. | Enterprise. Connector setup. |
| **Index** | Sub-second queries. Minutes setup. Pre-built SaaS metrics. | Snowflake/BigQuery. Data warehouse required. |
| **Jinba** (YC W26) | 40k users. Chat-to-workflow. Financial institutions. | Workflow creation, not data answers. |

### Challenges for Nectic

| Challenge | Why It Hurts |
|-----------|--------------|
| **Incumbent distribution** | Microsoft has Excel. Copilot Finance is built-in. Hard to displace. |
| **Funding gap** | Meridian $17M, $5M contracts. Nectic bootstrapped. Can't outspend. |
| **Feature gap** | Meridian does modeling. ChatExcel has scale. Cube has FP&A depth. |
| **Team credibility** | Meridian: Goldman/KKR. sieve: Citadel/McKinsey. Domain credibility matters. |
| **Data connectors** | ChatFin, Cube have ERP connectors. Nectic has POC infra. |
| **Determinism** | Finance needs reproducible answers. Meridian solved it. Nectic? |

### How to Address Each Challenge

| Challenge | Address |
|-----------|--------|
| **Incumbent distribution** | Don't fight Microsoft head-on. Target companies that don't have M365 Copilot (SMB, cost-sensitive). Or teams that want "answers only" without full M365 rollout. |
| **Funding gap** | Compete on speed and focus, not features. Ship in days. One wedge. Incumbents move slowly. |
| **Feature gap** | Don't match features. Do one thing better: **instant answers to spend questions**. No modeling. No dashboards. No setup. "Just ask." |
| **Team credibility** | Compensate with user proof. 5 interviews. 2 LOIs. "Finance teams told us X." Domain expertise from users, not just founders. |
| **Data connectors** | Start with CSV/Excel upload. No connector needed. User uploads export from QuickBooks/Xero. Fastest path to value. Add connectors later. |
| **Determinism** | Cite sources. Show which rows/tables. "Answer came from transactions table, rows 12–47." Build trust through transparency. |

### How to Win: Counterpositioning

**Counterpositioning** = Adopt a business model incumbents can't copy without hurting their core business.

| Incumbent | Their model | Nectic counterposition |
|-----------|-------------|-------------------------|
| **Meridian** | Modeling platform. Enterprise sales. $5M contracts. | Answers only. No modeling. Self-serve. $X/month. Can't add "instant, no-setup answers" without cannibalizing implementation revenue. |
| **Cube** | FP&A platform. Dashboards. Implementation. | No platform. No dashboards. Upload → ask. Minutes, not weeks. |
| **Microsoft** | M365 bundle. Enterprise. | Standalone. Works with Excel export. No M365 required. SMB that can't afford full stack. |
| **ChatExcel** | Consumer/small. 3.2M users. General spreadsheet. | Finance vertical. Spend questions. "How much did we spend?" — purpose-built. Better accuracy for finance schemas. |

### Underserved Niche (Enter Here)

**Who incumbents ignore:**

- **50–200 employee companies** — Too small for Cube/Meridian enterprise sales. Too complex for ChatExcel consumer.
- **Fractional CFOs / accounting firms** — Serve 10–50 SMB clients. One tool = many end users. Incumbents sell per-company.
- **Finance teams without data warehouse** — Index needs Snowflake/BigQuery. Many SMBs have QuickBooks + Excel. No warehouse.
- **"Just need an answer"** — Don't want modeling (Meridian), platform (Cube), or workflow (Jinba). Want: ask → answer. Done.

### Winning Strategy (Summary)

1. **Narrow wedge** — Spend questions. 50–200 emp. No modeling, no platform, no connectors (start with upload).
2. **Time to value** — Upload CSV → ask. Minutes. Enterprise tools: weeks.
3. **Counterposition** — "Answers only." Self-serve. Incumbents can't easily add without cannibalizing.
4. **Distribution** — Fractional CFOs, accounting firms. One sell = many clients.
5. **Proof over credentials** — LOIs, interviews. "Finance teams told us they'd pay."
6. **Citations** — Show source data. Build trust. Address determinism concern.
