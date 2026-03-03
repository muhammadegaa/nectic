# Nectic — VC-Backable Assessment

**Frameworks:** YC (Spring 2026 batch) + Antler SEA 2025  
**Date:** February 2026  
**Question:** Is this fundable, and if so, what version?

---

## 1. YC Filter — The 10-Second Test

**YC rule:** Partners must understand what you do in one sentence. If they can't, rejected.

### Current pitch (fails)
> "Finance teams spend 5+ hours/week recreating reports. We let them ask the question and get the answer in 30 seconds."

**Why it fails:** This is ChatGPT's description. Microsoft Copilot says the same thing. No one reading this in 2026 sees a company — they see a feature.

### Revised pitch (passes the 10-second test)
> "Nectic is the finance brain for Indonesian accounting firms — one tool that answers finance questions for all their MSME clients, in Bahasa, on WhatsApp, without SQL or dashboards."

**Why this works:** Indonesia + Bahasa + WhatsApp + accounting firm distribution = none of these in the same sentence from ChatGPT, Microsoft, or any Western SaaS.

---

## 2. YC Criteria Scorecard

| Criterion | Weight | Current Score | With Pivot | Notes |
|-----------|--------|--------------|------------|-------|
| **Team** | #1 | 5/10 | 5/10 | No finance domain; compensate with Indonesia network |
| **Market size** | High | 7/10 | 8/10 | $171M Indonesia accounting software, growing 12.6% CAGR. 64M MSMEs. Real. |
| **Problem is real** | High | 6/10 | 8/10 | Pain validated via proxy (surveys, HN, Reddit) but no user interviews yet |
| **Solution differentiation** | Critical | 2/10 | 7/10 | Currently = ChatGPT. Pivoted = WhatsApp + Bahasa + accounting firm channel |
| **Why now** | High | 6/10 | 8/10 | LLMs 2024+, Indonesia #4 GenAI user globally, Microsoft investing $1.7B in ID cloud |
| **Traction** | Critical | 1/10 | 1/10 | Zero. No users, no LOIs, no interviews. This is the kill condition. |
| **Moat / defensibility** | High | 1/10 | 6/10 | Current = none. Pivoted = local tax knowledge + distribution channel + WhatsApp |
| **Founder-market fit** | High | 4/10 | 6/10 | No finance background but Indonesia network + Mekari/Shopee experience = relevant |
| **Explainability** | High | 3/10 | 8/10 | Current pitch is generic. New pitch is specific and defensible. |

**YC verdict today:** Rejected (no traction, no differentiation).  
**YC verdict with pivot + 3 LOIs:** Competitive applicant.

---

## 3. Antler SEA Criteria Scorecard

Antler invests at day-zero. They care less about traction and more about team + thesis fit.

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Indonesia AI thesis** | 8/10 | Indonesia = world's 4th largest GenAI user. Antler explicitly calls this out. |
| **Fintech + AI intersection** | 9/10 | Their two top sectors. This is dead center. |
| **Founder execution evidence** | 6/10 | Mekari, Shopee background is credible. Product shipped fast. |
| **Global ambition** | 5/10 | Indonesia-first is fine for Antler SEA. But need a path to SEA-wide. |
| **Co-founder team** | Unknown | Antler heavily weights co-founder fit. Solo founder is a risk signal. |
| **Category leader potential** | 6/10 | With WhatsApp + accounting firm channel, could be Xero for emerging market MSMEs |

**Antler verdict:** Fundable today at pre-seed if co-founder setup is right. Indonesia AI fintech fits their thesis perfectly.

---

## 4. The Critical Comparable: Delegasi (YC S22) — Same Idea, Failed

Delegasi built the same product: AI financial assistant for Indonesian SMEs (F&B). YC backed them in Summer 2022. They are now **inactive** (78.6% team drop, 7 employees left).

### Why Delegasi likely failed (inferred)

| Root cause | Evidence | Lesson for Nectic |
|------------|----------|-------------------|
| **Wrong ICP** | F&B owners = high churn, seasonal, often informal | MSME accounting firms = stickier B2B2C channel |
| **Too complex** | Receipts → full financial statements = hard to get right. Accuracy = trust issue. | Start narrower: answer one question (burn rate) perfectly |
| **No distribution moat** | Selling direct to SME owners = CAC too high for the price point | Accounting firms as channel = 1 sale = 30 users |
| **Pre-LLM tech (2022)** | 2022 LLMs couldn't do this reliably. Accuracy was the product killer. | 2026: GPT-4o, Gemini 2 can handle this accurately. Why now is real. |
| **English-first** | Likely built in English/generic | Full Bahasa + local accounting format is the 2026 unlock |

### How Nectic must be different from Delegasi

1. Distribution via accounting firms (B2B2C), not direct-to-MSME
2. WhatsApp-first, not app-first
3. Narrower starting point: answer spend questions, not generate full P&L
4. Post-LLM accuracy (2026) vs pre-LLM (2022)
5. Indonesian tax + accounting context baked in (PPh 21, PPn, laporan keuangan)

**This is your "why we'll win where Delegasi failed" story.**

---

## 5. The Moat Question

**YC asks:** "What stops Google from doing this in 6 months?"

### Current answer (bad): Nothing.
ChatGPT already does upload Excel → ask finance question. Google Gemini supports .xlsx up to 50MB. Microsoft Copilot for Finance Wave 2 shipped October 2025 with a Variance Analysis Agent. There is no moat in the current product.

### Required moat (must build one of these)

