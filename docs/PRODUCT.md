# Nectic — Product Intelligence Document

> Last updated: February 2026
> Status: Pre-revenue MVP. Targeting first paying customers and Antler Indonesia pitch.

---

## What Nectic is

Nectic is the **churn prevention intelligence layer for WhatsApp-first B2B SaaS teams in Southeast Asia**.

We detect at-risk accounts 30–60 days before they churn — when save rates are 40%, not 10% — by extracting signals from WhatsApp group conversations between vendors and their enterprise customers.

**One-sentence pitch:**
B2B SaaS teams in SEA manage customer relationships on WhatsApp, but have no way to see which accounts are at risk. Nectic reads those conversations and tells them before it's too late.

---

## The problem

In SEA B2B SaaS, WhatsApp IS the CRM. Customer success, sales, and product feedback all happen in WhatsApp group chats. Product managers and CS leads receive a filtered, delayed version of what customers actually said — because sales reps decide what gets escalated.

The result:

- Churn signals surface weeks after the save window closes
- Product roadmap decisions are based on escalated anecdotes, not actual customer language
- CS teams waste hours reading chat history to understand account health
- Feature requests representing real pain get lost between weekly standups

**Why this is worse in SEA:**

- Indonesian B2B SaaS retention: 62–70% (vs. 90% global median)
- Monthly churn at Series A: 5.7% (vs. 3.5% global)
- 91% of B2B customer communication in Indonesia happens on WhatsApp
- PMs at SEA B2B SaaS have no tooling designed for this reality

**The cost of a one-month detection delay:**
At 5% monthly churn, 200 accounts, $10K ACV:

- $100K/month at risk
- Save rate drops from 40% (early detection) to under 10% (post-notice)
- One missed month = $40K in preventable churn
- Nectic at $200/month = 200x ROI on recovered accounts alone

---

## Who we're building for

**Primary ICP (locked):**

> Series B Indonesian or Singaporean B2B SaaS company. 100–300 enterprise accounts. Tracking account health in spreadsheets or HubSpot comments. WhatsApp groups are the primary customer communication channel. Head of Customer Success is the champion; CRO or CEO is the approver.

**Profile:**

- ARR: $3–15M
- Team: 50–150 people, CS team of 4–8
- ACV: $8–40K
- Accounts per CSM: 30–60 (stretched thin)
- Pain: CSMs learn about churn risk at QBR, not 60 days before
- Current solution: manual WhatsApp reading, weekly syncs, gut feel

**Buyer persona — "Rina Tan":**

- Head of CS, 35–42, Series B Singapore-HQ B2B SaaS (HR tech, fintech, vertical SaaS)
- Reports to CRO or CEO. Owns NRR target 110%+. Manages 4–7 CSMs.
- Controls tooling budget $20–60K/year (7–10% of ARR, post-sales allocation)
- Needs CFO/CEO approval above $20K. Approval cycle: 4–8 weeks.
- Channels: LinkedIn, SaaSBoomi events, Pavilion CS community
- Pain in her own words: "I only hear about unhappy accounts through sales, and by then it's already late"

**Secondary buyer (expansion path):**

- VP Product at same company. Pain: "I don't know what customers are actually complaining about versus what sales tells me." Separate budget from CS stack.

---

## Product architecture

### Current state (MVP)

Users export WhatsApp group chats as `.txt` or `.zip` files and upload them. The system:

1. Parses and cleans the raw export (strips media, system messages, invisible Unicode)
2. Sends to Claude Haiku 4.5 for signal extraction (churn indicators, feature requests, relationship health, complaints)
3. Clusters signals by semantic topic, scores by urgency and confidence
4. Presents an account health report with actionable signals
5. Allows users to track signal status (open / in progress / done / dismissed)
6. Generates feature briefs from product signals (Claude Sonnet 4.6)
7. Provides PM agent chat for follow-up questions about the account

**Technical stack:**

