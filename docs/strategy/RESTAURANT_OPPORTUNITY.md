# Restaurant Opportunity Assessment

**Date:** February 2026  
**Question:** Is there a sellable, fundable product for Indonesian restaurants?  
**Short answer:** Yes. And the market just got validated 3 weeks ago.

---

## The Key Signal: Alpa Raised $3.5M on Feb 26, 2026

Alpa (London) raised $3.5M pre-seed to build real-time P&L for restaurants. Founded by ex-Deliveroo exec.

> *"79% of restaurants want real-time financial data. Only 27% track basic KPIs like labor costs. Monthly accounts close too late to act. We connect POS + banking + supplier invoices → live P&L."*

This is the exact problem. Alpa does it for UK restaurants. No one does it for Indonesia's 5.28 million F&B businesses.

**The comparable is live, just raised, and doesn't serve Indonesia.**

---

## The Pain (Validated)

| Pain | Evidence |
|------|----------|
| Restaurant owners don't know actual HPP (food cost) per dish | Indonesian academic journals, ESB blog ("11 Fatal Pricing Mistakes That Ruin Your Restaurant") |
| Many sell below cost without knowing it | Real example: Ayam geprek at Rp15,000, actual cost Rp14,000 → Rp1,000 profit. Can't pay rent. |
| GoFood/GrabFood commissions are 15-30% per order — owners don't net it out | GrabFood fee structure: 15-30% commission + marketing + payment processing |
| "Omzet kelihatan bagus tapi ga ada uangnya" | Every F&B community group in Indonesia has this conversation |
| Multi-channel blindness: dine-in + GoFood + GrabFood + ShopeeFood = impossible to reconcile manually | ButterPOS exists specifically because "tablet chaos" is real |

---

## The Market

| Metric | Number |
|--------|--------|
| F&B businesses in Indonesia | **5.28 million** (2024) |
| Restaurants specifically | ~1.3 million (24.75% of total) |
| Sector revenue | **Rp998 trillion ($63B+)** (2023) |
| Workers employed | 9.8 million |
| Moka POS downloads | 500K+ (GoTo-owned, market leader) |

This is not a niche market. F&B is **36% of all Indonesian MSMEs**.

---

## The Opportunity: "Alpa for Indonesia"

**Product:** Real-time profit intelligence for Indonesian restaurant owners.

| What you connect | What they get |
|-----------------|---------------|
| Moka POS (or any POS CSV) | Revenue per dish, per day |
| GoFood settlement CSV | Net earnings after 15-30% commission |
| GrabFood settlement CSV | Net earnings after commission |
| ShopeeFood settlement CSV | Net earnings |
| Supplier invoices (manual or WhatsApp photo) | Food cost per ingredient |
| **Combined** | **Actual profit by channel, by dish, by day. Menu engineering: "Push Nasi Gudeg (31% margin), cut Ayam Bakar (8% margin)."** |

**Delivery:** WhatsApp weekly flash P&L report. Bahasa. Rp100K-200K/month.

---

## How This Is Identical to the E-commerce Seller Idea (Same Architecture)

| | E-commerce sellers | Restaurant owners |
|--|-------------------|------------------|
| Problem | Don't know actual profit after platform fees | Don't know actual profit after delivery commission |
| Data source | Shopee/Tokopedia/TikTok Shop settlement CSV | GoFood/GrabFood settlement CSV + POS |
| Key insight | "Your margin on product X is 12%, not 40%" | "Your GoFood margin is 8%, dine-in is 31%" |
| Output | Profit per product, per platform | Profit per dish, per channel |
| Delivery | WhatsApp | WhatsApp |
| Price | Rp75K-150K/month | Rp100K-200K/month |
| Bootstrap | CSV upload | CSV upload |

**The core product is the same. Different input format, different output framing.**

---

## How It's Different (And Potentially Better)

| Dimension | E-commerce sellers | Restaurant owners |
|-----------|------------------|------------------|
| ARPU potential | Rp75K-150K/month | Rp150K-500K/month (more at stake) |
| Willingness to pay | Medium | **Higher** (losing money on GoFood = existential) |
| Unique insight | Per-product margin | **Per-dish + menu engineering** |
| Switching cost | Low | **High** (POS integration, recipe costing) |
| Alpa comparable | No direct comparable | **Yes, just raised $3.5M (Feb 2026)** |
| TAM | 21M sellers | 5.28M F&B businesses |
| Distribution | Seller communities | **Moka POS partner network, F&B communities** |
| Founder fit | Shopee ✓ | Shopee (GoFood/GrabFood = same settlement logic) ✓ |

---

## The Distribution Insight

