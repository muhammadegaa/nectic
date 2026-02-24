# Nectic — Living Document

**Last updated:** February 2026

---

## 1. The Idea

**One-liner:** Finance teams spend 5+ hours/week recreating reports. Nectic lets them ask the question—"What's our burn rate?" "How much did we spend on software?"—and get the answer in 30 seconds. No SQL, no dashboards.

**Wedge:** Spend questions first. Burn rate, top expenses, category breakdown. FP&A spends 42% of time gathering data; we eliminate that.

**Not:** "AI for all data." **Not:** "Replace BI." **Yes:** Instant answers to finance questions.

---

## 2. Indonesia — Primary Market

### Why Indonesia First

- **64.2M MSMEs** — Largest segment; underserved by enterprise tools
- **25%** have adopted digital financial recording; rest use Excel/spreadsheets
- **70%** want support (finance, digital, HR) but don't receive it
- **Low accounting literacy** — "Ask a question" beats "build a dashboard"
- **Incumbent blind spot** — Meridian, Cube, Microsoft target enterprise. No one serves Indonesian MSME finance with chat-first answers.

### The Wedge (0 Competitors)

**"30-second finance answers for Indonesian MSMEs who use Excel and can't afford BI tools."**

- Fractional CFOs / accounting firms serving 10–50 MSME clients → one sell = many users
- Bahasa UI, IDR pricing
- Excel/CSV upload — no data warehouse, no connectors
- Sahabat-AI / local AI compliance if needed

### Funding (If Not YC)

Mandiri Capital, MDI Ventures, East Ventures, AC Ventures.

---

## 3. Validated Pain

- **42–46%** of FP&A time spent gathering data (Vena, FP&A Trends)
- **69%** spend 5+ hours/week recreating reports (insightsoftware)
- **89%** make decisions on inaccurate data (Pigment)
- **82%** use 4+ systems; integration is top barrier
- **Indonesia:** 25% digital finance adoption; 70% want support they don't get

---

## 4. Product

### MVP (Done)

- **Demo** — `/demo` works with zero config (OPENAI_API_KEY only). Embedded sample data. No Firebase.
- **Suggested prompts:** "What's our total spend on software?", "Top 5 expenses by category?", "What's our burn rate?"

### Next

1. **Excel/CSV upload** — Connect → chat. 10MB, 10K rows.
2. **2-step onboarding** — Connect data → Chat. Cut agent config.
3. **Citation** — Show which rows the answer came from.
4. **Bahasa UI** — For Indonesia launch.

### Cut for v1

Agent creation UI, OAuth, workflow builder, multiple LLM providers.

---

## 5. Competition & How to Win

| Competitor | Their model | Our edge |
|------------|-------------|----------|
| Meridian, Cube | Enterprise. Modeling. Implementation. | Answers only. Self-serve. Minutes. Indonesia MSME. |
| Microsoft Copilot | M365 bundle. Enterprise. | Standalone. Excel export. No M365. |
| ChatExcel | Consumer. 3.2M users. General. | Finance vertical. Indonesia. Spend questions. |

**Counterposition:** "Answers only." Incumbents can't add without cannibalizing. We target a wedge they ignore.

**Underserved:** 50–200 emp companies, fractional CFOs, Indonesia MSMEs, teams without data warehouse.

---

## 6. Traction Path

| Metric | Target | How |
|--------|--------|-----|
| Demo tries | 100+ | "Try now" on landing. Share. |
| Indonesia user interviews | 5 | Mekari/Shopee network. FP&A, finance managers, fractional CFOs. |
| LOIs | 2 | "Would you pay $X/month?" Get written yes. |
| Beta signups | 50+ | Waitlist. Indonesia-first. |

**Fastest:** Outbound to Indonesia finance leads. "Your team spends 5 hrs/week on reports. We do it in 30 seconds."

---

## 7. YC Application (If Applying)

**Problem:** FP&A spends 42% gathering data. 69% spend 5+ hrs/week on reports. 89% decide on bad data. Indonesia: 64M MSMEs, 25% digital finance, 70% want support they don't get.

**Solution:** Ask the question, get the answer in 30 seconds. Excel/CSV or database. No SQL, no BI.

**Why now:** LLMs query structured data. YC RFS: "Cursor for PM" — same pattern. Finance = operational discovery.

**Wedge:** Indonesia MSME first. Spend questions. Fractional CFO distribution. No incumbent there.

**Video (60s):** Intro → Problem (42%, 5 hrs/week) → Solution (ask, 30 sec) → Progress → Close.

**Tone:** Matter-of-fact. No marketing speak. First sentence = critical info.

---

## 8. Founder Note

No finance/FP&A domain experience. Compensate with: user interviews, LOIs, "Finance teams told us X." Leverage: AI product (5+ yrs), enterprise delivery (Mekari, Shopee), Indonesia network.

---

## 9. Ops

- **Local:** `npm run dev`. Demo: `OPENAI_API_KEY` only.
- **Prod:** Vercel. Env vars in Vercel.
- **Check before push:** `npm run check`