- Next.js 14, TypeScript, Tailwind CSS
- Firebase / Firestore (auth, data persistence)
- OpenRouter → Claude Haiku 4.5 (analysis, chat) / Claude Sonnet 4.6 (brief generation)
- WhatsApp `.txt`/`.zip` parser (client-side, 250 message cap)

**Current limitations:**

- 250 message cap truncates long group histories
- Manual upload is not a sustainable production data ingestion method
- No pricing or payment flow — cannot convert to paid
- No onboarding path for users without an existing WhatsApp export
- NLP not tested against Bahasa Indonesia or high-context SEA communication patterns

### Data ingestion roadmap (decided)

The upload approach is a **demo mechanism only**. The production path is BSP integration.

**Phase 1 — Now (demo):** User-initiated `.txt`/`.zip` upload. Compliant. For early adopters and testing.

**Phase 2 — Q2 2026 (production):** Partner with an authorized Meta Business Solution Provider (BSP) — specifically Qiscus (Indonesia, ISO 27001 certified) or Wati — to receive processed conversation data via their API. Nectic sits as an intelligence layer above the BSP, never as a direct WhatsApp API consumer. This is the documented enterprise-grade compliant path used by Indonesian fintech and HR tech companies.

**Phase 3 — Q4 2026+ (multi-channel):** Expand to Telegram, Line, email threads. The product thesis is channel-agnostic — we analyze messaging conversations. WhatsApp is the wedge.

**Why BSP, not direct API — this is not negotiable:**
Meta's January 2026 policy explicitly bans AI providers from using the Business API when AI is the primary function. Direct WhatsApp API integration would violate this. BSP partnership is the only compliant path. The BSP holds the Meta relationship; Nectic receives structured data via the BSP's own API. This architectural decision shapes the entire product roadmap.

---

## Competitive landscape

### What exists


| Tool                                          | What it does                                                 | Why it is not Nectic                                           |
| --------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| Wati ($35M Series B)                          | WhatsApp chatbots, broadcast analytics, sales intent tagging | Sales automation. No PM use case. No churn detection.          |
| Mekari Qontak (Mekari acquisition, Indonesia) | WhatsApp CRM, CSAT analytics, ticket escalation              | Customer support ops. Potential BSP partner, not a competitor. |
| Respond.io ($8.8M, Malaysia)                  | Multi-channel AI routing, lead qualification                 | Sales and support. No product signals. No churn intelligence.  |
| SleekFlow ($15M, Singapore)                   | AI lead nurture, campaign ROI                                | Marketing automation. Not CS or PM tooling.                    |
| Gainsight / ChurnZero                         | CS platform, health scoring, playbooks                       | US pricing ($2.5K–10K+/month). No WhatsApp. No SEA.            |
| Gong / Chorus                                 | Call recording and signal extraction                         | Call-focused. No WhatsApp. No SEA presence.                    |


**The gap (confirmed by LuminixAI research, March 2026):** No tool extracts product signals and churn indicators from WhatsApp group conversations specifically for B2B SaaS PM and CS teams. This gap is real and uncontested across all SEA markets.

### Nectic's durable differentiation

1. **WhatsApp-native signal extraction** — built for the channel SEA B2B actually uses, not a bolt-on
2. **PM + CS combined use case** — two separate budget sources, one product, two champions
3. **BSP-agnostic intelligence layer** — BSP partnerships create distribution, not dependency; survives any single BSP change
4. **Workspace context injection** — Nectic understands the vendor's product, feature areas, and roadmap; signals are contextually accurate, not generic
5. **Action loop** — signals feed into tracked actions, which feed back into re-analysis; the product gets smarter as teams use it

---

## Pricing model (decided)

**Structure:** Per-account, not per-seat. SEA teams share logins; per-seat pricing gets circumvented and creates resentment. Per-account pricing scales directly with the value delivered.