**Moka POS** (owned by GoTo) has 500K+ Indonesian restaurant users. They give you POS data.  
But Moka POS does NOT tell restaurants their actual margin after GoFood/GrabFood fees.  
That's the gap. You sit on top of Moka POS as the "profit intelligence layer."

**Potential distribution paths:**
1. F&B communities — Facebook groups, WhatsApp groups, TikTok for restaurant owners ("Komunitas Restoran Indonesia" etc.)
2. Moka POS partner referral — Moka's partner ecosystem
3. Food & beverage supplier reps — they visit restaurants regularly
4. Accounting firms that serve F&B clients (B2B2C, same as accounting firm channel)

---

## The Combined Pitch: One Product, Two Customers

Here's the strongest realization: **both ideas are the same product.**

> **"Labarugi AI — Real-time profit intelligence for Indonesian merchants. Upload your settlement reports from Shopee, Tokopedia, GoFood, or GrabFood. Know your actual profit in 30 seconds. On WhatsApp. In Bahasa."**

| Customer segment | Data source | Key insight | Price/month |
|----------------|------------|-------------|------------|
| Online sellers | Shopee/Tokopedia/TikTok settlement | Profit per product, per platform | Rp75K-150K |
| Restaurant owners | GoFood/GrabFood settlement + POS | Profit per dish, per channel | Rp150K-300K |
| Both together | All of the above | **Unified P&L for any merchant with multi-platform revenue** | Rp200K+ |

**Why this is better than two separate products:**
- Same core engine (settlement CSV → fee calculation → profit output)
- Builds a defensible platform: "profit intelligence for any Indonesian merchant"
- Larger TAM pitch to VCs: 21M online sellers + 5.28M F&B businesses + millions of hybrid sellers
- One codebase, two user types

---

## Bootstrap Path for Restaurants

### Week 1-2: Validate
- Join 3 Indonesian F&B WhatsApp/Facebook groups
- Post: "Kalau kamu jualan di GoFood/GrabFood, tahu ga berapa untung bersih setelah komisi? Ada yang mau coba tool gratis?" (If you sell on GoFood/GrabFood, do you know your net profit after commission? Anyone want to try a free tool?)
- DM 10 restaurant owners: "Berapa komisi GoFood yang kamu bayar per bulan? Tahu ga untung bersihnya?"
- Gate: 5 say "I don't know my net profit from delivery"

### Week 2-3: Build (MVP for restaurants)
- Same CSV parser as seller tool, different format
- Parse: GoFood weekly settlement (order value, commission deducted, net payout)
- Parse: GrabFood weekly settlement (same structure)
- Output: "GoFood revenue: Rp45M. Commission paid: Rp9M (20%). Net from GoFood: Rp36M. Compared to dine-in margin: [X]"
- Stack: Reuse existing Nectic upload → chat infrastructure

### Month 1: First Revenue
- 20 restaurant owners on free beta
- Ask: "Would you pay Rp100K/month for this?"
- Target: 10 say yes → launch paid plan
- Revenue: Rp1M/month ($60) — proof

### Month 2-3: Add Recipe Costing
- Let owners input recipes: "Nasi Ayam: 150g rice, 1 chicken piece, 2 tbsp sauce"
- System calculates: food cost per dish
- Output: "Your Nasi Ayam food cost is Rp8,500. You're selling at Rp22,000. Food cost ratio: 38.6%. Industry benchmark: 28-35%. You're above benchmark — look at portion size or supplier price."
- **This is the unique value ChatGPT can't provide without your local ingredient price database**

---

## Risks

| Risk | Mitigation |
|------|-----------|
| GoFood/GrabFood change settlement CSV format | Monitor monthly. 2-hour fix each time. |
| Moka POS builds this themselves | Moka = GoTo, slow to innovate. They've had 10 years to add this. They haven't. |
| Restaurant owners less tech-savvy than online sellers | WhatsApp + Bahasa + simple questions = lower barrier |
| Smaller addressable market than 21M sellers | 5.28M F&B businesses still massive. Higher ARPU compensates. |

---

## Verdict

| Question | Answer |
|----------|--------|
| Is the pain real? | **Yes.** Validated: Alpa ($3.5M), Indonesian academic papers, F&B community forums |
| Is the market big enough? | **Yes.** 5.28M F&B businesses, Rp998T market |
| Is there a direct comparable? | **Yes — Alpa, just raised 3 weeks ago** |
| Is it bootstrappable? | **Yes** — same architecture as seller tool, CSV upload, 2-week build |
| Does it fit founder background? | **Yes** — GoFood/GrabFood settlement = same logic as Shopee/Tokopedia |
| Is it better than the e-commerce seller idea? | **They're the same product.** Build one, serve both. |

**Recommendation:** Don't choose between restaurants and online sellers. **Build one profit intelligence engine that serves both.** Start with whichever segment you can reach first — your network determines where to begin.
