# Nectic — Lean Startup Audit

**Date:** February 2026  
**Team size assumed:** 2–5 people, wearing multiple hats  
**Purpose:** Hard honest assessment. Worth pursuing or not?

---

## TL;DR Verdict

| Question | Answer |
|----------|--------|
| On the right track? | **Partially.** Pain is real. Solution is too generic. |
| Worth investing in? | **Not yet.** No LOIs. No interviews. No differentiation. |
| Worth pursuing? | **Conditionally yes** — if and only if you find a wedge ChatGPT can't own. |
| Pre-validated idea? | **No.** Stats are from vendor surveys. Zero user interviews done. |
| Frontier AI risk? | **Critical.** Microsoft, Google, ChatGPT already do this today. |
| Can you do 10X better? | **Not on the current framing.** Need vertical or locale specificity. |

---

## 1. Are We On The Right Track?

### What's true
- Pain is real: FP&A teams waste hours, bad data, manual Excel. Confirmed via Reddit, HN, surveys.
- The market exists: Indonesia MSMEs are underserved, 25% digital adoption, 70% want support.
- The MVP is built: upload → chat → citation works.

### What's not true
- **"30-second finance answers" is already ChatGPT.** Upload Excel → ask question → get answer in seconds. ChatGPT, Gemini, Microsoft Copilot all do this today. For free or included in M365.
- **No user has said they have this problem and would pay.** Every stat cited is from vendor surveys (Vena, insightsoftware, FP&A Trends). Zero customer discovery done.
- **Product and strategy are misaligned.** NECTIC.md says cut agent creation. Codebase still has full 4-tab agent builder. 3 weeks of technical debt carrying wrong direction.

### Verdict: Partially on track. Direction is right (vertical AI for finance). But solution framing is too horizontal to win.

---

## 2. Have We Done Everything Properly?

### Things done well
- [x] MVP shipped fast (demo works, upload works, citation works)
- [x] Landing page is credible
- [x] Strategy docs exist (NECTIC.md, PM_BREAKDOWN, BRAINSTORM_AUDIT)
- [x] Codebase has auth, dashboard, agents — more than most pre-validation startups

### Things not done
- [ ] **Zero user interviews.** Week 1 plan says 5 interviews. Not done.
- [ ] **Zero LOIs.** Plan says get 1. Not done.
- [ ] **Zero outbound.** Plan says 20 messages. Not done.
- [ ] **No live users on the product.** No one has used it except founders.
- [ ] **No analytics.** Can't measure if people drop off, try the demo, ask questions.
- [ ] **No competitive analysis for AI labs.** Microsoft Copilot Wave 2 shipped October 2025 — exactly this product. Not tracked.
- [ ] **Upload breaks in prod.** Redis not configured. Core flow fails silently.
- [ ] **Dead footer links.** Trust signals broken.

### Verdict: Good on building. Bad on talking to users. These are inversely correlated for early stage.

---

## 3. Is The Idea Pre-Validated?

**No. Here's the honest breakdown:**

| Claim | Reality |
|-------|---------|
| "42% of FP&A time gathering data" | Vena survey (vendor with incentive to say this) |
| "69% spend 5+ hrs/week" | insightsoftware survey (same issue) |
| "89% bad data" | Pigment survey (same issue) |
| "Indonesia 70% want support" | Mastercard 2024 (broad digital adoption survey, not finance-specific) |

**None of this is:**
- A founder talking to 10 users who confirmed the problem
- A user paying money for a solution
- A waitlist of people who said "yes, this"
- A Reddit thread where users beg for this

**The pre-validated version of this idea would look like:**
- 3 FP&A managers saying "I spend 4 hours every Monday pulling data. I'd pay Rp X to skip that."
- 1 Indonesian accounting firm saying "we serve 30 MSMEs and none can afford Looker"
- A HN thread where someone built this and got 200 upvotes

**We don't have any of that yet.**