| Tier    | Price        | Accounts    | Notes                                  |
| ------- | ------------ | ----------- | -------------------------------------- |
| Free    | $0           | 3 accounts  | No credit card. Hook for trials.       |
| Starter | $79/month    | 15 accounts | Indonesia accessible (~IDR 1.3M/month) |
| Growth  | $199/month   | 50 accounts | Singapore mid-market sweet spot        |
| Pro     | $499/month   | Unlimited   | BSP integration, priority support      |
| Annual  | 20% discount | —           | Lock ARR, incentivize commitment       |


**PPP localization:** Indonesia pricing quoted in IDR. Singapore in SGD. Annual billing pushed from day 1.

**Sales motion:** Freemium self-serve for Starter. Growth and Pro require a 30-minute demo call (used to qualify fit, understand their WhatsApp setup, and introduce BSP integration path).

**Revenue targets:**

- Weeks 1–8: 3 paying customers ($79–199/month) = proof of willingness to pay
- Month 3–6: 10 paying customers = $1–2K MRR, Antler pitch ready
- Month 6–12: 30 paying customers via BSP partner distribution channel

---

## Go-to-market (decided)

### First 10 customers — the only playbook that works in SEA

**Step 1: Personal LinkedIn post (this week)**
Post from the founder's personal profile, not the company page. Structure: one-line problem statement + screenshot of a real analysis output + "we have 5 early access spots, DM me." No pitch deck. No long copy. Real product output as the proof.

**Step 2: WhatsApp community presence**
Identify 3–5 Indonesian/Singaporean SaaS founder WhatsApp groups. Join as a participant, not a promoter. Share useful insights from the LuminixAI churn benchmark data. Build presence over 1–2 weeks. Only mention Nectic when directly relevant to someone's stated problem.

**Step 3: Direct founder-led outreach to 20 specific targets**
Hand-pick 20 Series B Indonesian/Singaporean B2B SaaS companies. Find the Head of CS or VP Product on LinkedIn. Send a 3-sentence message: frame their specific churn problem using the benchmark data, ask one question about how they currently handle it, offer 30 minutes with no pressure.

**Step 4: Coffee chat closes deals**
"Ngopi-ngopi" (informal coffee meeting) is the documented first-revenue mechanism for Indonesia. This is not optional — major deals in Indonesia start with informal relationship building, not sales decks. First meeting goal: make them say "this is exactly my problem," not "let me see the pricing."

**What does NOT work:**
Cold email campaigns, Google Ads, Product Hunt launch, content marketing as a primary channel. These are US startup playbooks. Evidence from SEA SaaS founders confirms they fail pre-traction in Indonesia.

### Channel ranking (validated by research)

1. Founder-led personal networks and WhatsApp communities — first revenue
2. LinkedIn personal content — first 20 signups
3. Accelerator networks (Antler, Iterative) — credibility and warm introductions
4. BSP partner distribution (Qiscus/Wati customer base) — scale beyond 50 customers
5. Content marketing — only after product-market fit is confirmed

### BSP as distribution, not just integration

Qiscus has 35K+ Indonesian businesses on their platform. A native Nectic integration visible within the Qiscus dashboard is not just a technical dependency — it is a distribution channel. The BSP partnership is a GTM play as much as it is a product play. Prioritize the Qiscus relationship accordingly.

---

## Investor pitch narrative

**For Antler Indonesia:**

In Southeast Asia, 91% of B2B customer conversations happen on WhatsApp — not Salesforce. Every churn signal, product complaint, and expansion opportunity is buried in chat history that product managers never see. Sales reps decide what gets escalated. PMs make roadmap decisions based on filtered anecdotes.

Indonesian B2B SaaS companies churn at 5–7% monthly — twice the global median. Most CS teams find out accounts are at risk after they've already decided to leave. The save rate at that point drops from 40% to under 10%.

Nectic is the intelligence layer that reads WhatsApp conversations and extracts structured product and churn signals. CS teams know which accounts are at risk 30–60 days early. PMs know what customers actually want, not what sales tells them.

We are not a WhatsApp chatbot. We are not a CRM. We are the intelligence layer that sits above any messaging pipeline — starting with WhatsApp via BSP partnerships (Qiscus, Wati), expanding to Telegram and email. WhatsApp is the wedge into SEA. The intelligence layer is the durable product.

