# Nectic — Product Documentation

**Last updated:** March 2026  
**Status:** Early access (pre-revenue)  
**Version:** MVP+  
**Document owner:** Product

---

## Table of contents

1. [What Nectic is](#1-what-nectic-is)
2. [Who it is for](#2-who-it-is-for)
3. [Product principles](#3-product-principles)
4. [Current state assessment](#4-current-state-assessment)
5. [Feature inventory](#5-feature-inventory)
6. [Data model](#6-data-model)
7. [AI pipeline](#7-ai-pipeline)
8. [API reference](#8-api-reference)
9. [Business model](#9-business-model)
10. [Competitive landscape](#10-competitive-landscape)
11. [Infrastructure and security](#11-infrastructure-and-security)
12. [Legal and compliance](#12-legal-and-compliance)
13. [Known limitations and technical debt](#13-known-limitations-and-technical-debt)
14. [Roadmap and priorities](#14-roadmap-and-priorities)
15. [Success metrics](#15-success-metrics)

---

## 1. What Nectic is

Nectic is an AI product intelligence tool for B2B SaaS teams operating in WhatsApp-first markets — primarily Southeast Asia, MENA, and LATAM.

It reads WhatsApp account groups, extracts customer signals (churn risk, product pain points, feature requests, relationship health), and gives product managers and customer success teams a structured, always-current view of what customers actually said — not what sales decided to pass on.

### The core problem

In B2B SaaS companies operating in Southeast Asia, WhatsApp is the primary channel for sales, customer success, support, and product feedback. It functions simultaneously as CRM, helpdesk, sales pipeline, and product discovery. Customer conversations happen in group chats that include sales reps, CS managers, implementation partners, and end users.

PMs receive a filtered, summarised, often delayed version of what customers say. Sales reps decide what to escalate. Important signals get lost, misrepresented, or deprioritised. Product roadmaps end up reflecting what sales found easy to communicate, not what customers actually need.

This isn't a process failure. It's a structural one. The PM's inbox is not connected to the channel where customers actually speak.

### The thesis

> WhatsApp IS the CRM, the support desk, the sales pipeline, and the product feedback loop for SEA B2B SaaS. The PM who reads every conversation knows more than the PM who waits for a standup summary. Nectic automates the reading. Then it reasons about it.

### Positioning

Nectic targets the gap that enterprise conversation intelligence tools (e.g. Gong, Chorus, ClosedLoop) ignore: companies at **Product Discovery Maturity Level 0–1** that operate entirely in WhatsApp and have no existing structured feedback pipeline.

These companies cannot adopt enterprise tooling because:
- Their conversations don't happen in Salesforce, Zoom, or Slack
- They don't have dedicated product ops or research functions  
- The signal volume is high but the infrastructure to capture it is zero

Nectic meets them where they are.

---

## 2. Who it is for

### Primary users

| Role | Job to be done | How Nectic helps |
|---|---|---|
| Product Manager | Understand what customers need without attending every customer call or relying on secondhand sales summaries | Signal extraction, cross-account clustering, AI agent for deep-dive |
| Customer Success Manager | Know which accounts are at risk before the customer says so explicitly | Risk signals, health score, signal action tracking, renewal alerts |
| Founder / CEO | Maintain customer proximity as the team grows | Single dashboard view across all accounts |

### Secondary users (share recipients)

Teammates who receive a shared analysis link can read the full account report without a Nectic account.

### Target market (early access)

- B2B SaaS companies in Southeast Asia (Indonesia, Malaysia, Philippines, Singapore, Vietnam)
- 5–100 person teams
- WhatsApp Business as primary customer communication channel
- Bahasa Indonesia and/or English-speaking teams
- Product discovery maturity: low (no dedicated research ops, no Productboard/Coda setup)

---

## 3. Product principles

**1. Signal, not noise.** Every output must be grounded in an actual customer quote. Nectic never generates insight that isn't traceable to something a customer said.

**2. Agentic, not static.** Nectic doesn't just describe what's in the data. It reasons about it, asks for context when it's missing, and adapts its outputs based on what it learns.

**3. Honest about uncertainty.** When Nectic doesn't have enough data to be confident, it says so explicitly. Low-message-count analyses carry a visible confidence warning.

**4. Respect the customer voice.** All signals are attributed to the customer side of a conversation, not the vendor. Participant labelling ensures Nectic knows whose voice is whose.

**5. No feature factory.** Every feature exists because it removes a specific pain in the PM or CS workflow. Features are not added because they are technically interesting.

**6. Close the loop.** A signal that doesn't drive action is noise. The product is designed to move signals through a pipeline: detect → surface → track → act → re-evaluate.

---

## 4. Current state assessment

*As of March 2026. Honest evaluation for internal use.*

### What is working

- **Core analysis quality** is strong. Claude Sonnet 4.6 extracts meaningful, quote-backed signals from real WhatsApp exports with high fidelity, including in Bahasa Indonesia.
- **The product loop exists end-to-end.** Upload → Analyze → Track signal actions → Re-analyze with delta → Generate brief. No competitor has this in a WhatsApp-native context.
- **Workspace context is a genuine differentiator.** Injecting company product knowledge (features, roadmap, known issues) into every analysis and chat session meaningfully improves output quality and reduces hallucinated priorities.
- **The PM agent is actually agentic.** It applies JTBD framing, surfaces concerns the PM didn't ask about, asks for clarifying context, and writes PM artifacts (tickets, emails, battle cards) on demand. Dynamic starter prompts and follow-up suggestions are generated per account, not hardcoded.
- **Participant role modelling is correct.** Four-role model (vendor/customer/partner/other) handles real-world multi-party chat structures that the binary model breaks on.
- **The client-side parsing approach is a privacy advantage.** Raw exports never leave the browser. This is a selling point with enterprise customers, not a limitation.
- **Signal actions and the signal board close a real PM workflow gap.** Tracking open/in-progress/done/dismissed status per signal and feeding that back into re-analysis is unique and creates the "Nectic learns what you've done" value prop.

### What is not working / gaps

**Critical (blocking growth):**
1. **No billing or pricing.** There is no paywall, no Stripe, no plan limits. The product cannot generate revenue today.
2. **250-message cap is too low.** Reduced from 500 to address Vercel 60-second timeout. Active accounts with daily conversations often exceed this. Analysis silently loses early context. The real fix is chunked analysis or increased Vercel timeout (pro plan), not a lower cap.
3. **No proactive alerts.** The PM must remember to log in and check. A product that requires the user to come to it is not an agent — it's a report viewer. Without email digests or risk alerts, the product cannot defend "agentic" positioning.
4. **No team accounts.** Nectic is strictly single-user. PMs cannot share a workspace with their CS manager. Collaboration is the primary growth vector for B2B tools and it doesn't exist yet.

**Important (affecting retention):**
5. **Chat history is in-memory only.** Lost on page reload. The PM has context on this account, has asked good questions, and has received valuable answers — and it evaporates. This breaks the "Nectic remembers" value prop.
6. **No signal feedback loop.** The PM cannot mark a signal as incorrect. Without feedback, analysis quality cannot improve over time. This is the engine of the data moat and it's not built.
7. **No account rename.** Claude infers the account name from conversation context. It's often wrong or generic ("Hello Group", "Admin"). Users cannot correct it.
8. **Workspace context has no onboarding.** It's a powerful feature that most users will not discover or fill in. No nudge during onboarding, no "your analysis quality would improve if..." prompt.

**Secondary (affecting perception):**
9. **Dashboard lacks a "what do I do today" frame.** The account list with risk-sorted cards is good, but the PM's real question is "what needs my attention right now?" — not "which accounts exist." The top of the dashboard should be a prioritised action queue, not a sorted list.
10. **No error monitoring.** There is no Sentry or equivalent. Bugs in production are invisible until a user reports them.
11. **No product analytics.** We do not know which features are used, where users drop off, or what analyses are run. Flying blind on product decisions.

### Honest VC readiness score

| Dimension | Score | Rationale |
|---|---|---|
| Product thesis | 9/10 | Clear, specific, contrarian, and right about the market |
| Product quality | 6/10 | The core works well but major gaps in alerting, team, and retention |
| Business model | 3/10 | No pricing, no revenue, no growth mechanism |
| Technical foundation | 7/10 | Clean stack, serverless, good security model; some debt |
| Market size | 8/10 | SEA B2B SaaS alone is massive; WhatsApp-first markets extend globally |
| Competition | 7/10 | No direct competitor; large incumbents are not addressing this gap |
| Team | TBD | — |

---

## 5. Feature inventory

### 5.1 Connect flow

**What it is:** A multi-stage guided flow for connecting a new WhatsApp account group to Nectic.

**Stages:**

| Stage | Description |
|---|---|
| Instructions | Step-by-step export guide for iOS and Android. Explains the "Without media" requirement. |
| Upload | Drag-and-drop zone accepting `.txt` (plain export) and `.zip` (folder export). Both are parsed client-side — the file never leaves the browser before analysis. |
| Ready | Three-panel review screen: parsed stats, participant labelling, and optional account context. |
| Analyzing | Progress screen with animated steps. |
| Error | Failure state with specific error message and retry action. |

**File format support:**
- `.txt` — standard WhatsApp export (iOS and Android)
- `.zip` — WhatsApp folder export. JSZip extracts `_chat.txt` client-side before parsing.

**Parser handles:**
- Invisible Unicode characters injected by WhatsApp (`\u200e`, `\u200f`, `\u2068`, `\u2069`, `\u202a–\u202e`)
- Tilde-prefixed sender names (`~Nishabella` → `Nishabella`)
- `<attached: filename>` and `<Media omitted>` lines (filtered)
- `<This message was edited>` marker (stripped)
- Deleted message variants (`this message was deleted`, missed calls)
- URLs replaced with `[link]` to reduce token noise
- BOM prefix (`\uFEFF`) on first line
- Consecutive duplicate messages (deduplicated)
- Three timestamp format variants: iOS bracket format, Android dash format, dot-separated locales

**Current message cap:** 250 (reduced from 500 to prevent API timeout). A truncation warning is shown.

**Known issue:** 250 is too low for active production accounts. Planned fix: increase Vercel function timeout to 5 minutes (Pro plan) and raise cap to 500+.

---

### 5.2 Participant labelling

**What it is:** Per-participant role assignment before analysis runs. Ensures Claude attributes signals to the correct party.

**Roles:**

| Role | Meaning | Prompt treatment |
|---|---|---|
| `vendor` | Your company's team members | Excluded from risk/product signal attribution |
| `customer` | Customer-side participants | Primary source for all signals |
| `partner` | Resellers, implementation partners | Secondary signal source |
| `other` | Unknown participants | Passed to Claude as context, not attributed |

**Auto-classification:** On first connect, participants are auto-classified by Claude Haiku 4.5 using name patterns and sample messages. User corrects any misclassifications.

**Global contact book:** Once a participant is labelled, that name-to-role mapping is saved across the user's entire account. On future uploads or re-analyses, known participants are pre-filled. Only new participants require manual labelling.

**Design rationale:** The binary vendor/customer model breaks with multi-party chats (reseller + vendor + customer, or multiple customer contacts). Four roles covers all real-world cases seen in SEA B2B contexts.

---

### 5.3 Account context

**What it is:** Optional metadata attached to an account that improves analysis accuracy and urgency scoring.

**Fields:**

| Field | Type | Used for |
|---|---|---|
| Industry | Select (8 options) | Contextualises feature requests and risk signals |
| Contract tier | Select (starter / growth / enterprise) | Weights urgency; enterprise complaints score higher |
| Renewal month | Month picker (YYYY-MM) | Flags renewal proximity in risk scoring and chat responses |

**Behaviour:**
- Set during the connect flow (optional)
- Editable via re-analysis flow
- Passed verbatim into the Claude analysis prompt

---

### 5.4 Workspace context

**What it is:** Company-level product knowledge injected into every AI operation. Answers the question "How does Nectic know what your product is about?"

**Fields:**

| Field | Purpose |
|---|---|
| What your product does | Company description, market, customer profile. Prevents Claude from confusing generic terms. |
| Main feature areas | Core modules. Prevents "request for X" being flagged as a gap when X already exists. |
| Roadmap this quarter | Active development. Helps Claude distinguish "we know about this, it's in progress" from a genuine blind spot. |
| Known issues | Bugs your team already knows about. Prevents Claude from surfacing these as new discoveries. |

**Where it is used:**
- Every `/api/concept/analyze` call (prepended as `WORKSPACE CONTEXT` block)
- Every `/api/concept/reanalyze` call
- Every `/api/concept/chat` message (in the system prompt)
- Every `/api/concept/brief` generation

**Storage:** Stored on `users/{uid}` in Firestore as a `workspace` map field. Updated atomically with `setDoc + merge`.

**Setup nudge:** If workspace is empty, an amber nudge appears on the main dashboard with a link to the workspace settings page.

---

### 5.5 Analysis

**What it is:** The core AI processing step. A WhatsApp conversation is sent to Claude Sonnet 4.6 with workspace context, participant context, and account context. Claude returns a structured JSON analysis.

**Output fields:**

| Field | Type | Description |
|---|---|---|
| `accountName` | string | Inferred from conversation context |
| `healthScore` | integer 1–10 | 10 = healthy, 1 = critical |
| `riskLevel` | low / medium / high / critical | Categorical risk |
| `summary` | string | 2–3 sentence executive summary |
| `sentimentTrend` | improving / stable / declining | Direction of customer sentiment |
| `riskSignals` | array | Customer quotes flagged as churn or relationship risk, with severity and date |
| `productSignals` | array | Complaints, feature requests, praise, and confusion signals with JTBD `problemStatement` |
| `relationshipSignals` | array | Observations about tone, response frequency, formality changes |
| `competitorMentions` | string array | Competitor names detected in conversation |
| `recommendedAction` | object | What, who owns it, urgency (immediate / this_week / this_month) |
| `stats` | object | Message count, participant count, date range, languages detected |
| `analysisQuality` | object | Confidence level (high/medium/low), caveats, data gaps |
| `changesSince` | object | Present only after re-analysis. Delta summary, new risk count, resolved count, health delta. |

**Confidence rules:**
- `high`: 50+ messages, clear customer voice, multiple consistent signals
- `medium`: 20–49 messages OR ambiguous signals OR participant roles uncertain
- `low`: Under 20 messages OR mostly vendor-side messages OR very short date range

**Model:** `anthropic/claude-haiku-4.5` (via OpenRouter)  
**Temperature:** 0.2  
**Timeout:** 60 seconds (Vercel default)

---

### 5.6 Account dashboard

**What it is:** The main authenticated view showing all connected accounts and cross-account signal intelligence.

**Account cards (sorted by risk level: critical → high → medium → low):**
- Account name, risk badge, health score
- Top risk quote preview
- Message count, signal count, time since last analysis
- Industry context if set
- WhatsApp source indicator
- Delete with confirmation

**Summary row:**
- Total accounts, accounts needing attention (high/critical), cross-account patterns

**Workspace nudge:**
- Amber callout if workspace is unconfigured, linking to workspace settings

**Pattern panel (bottom):**
- Top 4 cross-account product signal clusters, capped to avoid information overload
- Each cluster shows type badge, title, problem statement, account count, and suggested action
- Link to full Signal Board for the complete view

---

### 5.7 Account detail

**What it is:** Full analysis view for a single account. The co-pilot layout places the analysis report on the left and the AI agent on the right (desktop), so the PM can read and ask questions simultaneously.

**Layout:**
- Desktop (xl+): 3/5 report + 2/5 sticky chat panel (co-pilot pattern)
- Mobile: stacked, report above chat

**Report sections:**
1. Analysis quality banner (collapsible) — confidence level, caveats, data gaps
2. Changes since banner — shown after re-analysis, with health delta
3. Health score card — score, risk level, summary, sentiment trend, stats
4. Recommended action — what, owner, urgency badge
5. Risk signals — quotes with severity, date, explanation, signal action controls
6. Product signals — type badge, title, priority, quote, suggested action, Generate brief button
7. Relationship signals — observation + implication
8. Competitor mentions

**Signal action controls:**  
On every risk and product signal: Open / In progress / Done / Dismissed + note field. Status persists to Firestore and is included in the next re-analysis prompt, closing the action→insight loop.

---

### 5.8 PM agent (chat co-pilot)

**What it is:** A persistent chat panel docked alongside the analysis report. Claude Haiku 4.5 acts as a PM co-pilot with full account context, workspace knowledge, and conversation history.

**Panel design:**
- Sticky right column (xl+), stacked below report on mobile
- Header shows signal counts and health score so the PM knows what the agent has read
- Context pill in the empty state ("I've read the full conversation for [account name]. X risk signals flagged.")
- Dynamic suggested prompts generated from account state
- Full-width AI message bubbles with animated thinking dots during generation
- Follow-up suggestions after each response (never static, generated from conversation context)
- Input contained in a focus-ring box with keyboard shortcut (⌘+Enter)

**Agentic behaviour:**
- Asks ONE clarifying question when it needs context before answering
- Applies JTBD framing to product discussions
- Factors contract tier and renewal timing into urgency assessments
- Acknowledges data limitations explicitly
- Surfaces concerns the PM didn't ask about when they're material
- Updates reasoning when the user provides new context
- Writes full PM artifacts on demand: Jira tickets, CS emails, battle cards, meeting agendas

**Dynamic starter prompts (examples by account state):**
- High/critical risk → "Account is critical — what do I do in the next 24 hours?"
- Top risk quote → `Help me respond to: "[quote]"`
- Competitor mention → "[Competitor] was mentioned — how do I handle it?"
- Renewal month set → "Renewal is [month] — write me a prep plan"
- Declining sentiment → "Sentiment is declining — what should CS say to turn it around?"

**Follow-up suggestions:**
Generated after each AI response from conversation context. Examples:
- If renewal discussed → "Draft the renewal prep email"
- If a ticket was mentioned → "Format this as a Jira ticket"
- If churn risk discussed → "What's the strongest argument to prevent churn here?"
- If a competitor named → "Write a battle card against [name]"

**Known limitation:** Chat history is in-memory only. Lost on page reload. Persisting to Firestore is on the near-term roadmap.

**Model:** `anthropic/claude-haiku-4.5`  
**Temperature:** 0.3  
**Streaming:** SSE, tokens forwarded directly to client

---

### 5.9 Feature brief generator

**What it is:** A slide-over panel that generates a structured PM feature brief from a product signal. Only available on signals of type `complaint` or `feature_request` with `medium` or `high` priority.

**Context step (before generation):**
1. **Is this already on your roadmap?** — Not on roadmap / Already planned / Similar thing planned / Not sure
2. **Additional context** — Free text (e.g. "tried this in Q3 but didn't ship", "blocking 2 enterprise deals")

**Brief structure (markdown output):**
1. Problem (JTBD framing — what job is the customer trying to get done?)
2. Customer evidence (verbatim quote)
3. What we know vs. what we're assuming vs. what we don't know yet
4. Gap analysis OR Validation before building (based on roadmap status)
5. Proposed solution (specific, scoped)
6. Acceptance criteria (testable checkboxes)
7. Priority rationale (accounts for risk level, renewal timing, competitive pressure)

**Actions:** Copy to clipboard, Regenerate, Change context

**Model:** `anthropic/claude-sonnet-4.6`  
**Temperature:** 0.2  
**Streaming:** SSE

---

### 5.10 Re-analysis

**What it is:** Update an existing account analysis with new WhatsApp messages.

**Flow:**
1. User clicks "Update →" on the account page
2. Uploads a newer WhatsApp export (.txt or .zip)
3. Nectic compares participant list against saved roles
4. If all participants are recognised: proceed immediately
5. If new participants appear: labelling step for new participants only
6. Sends prior analysis JSON + new conversation + signal actions + workspace context to Claude
7. Account updated in Firestore with new result and `updatedAt` timestamp
8. `changesSince` banner appears at the top of the page

**`changesSince` fields:**
- `summary` — 1–2 sentence description of what changed
- `newRiskSignals` — count of new risk signals not in the previous analysis
- `resolvedSignals` — count of issues that appear resolved
- `healthDelta` — integer (positive = improved, negative = declined, 0 = stable)

**Signal action feedback:** Signal actions (what the PM has marked as done/in-progress) are included in the re-analysis prompt. Claude knows which issues have been actioned and adjusts its delta assessment accordingly.

**Model:** `anthropic/claude-haiku-4.5`

---

### 5.11 Signal board

**What it is:** Cross-account triage view showing all open and in-progress signals across every connected account.

**Filtering:** All / Needs action (open) / In progress / Done

**Per signal:**
- Account name, risk level badge, signal category (risk / product), type, title, quote
- Priority badge
- Signal action control (same Open/In progress/Done/Dismissed as account detail)
- Note field

**Behaviour:** Signal status changes on the board update Firestore and are immediately reflected in the account detail view (and vice versa). The board syncs on initial load.

**Purpose:** "Which signals across all my accounts need my attention right now?" without clicking into individual accounts.

---

### 5.12 Re-analysis with context

**What it is:** Lightweight update path when the PM has new non-WhatsApp context to add (e.g. a customer call summary, a support ticket, internal background). No new WhatsApp export required.

**Flow:** On the account detail page, the PM enters free text supplemental context in the quality banner's "Missing context" field. On "Re-analyse now", this context is added to the re-analysis prompt alongside the existing conversation.

**Use case:** "I talked to the customer on a call yesterday and they mentioned contract value is $120k/year. Re-analyse with this."

---

### 5.13 Shareable read-only link

**What it is:** A public, no-auth link to a read-only view of an account analysis.

**Behaviour:**
- Each account is assigned a `shareToken` (UUID) at creation time
- Share link format: `/concept/shared/[token]`
- Anyone with the link can view the full analysis report (no login required)
- The shared view includes all analysis sections and the changes-since banner
- The shared view does NOT include the PM agent chat or brief generator (these require auth)
- Deleting an account also removes the `sharedAccounts` record, making the link 404

---

### 5.14 Analysis quality transparency

**What it is:** A collapsible banner surfacing Nectic's own uncertainty about the analysis.

**Confidence levels:**

| Level | Colour | Trigger |
|---|---|---|
| High | Green | 50+ messages, clear customer voice, consistent signals |
| Medium | Neutral grey | 20–49 messages, or ambiguous signals, or uncertain roles |
| Low | Amber | Under 20 messages, mostly vendor voice, or very short date range |

**Sections when expanded:**
- **Things to be aware of** — Specific caveats generated by Claude
- **Missing context** — Data gaps Claude identified + free-text field for supplemental context

**Effect on chat:** When confidence is `low`, the chat system prompt includes an explicit warning instructing the agent to surface uncertainty rather than presenting thin data as confident analysis.

---

### 5.15 Cross-account signal clustering

**What it is:** Aggregation logic grouping product signals across all accounts by their underlying problem.

**How it works:**
- Each product signal has a `problemStatement` field — the underlying customer job, not the surface feature request
- `aggregateSignals()` groups signals by `problemStatement` (case-insensitive, normalised)
- Signals appearing in multiple accounts are surfaced as cross-account patterns
- Sort order: account count descending, then priority

**Purpose:** "Is this a one-account problem or a market problem?" without manual cross-referencing.

---

## 6. Data model

### Firestore collections

```
users/{uid}/
  accounts/{accountId}          — StoredAccount document
  (workspace stored on users/{uid} document directly)

sharedAccounts/{shareToken}     — Share lookup (top-level, no auth)
earlyAccess/{docId}             — Early access submissions (public write)
```

### StoredAccount

```typescript
interface StoredAccount {
  id: string                          // Firestore document ID
  fileName: string                    // Original export filename
  analyzedAt: string                  // ISO 8601 timestamp of first analysis
  updatedAt?: string                  // ISO 8601 timestamp of last re-analysis
  result: AnalysisResult              // Full Claude analysis output
  participantRoles: ParticipantRoles  // Record<name, "vendor"|"customer"|"partner"|"other">
  context: AccountContext             // { industry?, contractTier?, renewalMonth? }
  supplementalContext?: string        // Free-text PM-added context
  signalActions?: Record<string, SignalAction>  // Per-signal status and notes
  shareToken: string                  // UUID for /concept/shared/[token]
  _createdAt: Timestamp               // Firestore server timestamp
  _updatedAt?: Timestamp              // Set on every updateAccount call
}
```

### SignalAction

```typescript
interface SignalAction {
  status: "open" | "in_progress" | "done" | "dismissed"
  note?: string
  updatedAt: string  // ISO 8601
}
```

Signal keys use the pattern: `{type}-{explanation.toLowerCase().slice(0, 80).replace(/[^a-z0-9]+/g, '-')}`.

### WorkspaceContext (on users/{uid})

```typescript
interface WorkspaceContext {
  productDescription?: string  // What your product does
  featureAreas?: string        // Comma-separated core modules
  roadmapFocus?: string        // Active Q roadmap items
  knownIssues?: string         // Known bugs/limitations
  updatedAt?: string           // ISO 8601
}
```

---

## 7. AI pipeline

### Model allocation

| Route | Model | Rationale |
|---|---|---|
| `/api/concept/analyze` | `anthropic/claude-haiku-4.5` | Fast, multilingual, strong structured JSON at low latency |
| `/api/concept/reanalyze` | `anthropic/claude-haiku-4.5` | Same; comparative reasoning works well at this model level |
| `/api/concept/brief` | `anthropic/claude-sonnet-4.6` | JTBD framing, assumption decomposition, and PM writing quality warrant the larger model |
| `/api/concept/chat` | `anthropic/claude-haiku-4.5` | Streaming latency is user-visible; Haiku 4.5 is near-frontier quality at significantly lower latency |
| `/api/concept/classify-participants` | `anthropic/claude-haiku-4.5` | Lightweight classification task |

All models accessed via **OpenRouter** (`openrouter.ai/api/v1/chat/completions`).

### Workspace context injection

Every AI call receives a `WORKSPACE CONTEXT` block if the user has configured their workspace:

```
WORKSPACE CONTEXT:
Product: [productDescription]
Feature areas: [featureAreas]
Roadmap this quarter: [roadmapFocus]
Known issues: [knownIssues]
```

This block is prepended before participant roles and conversation content. It grounds all signal extraction, chat responses, and brief generation in the company's actual product context.

### Prompt design principles

- **Workspace context first** — Claude sees company/product context before the conversation, preventing misaligned signal extraction
- **Participant block second** — Claude sees who is vendor, customer, partner before the conversation, preventing misattribution
- **Explicit JSON schema in prompt** — Full schema with field descriptions and valid enum values reduces hallucination on structure
- **Confidence rules in prompt** — Explicitly defines criteria for each confidence level; without this, Claude defaults to `high`
- **JTBD framing instruction** — The `problemStatement` field is explicitly described as "the underlying customer problem, not the feature request itself" to force JTBD reasoning at extraction time
- **Signal actions block in re-analysis** — Re-analysis prompt includes a block describing what the PM has already actioned, so Claude doesn't re-surface resolved issues as new

---

## 8. API reference

### POST /api/concept/analyze

**Request body**
```json
{
  "conversation": "string",
  "messageCount": "number (optional)",
  "participants": "number (optional)",
  "participantRoles": { "Name": "vendor | customer | partner | other" },
  "context": { "industry": "string", "contractTier": "string", "renewalMonth": "YYYY-MM" },
  "workspace": { "productDescription": "string", "featureAreas": "string", "roadmapFocus": "string", "knownIssues": "string" }
}
```

**Response:** `{ "result": AnalysisResult }`

---

### POST /api/concept/reanalyze

**Request body**
```json
{
  "priorAnalysis": "AnalysisResult",
  "conversation": "string (optional, new messages)",
  "participantRoles": "ParticipantRoles",
  "supplementalContext": "string (optional)",
  "signalActions": "Record<string, SignalAction> (optional)",
  "workspace": "WorkspaceContext (optional)"
}
```

**Response:** `{ "result": AnalysisResult }` — includes `changesSince` field.

---

### POST /api/concept/chat

**Request body**
```json
{
  "analysis": "AnalysisResult",
  "messages": "[{ role, content }]",
  "question": "string",
  "accountMeta": { "industry": "string", "contractTier": "string", "renewalMonth": "string", "vendorTeam": "string[]", "customerTeam": "string[]" },
  "workspace": "WorkspaceContext (optional)"
}
```

**Response:** `text/plain` SSE stream.

---

### POST /api/concept/brief

**Request body**
```json
{
  "signal": { "type": "string", "title": "string", "problemStatement": "string", "quote": "string", "priority": "string", "pmAction": "string" },
  "accountName": "string",
  "accountSummary": "string",
  "roadmapStatus": "new | planned | partial | unknown",
  "additionalContext": "string (optional)",
  "workspace": "WorkspaceContext (optional)"
}
```

**Response:** `text/plain` SSE stream. Markdown brief content.

---

### POST /api/concept/classify-participants

**Request body**
```json
{
  "participants": [{ "name": "string", "sampleMessages": "string[]" }]
}
```

**Response:** `{ "roles": { "Name": "vendor | customer | partner | other" } }`

---

## 9. Business model

### Target pricing (to validate)

| Tier | Price | Limits | Rationale |
|---|---|---|---|
| Free | $0/mo | 3 accounts, no brief generator | Acquisition, let PMs prove value before asking for budget |
| Solo | $49/mo | 20 accounts, all features | Individual PM or CS lead at an early-stage startup |
| Team | $149/mo | Unlimited accounts, up to 5 seats | Small product + CS team at a Series A company |
| Growth | $349/mo | Unlimited accounts, unlimited seats, priority support | Scaling teams, multiple product lines |

**Annual discount:** 20% (standard SaaS; improves cash flow and retention)

### Revenue model rationale

- **Usage-based** (per analysis or per account) was considered but rejected: it creates friction at the point of most value (connecting a new account). Flat-rate subscription removes this friction.
- **Per-seat** was considered but rejected as primary metric: Nectic's value is per-account, not per-user. A PM with 50 accounts generates more value than one with 5, regardless of how many colleagues use it.
- **Hybrid:** Plan limits by account count, team tier enables collaboration.

### GTM strategy

**Phase 1 — Direct outreach (now):**
- Target PMs and founders at Indonesian B2B SaaS companies (HR Tech, Fintech, Logistics)
- Use personal networks and Antler/YC alumni networks
- Offer 3-month free access to first 10 companies in exchange for weekly feedback calls
- Goal: 5 companies using Nectic weekly within 60 days

**Phase 2 — Product-led growth (after product-market fit):**
- Shared analysis links drive organic acquisition (recipient sees value, wants access)
- Team accounts enable viral within-company spread (PM invites CS manager)
- Weekly email digests keep the product top-of-mind without requiring daily logins

**Phase 3 — Channel partnership:**
- Partner with Indonesian SaaS investor networks, accelerators, and B2B SaaS consultants
- Target Antler, Sequoia India, East Ventures portfolio companies

### What needs to be built before charging

1. Stripe billing integration with plan limits enforcement
2. Team accounts (seat management)
3. Email digests (proactive value delivery without login)
4. Account rename (table stakes for production use)
5. Chat history persistence (core retention mechanism)

---

## 10. Competitive landscape

### Direct competitors

None confirmed as of March 2026 operating specifically in the WhatsApp-native SEA B2B SaaS segment.

### Adjacent competitors

| Tool | What they do | Why Nectic is different |
|---|---|---|
| Gong / Chorus | Conversation intelligence for sales calls (Zoom, Teams) | Requires recorded calls. Doesn't work with WhatsApp. Priced for enterprise. |
| ClosedLoop | B2B customer intelligence | Enterprise pricing, English-first, CRM-integrated. Not WhatsApp-native. |
| Productboard / Coda | Feedback aggregation and roadmap management | Requires a structured feedback pipeline that most SEA B2B SaaS companies don't have. |
| Intercom / Zendesk | Support ticketing and customer messaging | Web-first. WhatsApp integration exists but is basic. No AI signal extraction. |
| UserVoice / Pendo | Product analytics and user feedback | Requires SDK instrumentation. Doesn't capture relationship dynamics or churn risk from unstructured conversation. |

### Nectic's defensible moat (in order of defensibility)

1. **WhatsApp Business API integration** (not yet built) — the hardest to copy because it requires WhatsApp approval and technical partnership. Once built, this becomes the primary acquisition and retention mechanism.
2. **Workspace context + signal history** — the longer a team uses Nectic, the more context it accumulates about their product, their customers, and their decisions. A new entrant starts at zero.
3. **Signal action feedback loop** — actions taken by the PM feed back into re-analysis. Nectic improves with use. This creates a learning curve that benefits long-term customers.
4. **Bahasa Indonesia + English multilingual quality** — Claude Sonnet 4.6 has stronger Bahasa handling than competing models; combined with SEA-specific market context in prompts, output quality is meaningfully better than generic LLM wrappers.
5. **File-parsing privacy model** — WhatsApp exports never leave the browser. This is a trust advantage that enterprise customers will pay for.

---

## 11. Infrastructure and security

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js API routes (Edge/Node runtime) |
| Auth | Firebase Authentication (email/password, Google) |
| Database | Cloud Firestore |
| AI | Anthropic Claude via OpenRouter |
| File parsing | Client-side (JSZip + custom parser) |
| Deployment | Vercel |

### Security model

**File privacy:** WhatsApp exports are parsed entirely in the browser. The raw file is never sent to Nectic's servers. Only the formatted conversation text is sent to the analysis API.

**Data isolation:** All account data is stored under `users/{uid}/accounts/{id}`. Firestore rules enforce that only the authenticated owner can read or write their accounts.

**Shared links:** Share tokens are UUIDs (128-bit random). The `sharedAccounts` collection stores only `{ uid, accountId }` — no conversation data. The shared page fetches the analysis from the owner's collection using the resolved IDs.

**API keys:** OpenRouter API key is server-side only (`OPENROUTER_API_KEY`). Never exposed to the client.

### Firestore security rules

```
users/{uid}                    read/write: auth.uid == uid
users/{uid}/accounts/{id}      read/write: auth.uid == uid
sharedAccounts/{token}         read: public; create/delete: auth required
earlyAccess/{docId}            create: public; read: auth required
```

### Known security gaps (to address)

1. **No rate limiting** on API routes. A user could trigger hundreds of Claude calls. Fix: middleware-level rate limiting by IP and UID.
2. **No Content Security Policy headers.** Fix: configure `next.config.js` security headers.
3. **No audit logging.** Shared link access is not tracked. For enterprise customers, this matters.
4. **Broad `users/{uid}` document write permission** allows overwriting workspace context without field-level constraints. Acceptable at current scale; tighten before enterprise.
5. **No input sanitisation** beyond TypeScript type checking on API route inputs.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Server-side. Used by all AI routes. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase client config |

---

## 12. Legal and compliance

### Indonesia UU PDP (Personal Data Protection Law)

UU PDP (UU No. 27/2022) came into effect October 2024. Key obligations for Nectic:

**What is personal data in Nectic's context:**
- WhatsApp participant names and phone numbers (visible in exports)
- Message content that identifies individuals
- Account names and company names if they identify natural persons

**Current compliance measures:**
- Explicit consent checkbox before file upload and analysis
- Privacy policy page at `/privacy` covering data usage, third-party processors (Anthropic via OpenRouter), storage (Firebase/Google), and user rights
- Data isolation: all customer data scoped to authenticated user's Firestore namespace
- Client-side parsing: raw exports never stored on Nectic servers

**Gaps to address:**
1. **Right to erasure UI** — Users cannot delete their own account or all data via the product. There is a delete-account button per stored account, but no "delete all my data" mechanism. Required by UU PDP and GDPR.
2. **Data retention policy** — No defined retention period. Analyses are stored indefinitely. Define and document (suggested: 2 years, or until user deletes).
3. **Third-party data subject consent** — Participants in WhatsApp groups whose data is analysed have not consented to that analysis. This is a grey area requiring legal counsel. Current mitigation: consent checkbox informs the uploader of their responsibility for lawful processing.
4. **Data Processing Agreement (DPA)** — When Nectic is used by B2B customers, Nectic acts as a data processor. A formal DPA template is required before enterprise sales.

### WhatsApp Terms of Service

WhatsApp's Terms of Service prohibit automated collection of data and the use of WhatsApp for commercial purposes without WhatsApp Business API. Key considerations:

- Nectic's current model (manual export, user-initiated) is in a grey area. The user is exporting their own conversations for their own purposes. This is analogous to a user exporting their own email for analysis.
- **Risk:** WhatsApp could change ToS or enforce against this use pattern.
- **Mitigation:** WhatsApp Business API integration (planned) removes this risk entirely and is the correct long-term architecture.
- **Current status:** No cease-and-desist risk identified for the manual-export MVP. Monitor WhatsApp Business ToS closely.

### GDPR (Singapore + international customers)

Singapore's PDPA (Personal Data Protection Act) is GDPR-adjacent. For customers in Singapore or EU:
- The privacy policy covers the key obligations
- A formal DPA template will be required for B2B customers
- Cross-border data transfer (to US-based OpenRouter/Anthropic) should be documented

### Required actions before enterprise sales

- [ ] Add "Delete all my data" account closure flow
- [ ] Define and publish data retention policy (suggest 2 years)
- [ ] Create Data Processing Agreement template
- [ ] Legal counsel review of WhatsApp ToS analysis use case
- [ ] Security headers (CSP, HSTS, X-Frame-Options) in next.config.js

---

## 13. Known limitations and technical debt

### Data

| Limitation | Impact | Mitigation plan |
|---|---|---|
| 250-message cap per analysis | Active accounts lose early context | Increase Vercel timeout limit (Pro plan) and raise cap to 500+; or implement chunked streaming analysis |
| Analysis based on a single export snapshot | Signals may be stale | Re-analysis flow. Signal dates shown. WhatsApp API integration (removes this entirely). |
| Parser may misparse unusual export formats | Some messages dropped or garbled | Handles 3 timestamp formats and common Unicode artefacts. Warn-and-continue model. |
| Account name inferred by Claude | May be wrong or generic | Account rename feature (near-term roadmap) |

### AI

| Limitation | Impact | Mitigation plan |
|---|---|---|
| No signal feedback loop | Analysis quality cannot improve with use | "Mark as incorrect" signal feedback → fine-tuning data pipeline (medium-term) |
| JSON extraction may fail on unusual conversations | Analysis errors | Regex-based JSON extraction with fallback. Error returned to UI. |
| Bahasa Indonesia code-switching | Signal nuance may be lost | Claude Sonnet 4.6 has strongest multilingual Bahasa performance of tested models |
| Brief quality depends on signal quality | Weak signals produce weak briefs | Brief only available on complaint/feature_request with medium/high priority |

### Product

| Limitation | Impact | Mitigation plan |
|---|---|---|
| No direct WhatsApp Business API integration | Manual export required; highest friction point | WhatsApp Business API integration (medium-term; requires WhatsApp approval) |
| Chat history lost on page reload | Breaks agentic continuity | Persist to Firestore per-account (near-term) |
| No proactive alerts | PM must remember to log in | Email digest + risk alert on health decline (near-term) |
| No team accounts | Blocks B2B collaboration and viral growth | Multi-user workspace with role-based access (medium-term) |
| No billing or plan limits | Cannot generate revenue | Stripe integration with per-plan account limits (next sprint) |
| No error monitoring | Bugs invisible until user-reported | Sentry integration (next sprint) |
| No product analytics | Flying blind on usage | PostHog or equivalent (next sprint) |

---

## 14. Roadmap and priorities

### Immediate (next 2 weeks) — "Make it a real product"

These are blocking revenue and VC conversations.

- [ ] **Stripe billing integration** — Pricing page, checkout, plan limits enforcement in API middleware
- [ ] **Account rename** — User-editable account name override
- [ ] **Chat history persistence** — Firestore per-account, keyed by uid + accountId
- [ ] **Error monitoring** — Sentry integration
- [ ] **Product analytics** — PostHog event tracking (analysis runs, chat messages, brief generations, signal actions)
- [ ] **Security headers** — CSP, HSTS, X-Frame-Options in next.config.js
- [ ] **Rate limiting** — API middleware per-UID and per-IP for AI routes

### Near-term (next 4 weeks) — "Make it sticky"

These drive retention and proactive value.

- [ ] **Email digest** — Weekly brief to PM's inbox: health scores, open signals, cross-account patterns. No login required to read value.
- [ ] **Risk alert** — Email notification when re-analysis reveals health delta ≤ -2 or new critical signal
- [ ] **Workspace onboarding nudge** — Guided setup during first login: "Set up your workspace to get 3x better analysis"
- [ ] **Signal feedback** — "Was this signal accurate?" thumbs up/down on each signal. Stored for fine-tuning data pipeline.
- [ ] **Increase message cap** — Move to Vercel Pro for 5-minute timeout; raise cap to 500 (or 750 with chunked processing)
- [ ] **"Delete all my data"** — Full account closure flow for UU PDP compliance

### Medium-term (2–3 months) — "Build the moat"

These create defensibility and enterprise readiness.

- [ ] **Team accounts** — Multiple users on one workspace. PM invites CS manager. Role-based access (admin/member/viewer).
- [ ] **WhatsApp Business API integration** — Direct account group connection without manual export. Biggest friction removal and moat builder.
- [ ] **Signal feedback → model improvement** — Aggregate signal feedback to improve prompts and, eventually, fine-tune a domain-specific model
- [ ] **Jira / Linear integration** — Publish generated briefs directly as tickets
- [ ] **CRM sync** — Push signals to HubSpot or Salesforce as contact notes or activities
- [ ] **Data Processing Agreement template** — Required for B2B enterprise sales

### Longer-term — "Expand the surface"

- [ ] Zoom / Google Meet transcript ingestion
- [ ] Cohort view — segment accounts by industry, tier, or risk level for portfolio-level analysis
- [ ] Forecast model — predict churn probability 30/60/90 days out based on signal trajectory
- [ ] Slack / Teams integration — post risk alerts and weekly digests to a channel
- [ ] Mobile app — iOS/Android for CS managers doing account reviews in the field

---

## 15. Success metrics

### North Star

**Weekly analysed accounts per active user** — measures whether Nectic is actually embedded in the PM's weekly workflow, not just used once.

### Activation

| Metric | Target (month 1) | Notes |
|---|---|---|
| Accounts connected per new user in first session | ≥ 2 | One account = curiosity; two = habit formation begins |
| Workspace configured within 7 days of signup | ≥ 60% | Workspace quality strongly correlates with analysis usefulness |
| Chat messages sent per account detail view | ≥ 1.5 | Agent is being used, not just the static report |

### Retention

| Metric | Target | Notes |
|---|---|---|
| Day-7 retention | ≥ 40% | PM came back to update or review at least one account |
| Week-4 retention | ≥ 25% | Product is in their weekly workflow |
| Re-analyses per account per month | ≥ 1.5 | Account is being maintained, not just created |
| Signal actions taken per session | ≥ 3 | PM is using Nectic to manage their response queue |

### Revenue

| Metric | Target (month 3) | Notes |
|---|---|---|
| Paying customers | ≥ 5 | Proof of willingness to pay |
| MRR | ≥ $500 | Early commercial validation |
| NPS | ≥ 40 | Signal on product-market fit |

### Quality

| Metric | Target | Notes |
|---|---|---|
| Signal accuracy (user-rated) | ≥ 80% thumbs up | Once signal feedback is live |
| Brief generation satisfaction | ≥ 4/5 | Post-generation survey |
| Analysis completion rate | ≥ 90% | Analyses that return a valid result vs. timeout or error |

---

*This document is the source of truth for Nectic's product state. Update it when a feature ships, a decision changes, or a gap is discovered — not after a review cycle.*
