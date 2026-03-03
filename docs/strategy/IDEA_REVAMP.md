# Nectic — Idea Revamp

**Date:** February 2026  
**Framework:** Bootstrap-first → VC-backable  
**Based on:** Founder background (Mekari + Shopee + 5yr AI product) + internet-validated pain + competitive whitespace

---

## The Hard Truth About The Current Idea

"Upload Excel → ask finance questions" = ChatGPT. Already free. No moat.  
Delegasi tried Indonesia MSME finance AI in 2022. They're now inactive.  
The current framing is a feature, not a company.

**The revamp uses your actual unfair advantages — not generic AI.**

---

## Your Unfair Advantages

| Background | What it unlocks |
|------------|----------------|
| **Shopee experience** | You know how sellers get paid, how fees compound, how settlement CSVs look, how painful multi-platform selling is. This is insider knowledge. |
| **Mekari experience** | You know how Indonesian SMEs use accounting software, what they understand vs. what confuses them, and what Mekari's product gaps are. |
| **5yr AI product** | You can build a production-quality LLM product in weeks, not months. |
| **Indonesia network** | First 100 users are a WhatsApp message away. |
| **No finance domain** | Counterintuitively fine — you're building for sellers/SMEs who also don't have finance expertise. You understand them. |

---

## The New Idea

### "Labarugi" — Actual Profit Calculator for Indonesian Online Sellers

> **One-liner:** Indonesian sellers on Shopee, Tokopedia, and TikTok Shop don't know their actual profit. Labarugi shows them — in Bahasa, in 30 seconds, from their settlement report.

**Core insight:** Most Indonesian online sellers track revenue, not profit. After Shopee commission (4.25-8%), Tokopedia Dynamic Commission (4-6.5%), TikTok Shop fees (5-8%), shipping, returns, and ad spend — a seller making Rp10M in sales might actually be losing money. They don't know. **"Many sellers don't realize they're losing money because they only track revenue, not profit."**

---

## Why This Is Pre-Validated (Internet Evidence)

| Evidence | Source | Signal |
|----------|--------|--------|
| Multiple profit calculator tools exist (tiksly.com, dashboardly.io, kixmon.com) | Search results | Demand exists |
| Kabana (SEA seller analytics) was acquired | usekabana.com | Market is real |
| Shopee + Tokopedia hiked fees multiple times in 2024 | Nikkei Asia | Pain is getting worse |
| "Many sellers don't realize they're losing money" | Multiple blog posts | Pain is widespread, unresolved |
| 21M sellers on Tokopedia + TikTok Shop alone | Kompas, 2024 | Market is massive |
| TikTok Shop sellers grew 40% YoY into Ramadan 2025 | Tempo | Growing fast |
| SellerNova charges $19-99/month | SellerNova | Willingness to pay exists |
| Graas charges $100+/month | Graas.ai | Enterprise tier viable |
| YouTube/TikTok flooded with "cara hitung untung jualan Shopee" videos | YouTube | Bahasa-native demand unserved |

**The gap:** All existing tools are English, expensive ($19-100+/month), complex dashboards, or require API integration. **Zero tools serve the 21M Indonesian small sellers in Bahasa at a price they can pay (Rp50,000-150,000/month = $3-10).**

---

## Why ChatGPT / Microsoft Can't Win Here

| What you need | ChatGPT | Copilot | Labarugi |
|---------------|---------|---------|---------|
| Shopee Sep 2024 fee table (4.25-8% by category) | ❌ Not trained on this | ❌ N/A | ✅ Hardcoded + updated |
| Tokopedia Dynamic Commission (4-5.5%, capped Rp40K) | ❌ | ❌ | ✅ |
| TikTok Shop affiliate commission (10-30% creator cut) | ❌ | ❌ | ✅ |
| GoSend / JNE / J&T shipping cost table | ❌ | ❌ | ✅ |
| Settlement CSV format for each platform | ❌ | ❌ | ✅ |
| Bahasa Indonesia with local business context | Partial | ❌ | ✅ |
| Price: Rp50,000/month ($3) | N/A (different product) | Expensive bundle | ✅ |
| WhatsApp-native | ❌ | ❌ | ✅ (roadmap) |