TAM: $2.31B CRM market in SEA, underserved by US tools never designed for messaging-first markets. Expanding to any market where WhatsApp or messaging is the dominant B2B communication channel — MENA, LATAM, India.

**Traction signals to have before pitch:**

- 3+ paying customers at any price point
- 10+ accounts analyzed across different companies
- 1 testimonial from a Head of CS or VP Product
- Qiscus BSP partnership conversation started (even just an intro call on record)

**Antler thesis fit:**
Antler's Sep 2025 "Theory of Next SEA" report calls out AI-native vertical B2B, agentic workflows, and domain data moats as their priority. Nectic is: vertical AI (B2B SaaS CS + PM), WhatsApp-native (Indonesia's dominant channel), domain data moat (SEA conversation signal patterns), agentic workflow (signals feed into actions, actions feed back into re-analysis, continuous intelligence loop).

Antler invests day-zero on adaptability and thesis fit. Apply before traction if necessary — but have paying customers for conviction bets.

---

## Risks and mitigations

### Existential risks

**1. Meta API policy (HIGH probability, HIGH impact)**
Meta banned general-purpose AI from WhatsApp Business API in January 2026. Direct API integration as Nectic's data source would violate this policy and risk permanent account termination.
*Decision: BSP partnership model. Nectic never touches WhatsApp API directly. The BSP holds the Meta relationship; Nectic receives data via the BSP's own API. This is non-negotiable and must be communicated clearly in all investor and customer conversations.*

**2. SEA funding winter (HIGH probability, MEDIUM impact)**
Seed funding in SEA dropped 57–72% YoY. B2B SaaS buyers are in profitability mode and deprioritizing non-core tools.
*Decision: Lead every sales conversation with the ROI anchor, not features. "Your 5% monthly churn on 200 accounts = $100K/month at risk. Nectic at $200/month saves $40K/month. That is 200x ROI." Reframe from new cost to cost savings.*

### Execution risks

**3. NLP accuracy in Bahasa Indonesia (MEDIUM probability, HIGH impact)**
AI signal detection shows 10–15% accuracy drops on high-context SEA languages. Sarcasm, indirect phrasing, and code-switching (Bahasa + English) confuse English-trained models. False positive churn alerts destroy trust in the product.
*Mitigation: Add confidence calibration — flag analyses where conversation is >50% non-English. Build signal feedback mechanism (users mark incorrect signals) as ground truth for future improvement. Test every analysis update against Bahasa-heavy sample exports before shipping.*

**4. Head of CS cannot close alone (MEDIUM probability, MEDIUM impact)**
CS leads rarely own the final purchasing decision. CFO/CTO/CEO gates budget above $20K. Sales cycles extend 2–3x vs. US.
*Mitigation: Involve CRO or CEO at the demo stage, not after. The ROI deck targets finance approval, not CS emotional buy-in. Position as "revenue protection" not "CS efficiency tool."*

**5. WhatsApp @lid privacy (LOW-MEDIUM probability, LOW impact)**
Meta's multi-device update replaced participant phone numbers with @lid IDs in group exports, blocking phone-number-based participant identification.
*Status: Not a current blocker. Nectic identifies participant roles by display name and AI context detection, not phone numbers. Monitor for further privacy hardening that could affect display name visibility.*

---

## Legal and compliance

### Indonesia UU PDP

Fully enforced since October 2024. Classifies WhatsApp group data as personal data. Requires explicit consent before processing. DPIAs required for high-risk activities.

**Current status:**

- Explicit consent checkbox implemented at upload (mandatory)
- Privacy policy at `/privacy` covering UU PDP obligations
- Data minimization: only conversation text processed, no phone numbers stored
- Cross-border transfer disclosed: OpenRouter processes data on US servers, covered by user consent

**Outstanding — must complete before enterprise sales:**