---

## 4. The Competitive Reality (Critical)

### What frontier AI labs are already doing

| Player | What they do | When | Free? |
|--------|-------------|------|-------|
| **ChatGPT** | Upload Excel/CSV → ask questions → get answers. Charts, summaries, filters. | Now | Plus = $20/mo |
| **Google Gemini** | Reads .xlsx, .csv up to 50MB, 1M tokens. Full financial reasoning. | Now | Free tier |
| **Microsoft Copilot for Finance** | Excel AI, Financial Reconciliation Agent, Variance Analysis Agent. Wave 2 shipped Oct 2025. | Now | M365 bundle |
| **NotebookLM** | Google Sheets, CSV, deep research. | Now | Free |

**The painful truth:** The exact product we built (upload Excel → ask finance question → get answer) ships with ChatGPT Plus at $20/month. No differentiation. No moat.

### What will happen if we don't pivot framing

- Founders will demo this to an Indonesian MSME.
- The user will say "why not just use ChatGPT?"
- If they have to explain why, they've already lost.

### What frontier AI labs cannot do (where we can win)

1. **Local language + local context.** ChatGPT doesn't understand Bahasa business norms, Indonesian tax (PPh 21, PPn), local COA structures, BPR/BRI/Mandiri statement formats.
2. **Workflow integration.** Not just "ask," but "every Monday, auto-pull from Mekari and send to WhatsApp." Automation, not chat.
3. **Trust for non-technical users.** Indonesian MSMEs don't trust/use ChatGPT. Nectic in Bahasa, priced in IDR, from a local brand = different trust dynamic.
4. **Vertical compliance.** Indonesian MSME tax filing, laporan keuangan, OJK/BI reporting formats. Copilot doesn't know Surat Setoran Pajak.
5. **Distribution.** Accounting firms with 10-50 MSME clients. One sale = many users. ChatGPT doesn't do B2B2C with Indonesian intermediaries.

---

## 5. Can We Do 10X Better?

**Not with the current framing. Yes with a specific pivot.**

### Why current framing loses

"Upload Excel, ask a question" is a feature, not a product. It's already free. We can't beat free by being slightly better at the same thing.

### Where 10X is possible

| Angle | 10X Claim | Why ChatGPT Can't Match |
|-------|-----------|--------------------------|
| **Indonesia tax AI** | "Know your PPh 21, PPn, and SPT in 30 seconds" | Requires deep Indonesian tax knowledge + localization |
| **Bahasa-first finance AI** | First finance AI that thinks in Bahasa Indonesia | Language + cultural context. Not a translation layer. |
| **MSME accounting automation** | "Month-end close for your MSME in 15 minutes" | Workflow, not chat. Connects to local bank APIs, Mekari, Jurnal. |
| **Fractional CFO platform** | One tool for accounting firms serving 10-50 MSME clients | B2B2C distribution. ChatGPT doesn't sell to accounting firms with client portals. |
| **WhatsApp-first** | "Ask your finance question on WhatsApp. Get answer in 30 sec." | Indonesian MSMEs live on WhatsApp. Copilot doesn't. |

**The 10X version of Nectic:** Indonesia's first WhatsApp-native finance AI for MSMEs, integrated with local accounting formats and tax rules — distributed through accounting firms who serve 10–50 clients each.

---

## 6. Lean Startup Todos (2–5 People, Multiple Hats)

### STOP doing
- Building before talking to users
- Maintaining agent creation UI (dead weight)
- Comparing to Meridian/Cube (wrong competitors; ChatGPT is the real one)
- Using vendor survey stats as validation

### This Week — Roles & Tasks