**Moat:** Platform-specific fee logic + Indonesian market knowledge + Bahasa UX + distribution via seller communities. This requires ongoing maintenance (fee tables change every few months) = defensibility through operational excellence.

---

## Market Size

| Segment | Count | Price/month | ARR potential |
|---------|-------|-------------|--------------|
| Small sellers (Rp0-50M/month GMV) | ~18M | Rp50,000 ($3) | Enormous (even 0.1% = $648K ARR) |
| Mid sellers (Rp50M-500M/month GMV) | ~2.5M | Rp150,000 ($10) | 0.1% = $3M ARR |
| Large sellers / brands | ~500K | Rp500,000-1M ($33-67) | Accounting firm / enterprise tier |
| SEA expansion (Philippines, Thailand, Vietnam) | Same playbook | Same | 5x multiplier |

**TAM:** $500M+ (conservative). Even 1% of 21M Indonesian sellers at $5/month = $12.6M ARR.

**YC bar:** $100M+ ARR path. Clear: 1% of Indonesia → SEA rollout → enterprise/accounting firm tier → platform API integrations.

---

## Competitive Landscape

| Competitor | Price | Gap |
|------------|-------|-----|
| **SellerNova** | $19-99/month | English, complex, not Indonesia-specific |
| **Graas/Turbo** | $100+/month | Enterprise, not for small sellers |
| **Kabana** | Acquired | Gone from market |
| **Shopee Seller Center** | Free | Shows revenue, not profit. No cross-platform. |
| **ChatGPT** | $20/month | Generic, no platform fee logic, English-first |
| **Excel manual** | Free (time cost) | "Unpaid second job" — exactly what we replace |

**Whitespace:** Affordable (Rp50K-150K/month), Bahasa-native, Indonesia-specific fee logic, CSV upload (no API needed), cross-platform (Shopee + Tokopedia + TikTok Shop). No one owns this.

---

## Bootstrap Path (2-person team, 0 external funding)

### Month 1 — First Rp. of Revenue

**Build (1 person, 2 weeks):**
- Upload Shopee settlement CSV → parse → calculate actual profit per order
- Hardcode Shopee fee table (commission % by category, payment fee, shipping subsidy)
- Output: Total revenue, total fees, total profit, margin %, top 5 products by profit
- Stack: Next.js + simple table parsing. Zero AI needed in v1. Pure calculation.

**Sell (1 person, 2 weeks):**
- Join 5 Indonesian seller Facebook groups / WhatsApp groups
- Post: "Siapa yang mau tahu untung bersih jualan di Shopee? Upload laporan settlement, langsung lihat margin asli." (Who wants to know their net profit from Shopee? Upload settlement report, see real margin.)
- Target: 20 beta users, free for 2 weeks
- Ask: "Would you pay Rp50,000/month for this?" → Get 10 "yes"

**Gate:** 10 people say they'd pay before building anything else.

### Month 2 — First Rp5M MRR (~$300)

- Charge: Rp50,000/month for Shopee-only tier
- Add Tokopedia CSV parser
- Target: 100 paying users
- Revenue: Rp5M/month ($300) — enough to cover server costs and validate

### Month 3 — First Rp15M MRR (~$1,000)

- Add TikTok Shop CSV parser
- Add "cross-platform view": total profit across all platforms
- Raise price to Rp100,000/month for multi-platform
- Revenue: 150 users × Rp100K = Rp15M/month ($1,000 MRR)
- **This is the proof point. Real users. Real money. No investors needed yet.**

### Month 4-6 — Rp50M MRR (~$3,000)