| Moat type | How to build it | Timeline |
|-----------|----------------|----------|
| **Distribution moat** | Sign 5 Indonesian accounting firms. Each has 10-50 MSME clients. Network effect + switching cost. | 2 months |
| **Data moat** | Train on Indonesian tax filings, bank statement formats (BRI, BCA, Mandiri), COA structures. ChatGPT doesn't have this. | 4-6 months |
| **Interface moat** | WhatsApp-native. Indonesian MSMEs don't open another app. WhatsApp = 99% smartphone penetration in Indonesia. | 1 month |
| **Trust moat** | Partner with Indonesian KAP (accounting firm association). Certification = trust signal MSMEs care about. | 3 months |
| **Compliance moat** | Be the tool accounting firms use for SPT, laporan keuangan format, OJK reports. Enterprise requires local compliance. | 6 months |

**Minimum viable moat for YC:** Distribution (accounting firms) + Interface (WhatsApp). This can be shown in 60 days.

---

## 6. Market Size — The $1B+ Argument

YC requires a credible path to $100M+ revenue. Antler requires a "category leader" potential.

| Layer | Size | Source |
|-------|------|--------|
| Indonesia accounting software market | $171M (2024), growing to $395M by 2031 | Markets & Data |
| Indonesia MSME count | 64.2M businesses | Government data |
| Addressable (10-200 employee MSMEs) | ~5M businesses | Estimate |
| Accounting firms in Indonesia | ~20,000 KAP/firms | OJK |
| Clients per firm | 10–50 MSMEs | Standard |
| If we serve 2,000 firms × 30 clients × $15/client/month | = **$10.8M ARR** | Back-of-envelope |
| If we serve 10% of Indonesia SME market at $10/month | = **$60M ARR** | Back-of-envelope |
| SEA expansion (same playbook, Thailand, Vietnam, Philippines) | **$500M+ TAM** | Logical extension |

**Verdict:** Market is big enough for Series A/B. The path from Indonesia to SEA is clean. This is a fundable market.

---

## 7. Why Now — The 2026 Unlock

| Factor | Why it matters |
|--------|---------------|
| **GPT-4o / Gemini 2 accuracy** | 2022 LLMs couldn't do accounting reliably. 2026 they can. Delegasi was early. We're not. |
| **Indonesia #4 GenAI user globally** | Adoption is real. Antler explicitly calls this out as an investment signal. |
| **WhatsApp Business API is mature** | 2022 it was limited. 2026 it supports rich interactions, payments, automation. |
| **Microsoft investing $1.7B in Indonesia cloud** | Market is heating up. VCs know this. |
| **Mekari/Jurnal have 35K businesses, 1M users** | Incumbent validation. Market exists. Opportunity to go vertical on top. |
| **AI replaces junior accountants** | Accounting firms need a tool to serve 3x the clients with the same team. That's Nectic. |

---

## 8. The Fundable Pitch (Rewrite)

### For YC (brutal brevity)

**Problem:** Indonesian accounting firms each serve 10–50 MSMEs. Today they answer every finance question manually — spend, tax, cash flow. It takes hours per client per week.

**Solution:** Nectic is a WhatsApp-based finance AI in Bahasa that accounting firms deploy for all their MSME clients. Ask "berapa pengeluaran software bulan ini?" — get the answer in 30 seconds.

**Why us:** We have Indonesia distribution network (Mekari, Shopee). Delegasi tried this in 2022 and failed because LLMs weren't ready and they sold direct-to-SME. We have the right tech (2026 LLMs) and the right channel (B2B2C through accounting firms).

**Traction:** [3 LOIs from accounting firms. 2 firms in pilot.]  ← This is what's missing. Get this before applying.

**Why now:** Indonesia is #4 GenAI user globally. WhatsApp Business API supports automation. Post-LLM accuracy is real.

**Market:** $171M Indonesia accounting software, growing to $395M by 2031. SEA extension = $500M+ TAM.

---

### For Antler (day-zero, team-first)

Focus on: co-founder with finance/accounting background + Indonesia network + early thesis validation from 3 interviews. Antler doesn't need LOIs. They need a credible team with conviction.

---

## 9. What Must Change to Be VC-Backable

### Non-negotiable changes

| Change | Why | By when |
|--------|-----|---------|
| **Run 5 user interviews** | Without this, no VC conversation is possible | Week 1 |
| **Get 1 LOI from an accounting firm** | YC's minimum evidence bar | Week 2 |
| **Pivot pitch to accounting firm channel** | Current direct-to-MSME pitch = Delegasi repeat | Now |
| **Build WhatsApp prototype** | Interface moat. 1-week build. | Week 2 |
| **Add co-founder with finance background** | YC flags no domain expertise. Antler requires co-founder. | Ongoing |
| **Change one-liner** | Current = ChatGPT. New = defensible. | Today |

### Nice to have (before Series A, not seed)

- Indonesian tax knowledge base (PPh 21, PPn)
- Integration with Mekari/Jurnal via API
- 3 paying accounting firm pilots
- Bahasa-first full UI

---

## 10. Verdict

| Investor | Fundable now? | Fundable with changes? | Changes needed |
|----------|--------------|----------------------|----------------|
| **YC** | No | Yes (competitive applicant) | 3+ LOIs, pivot pitch, WhatsApp prototype |
| **Antler** | Maybe | Yes | Co-founder with finance bg, clearer thesis |
| **East Ventures / AC Ventures (Indonesia seed)** | No | Yes | 2+ paying pilots, 1 accounting firm partnership |

**Bottom line:** The idea in its current form is a feature, not a company. Pivoted to WhatsApp-native finance AI for Indonesian accounting firms (B2B2C), with post-Delegasi learnings applied, it's a real VC-backable company. The 2026 why-now story is legitimate. The market is big enough. The moat is buildable. The team has relevant background.

**Single biggest unlock:** Get 3 accounting firms to say "yes I would use this for my clients." That sentence turns this from a side project into a fundable company.