- Right to erasure: no UI for users to delete their data — must build
- Data retention: no auto-delete schedule — must implement (recommended: 90 days raw signals, 12 months summarized insights) and disclose
- DPIA: must conduct and document formal Data Protection Impact Assessment before first enterprise contract

### Singapore PDPA

PDPA treats WhatsApp group chats as personal data disclosures. Purpose limitation required — data collected for signal extraction cannot be repurposed. Fines up to 10% of annual Singapore turnover or $1M USD.

**Current status:** Same consent and privacy policy framework as UU PDP. Purpose limitation is satisfied — data is used only for signal extraction and product intelligence.

### WhatsApp Terms of Service

WhatsApp Business Terms prohibit sharing exported data with unauthorized third parties. January 2026 AI Provider restriction bans general-purpose AI on the Business API.

**Nectic's position:**

- Current MVP (user-initiated exports): Compliant
- Phase 2 (BSP-mediated API): Compliant
- Direct Business API integration: Not permitted — architectural decision made accordingly

### Data Processing Agreement

A DPA template is available for enterprise customers. Required for any contract above $10K ACV. Covers: processing purposes, data categories, sub-processors (OpenRouter/Anthropic), retention periods, security measures, breach notification, data subject rights.

---

## Infrastructure and security

### Current state

- Firebase Authentication (email/password)
- Firestore security rules: per-user data isolation (`users/{uid}/accounts`)
- Shareable read-only links for analysis reports (no auth required)
- HTTPS enforced (Vercel deployment)
- API keys in environment variables (not hardcoded)

### Known gaps — must fix before enterprise sales


| Gap                                | Risk                     | Priority |
| ---------------------------------- | ------------------------ | -------- |
| No rate limiting on API routes     | Abuse and cost explosion | Critical |
| No security headers (CSP, HSTS)    | XSS vulnerability        | Critical |
| Right to erasure UI missing        | UU PDP violation risk    | Critical |
| Data retention auto-delete missing | UU PDP violation risk    | Critical |
| No audit logging                   | Compliance gap           | Medium   |
| Shared links have no expiry        | Data leakage risk        | Medium   |


---

## Feature inventory

### Live


| Feature                                                              | Notes                                                                               |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| WhatsApp `.txt`/`.zip` upload and parsing                            | 250 message cap; production ingestion via BSP                                       |
| Signal extraction (churn, features, complaints, relationship health) | Claude Haiku 4.5; confidence scores + caveats                                       |
| Account context                                                      | Users add product/customer metadata to enrich analysis                              |
| Workspace context                                                    | Company-wide product, feature areas, and roadmap context injected into all analyses |
| Participant role detection                                           | AI auto-classification + global contact book per user                               |
| Re-analysis with signal action feedback                              | Previous tracked actions feed into re-analysis prompt                               |
| Analysis quality indicators                                          | Confidence score, caveats, identified data gaps                                     |
| Signal status tracking                                               | Open/in-progress/done/dismissed per signal, per account                             |
| Signal notes                                                         | Freetext notes attached to any signal                                               |
| Cross-account signal board                                           | Triage view across all accounts                                                     |
| Signal actions feed back into re-analysis                            | Closes the product intelligence loop                                                |
| PM agent chat                                                        | Claude Haiku 4.5, streaming, full account context                                   |
| Dynamic starter prompts                                              | Generated from analysis context, not static                                         |
| Follow-up suggestions after each message                             | Post-message contextual prompts                                                     |
| Feature brief generation                                             | Claude Sonnet 4.6; structured PM output                                             |
| Brief context inputs                                                 | Roadmap status and notes influence brief quality                                    |
| Shareable read-only links                                            | Public URLs for analysis reports                                                    |
| Mobile-responsive UI                                                 | Bottom nav bar, mobile tab switcher for chat vs report                              |
| Explicit consent mechanism                                           | Required checkbox at upload                                                         |
| Privacy policy                                                       | Covers UU PDP, PDPA, GDPR                                                           |


### Missing — blocking first revenue