- Add WhatsApp bot: send settlement file → get profit summary
- Add "fee alert": "Shopee raised your commission 2% this month. Your margin dropped from 23% to 21%."
- Add accounting export: connect profit data to Mekari Jurnal / Accurate (leverage Mekari background)
- Revenue: 500 users × Rp100K = Rp50M/month ($3K MRR)

### Month 6-12 — Rp200M MRR (~$13K) → VC conversation

- 2,000 users
- Add enterprise tier (brands, accounting firms managing multiple seller clients)
- Connect via API (Shopee Open API, Tokopedia API) — no more CSV upload
- Revenue: Rp200M/month ($13K MRR = $156K ARR) → **seed fundable**

---

## VC Path (Post-Bootstrap Validation)

### What to show VCs at seed

| Metric | Target | Why it matters |
|--------|--------|---------------|
| MRR | $10K+ | Proves willingness to pay |
| Users | 1,000+ | Proves distribution works |
| Churn | <5%/month | Proves product stickiness |
| LTV:CAC | >3x | Proves unit economics |
| Net Revenue Retention | >100% | Sellers upgrade as they grow |

### The VC pitch (post-traction)

> **"21 million Indonesian sellers don't know their actual profit. We built the first Bahasa-native profit intelligence tool for Shopee, Tokopedia, and TikTok Shop sellers. 1,000 sellers pay us Rp100,000/month. Churn is 3%. We're expanding to the Philippines and Thailand next."**

### Investors to target (in order)

| Investor | Why | When |
|----------|-----|------|
| **Antler Indonesia** | Day-zero investor, Indonesia AI/fintech thesis, $150K pre-seed | Now — apply even before MRR |
| **East Ventures** | Indonesia-focused, e-commerce background (Tokopedia), seed stage | At $5K MRR |
| **AC Ventures** | SEA focus, fintech + e-commerce | At $10K MRR |
| **YC** | At $10K MRR + 3 months retention data | Apply W27 (Oct 2026) |

---

## Team & Roles (2-5 People, Multiple Hats)

| Person | Primary hat | Secondary hat | Key tasks |
|--------|------------|---------------|-----------|
| **Founder (you)** | Product + Engineering | CEO | Build CSV parser, landing page, payment. Talk to users daily. |
| **Person 2** | Growth + Community | Sales | Infiltrate seller communities. Run outbound. Get 100 beta users. |
| **Person 3 (month 3+)** | Customer success | Operations | Update fee tables monthly. Answer support. Feed back to product. |
| **Person 4 (month 6+)** | Engineering | DevOps | WhatsApp integration, API connections, scaling. |
| **Person 5 (after seed)** | BD / Partnerships | Enterprise sales | Accounting firms, brand partnerships, Mekari/Jurnal integration. |

---

## Todos — Week by Week

### This Week (Before Any Code)

| # | Owner | Task | Why |
|---|-------|------|-----|
| W1 | Founder | Download your own Shopee seller settlement CSV (or ask 3 sellers for theirs) | Understand the data format before building |
| W2 | Founder | Join 5 Indonesian seller Facebook groups / WhatsApp groups — just listen | Find the exact language sellers use for this problem |
| W3 | Founder | DM 10 active Shopee sellers: "How do you calculate your actual profit today?" | Validate the pain firsthand |
| W4 | Founder | Find and read: Shopee fee structure page, Tokopedia commission structure, TikTok Shop creator commission FAQ | Build the fee logic accurately |
| W5 | Founder | Google "cara hitung untung jualan Shopee" — read top 10 results | Understand how sellers currently solve this |

**Gate:** If 5 of 10 sellers say "I don't know my actual profit and I'd pay for this" → build.

### Week 2 — First Build