#### Founder (CEO hat + Sales hat)
| # | Task | Why |
|---|------|-----|
| F1 | DM 10 Indonesian accountants/fractional CFOs on LinkedIn | One sale = many users |
| F2 | DM 10 MSME owners who post about finance problems on Instagram/TikTok | Direct pain signal |
| F3 | Join 2 Indonesian finance/akuntan WhatsApp groups | Listen. Don't sell yet. |
| F4 | Run 3 interviews this week: "How do you answer finance questions for your clients today?" | Validate the wedge |
| F5 | Ask: "Would you use a WhatsApp bot that answers finance questions in Bahasa?" | Test the distribution |

#### Builder (CTO hat + Product hat)
| # | Task | Why |
|---|------|-----|
| B1 | Fix Redis in prod (30 min) | Upload flow is broken. Nothing else matters until core works. |
| B2 | Remove dead footer links (15 min) | Trust. |
| B3 | Add PostHog (1 hr) | Can't improve what you can't measure |
| B4 | Prototype WhatsApp integration — send message → get finance answer (2 days) | Tests distribution hypothesis |
| B5 | Bahasa UI for demo page (half day) | Tests whether Bahasa framing changes conversion |

#### Researcher / Analyst hat (any team member)
| # | Task | Why |
|---|------|-----|
| R1 | Map top 5 Indonesian accounting software (Jurnal, Mekari, Zahir, accurate.id, BukuKas) | Find integration opportunity |
| R2 | List top 10 Indonesian accounting firms on LinkedIn + email | F1 target list |
| R3 | Find 5 Indonesian MSME finance threads on Kaskus, Reddit Indonesia, or Facebook groups | Pre-validated pain language |
| R4 | Read Mekari and Jurnal developer API docs | WhatsApp + accounting API integration feasibility |

### Next 2 Weeks — Validate or Kill

| Gate | Pass = continue | Fail = pivot or kill |
|------|----------------|---------------------|
| 3 interviews done | Real pain confirmed + willingness to pay | No one cares → pivot idea |
| 1 LOI | Someone says "yes I'd pay" | No LOI after 20 outbound → rethink |
| 50 demo visits | People try the demo | <10 visits → distribution problem |
| WhatsApp prototype tested with 2 real users | They use it again | One-time curiosity → format doesn't work |

---

## 7. The One Honest Question

Before building anything else, answer this:

> **"Why would an Indonesian MSME owner use Nectic instead of just asking ChatGPT or their accountant?"**

If the answer is:
- "Because it's in Bahasa" → validate that ChatGPT in Bahasa isn't good enough
- "Because it knows Indonesian tax" → build that, not generic finance chat
- "Because it's on WhatsApp" → that's the most defensible. Build that first.
- "Because it's cheaper" → ChatGPT Free exists. Price is not a moat.
- "Because it's better at finance" → not differentiated. Loses.

---

## 8. Summary Scorecard

| Category | Score | Note |
|----------|-------|------|
| Pain validation | 4/10 | Real pain, but survey-only. No user confirmation. |
| Solution validation | 2/10 | No one has said "yes I want this" |
| Differentiation | 3/10 | Indonesia + Bahasa is something. Generic chat is nothing. |
| Competitive awareness | 2/10 | Microsoft Copilot Wave 2 shipped Oct 2025. Not in any doc. |
| Build quality | 7/10 | MVP works. Upload + citation done. Prod has Redis bug. |
| Distribution thinking | 4/10 | Fractional CFO angle is good. Not developed. |
| Speed | 5/10 | Good build speed. Zero sales speed. |
| **Overall** | **4/10** | **Too early to say yes. Too much unknown.** |

---

## 9. Bottom Line

**Do not raise money or go all-in until:**
1. 5 interviews done, 3 confirm "I have this pain and would pay"
2. 1 LOI in writing
3. You can answer "why not ChatGPT?" in one sentence

**Most likely winning path (based on what's uncontested):**
Indonesia-first, Bahasa-native, WhatsApp-distributed finance AI for MSMEs — with deep Indonesian tax/accounting context — sold through accounting firms.

That's not the product that exists today. But it's a product ChatGPT and Microsoft Copilot cannot easily copy.