| Feature                           | Priority | Why it blocks                                            |
| --------------------------------- | -------- | -------------------------------------------------------- |
| Pricing page + Stripe integration | Critical | Cannot collect payment                                   |
| Right to erasure UI               | Critical | UU PDP compliance required for enterprise                |
| Data retention auto-delete        | Critical | UU PDP compliance                                        |
| Rate limiting on API routes       | Critical | Security before any enterprise contract                  |
| ROI calculator in product UI      | High     | Users self-justify upgrade with their own numbers        |
| Bahasa confidence calibration     | High     | Trust in signal quality for Indonesian customers         |
| Demo/sample data onboarding       | Medium   | Current UX requires an existing WhatsApp export to start |
| BSP integration (Qiscus API)      | High     | Production data ingestion path                           |


---

## Roadmap

### Now — First revenue (weeks 1–4)

1. Stripe integration and pricing page — cannot close paying customers without this
2. Right to erasure — delete account and all associated data on user request
3. Data retention policy — auto-delete raw signals after 90 days; disclose in privacy policy
4. Bahasa confidence calibration — flag analyses where conversation is predominantly non-English
5. Personal LinkedIn post (founder profile) + 20 direct outreach messages to Head of CS targets

### Month 1–3 — Traction for pitch

1. Qiscus BSP partnership intro — first meeting, understand their API, map integration path
2. ROI calculator — show each user their at-risk MRR and projected Nectic ROI in-product
3. Rate limiting and security headers on all API routes
4. Demo account with sample data — onboard users without requiring an existing export
5. Signal board export to CSV — enables CS team to use signals in existing workflows

### Month 3–6 — Scale to 10 customers

1. BSP integration Phase 2 — Qiscus API integration, automated data ingestion
2. Audit logging — per-user action log for enterprise compliance requirements
3. Multi-user workspace — multiple team members under one account
4. Telegram channel support — second messaging channel, validates channel-agnostic thesis
5. Antler Indonesia application — with 3+ paying customers and BSP partnership confirmed

### Month 6–12 — Product-market fit

1. Account health scoring — aggregated health score per account, not just individual signals
2. Slack and email weekly digest — signal summary pushed to CS team without requiring login
3. NRR measurement — track expansion and contraction within Nectic's own customer accounts
4. Vertical signal templates — industry-specific patterns for fintech, HR tech, logistics
5. Singapore market entry — first 5 Singapore-HQ customers, different buying dynamics

---

## Success metrics

### Product health


| Metric                | Definition                                                | Target (Month 6) |
| --------------------- | --------------------------------------------------------- | ---------------- |
| Accounts analyzed     | Unique WhatsApp groups processed                          | 50               |
| Signals actioned rate | Signals moved from open to in-progress or done            | 40%              |
| Weekly active users   | % of paying customers who open app at least once per week | 70%              |
| Re-analysis rate      | Accounts with 2 or more analyses                          | 50%              |
| False positive rate   | Signals marked incorrect by users                         | Less than 20%    |


### Business health


| Metric           | Definition                                  | Target (Month 6) |
| ---------------- | ------------------------------------------- | ---------------- |
| MRR              | Monthly recurring revenue                   | $2,000           |
| Paying customers | Active paid subscriptions                   | 10               |
| NRR              | Net revenue retention                       | Above 100%       |
| CAC payback      | Months to recover customer acquisition cost | Under 3 months   |


---

## What Nectic is not building

- Not a WhatsApp CRM (that is Qontak, Wati, Respond.io)
- Not a chatbot platform
- Not a customer support ticketing tool
- Not a general-purpose AI assistant
- Not building for SMB volume at low ACV
- Not indexing all messages in real-time

Every feature decision should be answerable with: does this help a Head of CS detect churn earlier, or help a VP Product understand what customers actually want?

---

## Agentic system design — context window, temporal awareness, and memory

> Written March 2026. Framework for future build decisions.

### The context window model

Every Nectic analysis and chat is built on a context window containing four layers:

| Layer | Source | Updated by | Staleness risk |
|---|---|---|---|
| Product context | Workspace fields | PM manually | High — quarter boundaries |
| Account state | Signal analysis result | Each analysis run | Medium — new data needed |
| PM decisions | Signal actions (in_progress / done) | PM on signal board | Low — tracked per-action |
| Conversation | WhatsApp export | PM on re-analysis | High — needs fresh uploads |

**What's built:**
- All four layers are injected into the reanalysis prompt ✅
- Workspace and signal actions are injected into the account chat ✅
- Staleness detection (quarter boundary check) alerts the PM on the roadmapFocus field ✅

**Gap: chat missing signal actions was fixed (March 2026).** The chat API now passes the PM's prior signal decisions to the AI. This means: when a PM asks "what should I do next?", the AI knows what's already in-progress or done and won't re-suggest resolved issues.

---

### Temporal context — the Q1→Q2 problem

**The job:** "When I move to a new quarter, Nectic should help me understand what's still unresolved from last quarter, not just re-surface stale signals as if they're new."

**Current state (March 2026):**
- The `roadmapFocus` field stores one quarter's roadmap. When the PM updates it, the old value is overwritten.
- The AI has no memory that "mobile app" was Q1's priority and is now shipped.
- The staleness nudge (>45 days / quarter boundary) prompts the PM to update, but doesn't preserve history.

**Why we're NOT building roadmap versioning yet:**
No user has completed a full quarter cycle on Nectic. Building history storage before a single user experiences the Q1→Q2 transition is feature factory. We'd be designing for an edge case we haven't observed. Build this when the first user says "it's Q2, I want to archive my Q1 roadmap."

**Design for when we build it (Sprint N):**

Extend `WorkspaceContext` in Firestore:
```typescript
interface WorkspaceContext {
  // ... existing fields ...
  roadmapHistory?: {
    quarter: string        // "Q1 2026"
    focus: string          // the roadmap text
    archivedAt: string     // ISO timestamp
    archiveReason?: string // "new quarter" | "major pivot" | "manual"
  }[]
}
```

UI: When the PM updates `roadmapFocus` and a quarter boundary is detected, show: "Archive Q1 roadmap before updating?" → on confirm, push current value to `roadmapHistory` array.

AI usage: In the reanalysis prompt, inject:
```
PREVIOUS ROADMAP (Q1 2026, archived):
[archived focus]
CURRENT ROADMAP (Q2 2026):
[current focus]
```

This lets the AI say: "This feature request was already in your Q1 roadmap — if it shipped, customers are still not satisfied. If it slipped, this is escalating priority."

**Trigger to build:** First user complaint about stale roadmap context OR first enterprise customer asking for quarterly review features.

---

### Agentic memory loop — signal → action → outcome

**The vision:** Nectic should detect: "You said you'd fix the login issue in January. You marked it in-progress. Re-analysis in March shows customers are still mentioning it. This is escalating — either the fix wasn't effective or it hasn't shipped."

**What exists:**
- `signalActions` per account: `{ status, note, updatedAt }` ✅
- `buildSignalActionsBlock` injects prior decisions into reanalysis prompts ✅
- Signal actions now injected into chat context ✅

**What's missing for the full loop:**
1. **Outcome tracking** — did the health score improve after the PM said "done"? We don't correlate action → outcome.
2. **Cross-account pattern persistence** — if "login bug" is marked done in 3 accounts but still being complained about, Nectic doesn't know this.
3. **Proactive nudges** — "You have 4 signals marked in-progress for >30 days — want to re-analyze those accounts?"

**Why not building proactive nudges yet:**
Requires a background job (cron/webhook), a notification surface (email, in-app), and a well-tuned algorithm to avoid noise. Building this before we have 10+ active users who've used signal actions consistently will produce a feature nobody uses. The trigger: first user says "I keep forgetting to check back on in-progress signals."

**Design for proactive nudges (Sprint N+1):**
- Vercel Cron job: runs weekly, queries all users' signal actions
- For each user: find signals in `in_progress` status with `updatedAt` > 21 days old
- Surface: in-app banner on dashboard next login — "3 signals you're working on haven't had a re-analysis in 30+ days. [Review]"
- No email until product-market fit confirmed.