| # | Task | Scope |
|---|------|-------|
| B1 | CSV parser for Shopee settlement report | Read columns: order ID, product, selling price, commission, shipping fee, actual earnings |
| B2 | Fee calculator | Input: selling price + category → Output: actual commission %. Use Shopee's Sep 2024 fee table. |
| B3 | Profit summary view | Table: per-product profit, total revenue, total fees, net profit, margin % |
| B4 | Upload page | Drag-drop CSV → show results. No auth needed. No payment yet. |
| B5 | Simple landing page in Bahasa | "Berapa untung bersih kamu jualan di Shopee? Upload laporan, lihat hasilnya." |

### Week 3 — First Users

| # | Task | Scope |
|---|------|-------|
| U1 | Post in 5 seller groups | "Beta gratis — upload settlement Shopee, lihat untung bersih. Link: [url]" |
| U2 | DM 20 sellers directly | Personalized: "Halo, lagi cari cara hitung margin jualan di Shopee? Ada tool gratis..." |
| U3 | Record every piece of feedback | What confused them? What was missing? What did they love? |
| U4 | Ask 3 users: "Would you pay Rp50,000/month?" | Get verbal commitment before building payment |

### Week 4 — Charge

| # | Task | Scope |
|---|------|-------|
| P1 | Add Midtrans / Xendit payment | Indonesian payment gateway. Rp50,000/month. |
| P2 | Add simple auth | Email + password. Keep their data between sessions. |
| P3 | Announce paid plan to beta users | "Kami akan mulai charge Rp50,000/month minggu depan. Mau lanjut?" |
| P4 | Target: 20 paying users | = Rp1M/month. Proof of concept. |

---

## What Makes This 10X Better Than Existing Options

| Dimension | Current best | Labarugi |
|-----------|-------------|---------|
| Price | $19-100/month | Rp50,000-150,000 ($3-10)/month |
| Language | English | Bahasa Indonesia |
| Fee accuracy | Generic | Indonesia-specific (Shopee, Tokopedia, TikTok Shop exact rates) |
| Setup | API integration required | CSV upload only |
| Platform coverage | Generic | Shopee + Tokopedia + TikTok Shop |
| Distribution | App store / website | Seller communities + WhatsApp |
| Updates | Slow / manual | Fee table updated monthly (ops moat) |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Shopee changes fee structure | Build ops process: check fee page monthly, push update same day |
| Seller communities reject promo | Provide genuine value first (free tool, educational posts) before pitching |
| Platforms block CSV export | Shopee/Tokopedia/TikTok all expose settlement CSVs. This is standard seller data. |
| Graas or SellerNova prices down | They won't — their CAC requires $50+/month. Small sellers aren't their market. |
| ChatGPT adds Indonesia fee tables | They can add generic tables. They cannot maintain them monthly. Ops = moat. |
| Someone copies this | Speed matters. Be 12 months ahead. Then API integrations = switching cost. |

---

## The One-Page Summary

**What:** Indonesia's first Bahasa-native, affordable profit calculator for Shopee / Tokopedia / TikTok Shop sellers.

**Who:** 21 million Indonesian online sellers who track revenue but not profit.

**Pain:** Fee increases in 2024 made margins opaque. Most sellers don't know if they're actually making money.

**Solution:** Upload your settlement CSV → see actual profit, margin, top products — in Bahasa.

**Why you:** Shopee background = you know how settlement works. Mekari background = you know how Indonesian SMEs need data presented. 5yr AI product = you can build this in 2 weeks.

**Why now:** TikTok Shop exploded in Indonesia. 21M sellers. Fee complexity at all-time high. No affordable Bahasa tool exists.

**Bootstrap:** $0 → $1K MRR in 3 months. Profitable early. No funding needed.

**VC:** 1% of 21M sellers at $5/month = $12.6M ARR. SEA expansion = $60M+ ARR. Clear path to Series A.

**Why ChatGPT can't:** Requires platform-specific fee tables updated monthly. Requires Bahasa + Indonesian business context. Requires seller community distribution. All are ops/distribution advantages, not just AI.