---

### Design system reference

All `/concept` pages should use these primitives consistently:

| Token | Value |
|---|---|
| Page background | `bg-neutral-50` |
| Card | `bg-white border border-neutral-200 rounded-xl` |
| Card hover | `transition-all hover:-translate-y-0.5 hover:shadow-md` (account cards) or `hover:bg-neutral-50/50` (list rows) |
| Nav height | `h-12` |
| Nav active | `text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5` |
| Spinner | `w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin` |
| Page title | `text-xl font-semibold text-neutral-900` |
| Subtitle | `text-sm text-neutral-500 mt-0.5` |
| Risk: critical | `bg-red-500` / `text-red-700` |
| Risk: high | `bg-orange-400` / `text-orange-700` |
| Risk: medium | `bg-amber-400` / `text-amber-700` |
| Risk: low | `bg-green-400` / `text-green-700` |
| Max-width: narrow (workspace) | `max-w-2xl` |
| Max-width: standard (accounts) | `max-w-4xl` |
| Max-width: wide (board, account detail) | `max-w-5xl` / `max-w-6xl` |

**Rule:** `rounded-xl` on all card containers. `rounded-lg` only for inline elements (input fields, buttons, tags).

---

## Research appendix (LuminixAI, March 2026)

Eight research reports were commissioned to validate the Nectic thesis. Summaries:

**Report 1 — Competitive landscape:**
No tool exists that does PM-focused product intelligence from WhatsApp group exports. Wati, Qontak, Respond.io, SleekFlow, and Gong all confirmed as non-overlapping. Gap is real.

**Report 2 — Pricing benchmarks:**
Global CS tools price at $2.5K–10K+/month. SEA WTP is 40–70% below global. Per-account pricing outperforms per-seat in SEA. Recommended range: $79–499/month with freemium and 20% annual discount.

**Report 3 — Legal and compliance:**
Indonesia UU PDP fully enforced since October 2024. Singapore PDPA enforced with fines up to 10% annual turnover. WhatsApp ToS January 2026 ban confirmed. BSP integration model is the documented enterprise-grade compliant path.

**Report 4 — Disconfirming evidence:**
Four risks identified. Meta API ban: existential, mitigated by BSP model. SEA funding winter: high, mitigated by ROI framing. NLP accuracy in Bahasa: execution risk, requires confidence calibration. Head of CS buyer authority: execution risk, requires C-suite champion strategy.

**Report 5 — Churn benchmarks and ROI framework:**
SEA B2B SaaS churn: 62–70% retention, 10–15 points below global. Series A monthly churn: 5.7%. One-month detection delay = full MRR of at-risk account lost. ROI: 1% retention improvement = 12% ARR boost annually. Save rate: 40% early vs under 10% reactive.

**Report 6 — Buyer persona:**
Head of CS owns tooling budget $20–60K/year post-Series A. Budget approval above $20K requires CFO or CEO sign-off. Approval cycle 4–8 weeks. Target Singapore-HQ companies first (63% of SEA VC flows through Singapore).

**Report 7 — GTM channels:**
Ranked by effectiveness for first 10 customers: (1) founder-led personal networks and WhatsApp communities, (2) LinkedIn personal posts, (3) accelerator networks, (4) BSP partner distribution, (5) content marketing. Enterprise sales cycles: 30–90 days mid-market, 180+ days enterprise. "Ngopi-ngopi" relationship building is the documented path to first revenue in Indonesia.

**Report 8 — Investor landscape:**
Antler Indonesia: $72M SEA Fund II. Invests $85K for 10% day-zero. Thesis confirmed: AI-native vertical B2B, agentic workflows, MSME automation, domain data moats. YC: 63% of 2025 batches B2B, 50%+ AI/ML, needs traction proof. Both prioritize vertical AI over horizontal. Nectic fits Antler's thesis precisely.