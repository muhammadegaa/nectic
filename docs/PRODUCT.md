# Nectic — Product Documentation

**Last updated:** February 2026  
**Status:** Early access  
**Version:** MVP

---

## Table of contents

1. [What Nectic is](#1-what-nectic-is)
2. [Who it is for](#2-who-it-is-for)
3. [Product principles](#3-product-principles)
4. [Feature inventory](#4-feature-inventory)
5. [Data model](#5-data-model)
6. [AI pipeline](#6-ai-pipeline)
7. [API reference](#7-api-reference)
8. [Infrastructure and security](#8-infrastructure-and-security)
9. [Known limitations](#9-known-limitations)
10. [Roadmap](#10-roadmap)

---

## 1. What Nectic is

Nectic is an AI product intelligence tool for B2B SaaS teams operating in WhatsApp-first markets — primarily Southeast Asia, MENA, and LATAM.

It reads WhatsApp account groups, extracts customer signals (churn risk, product pain points, feature requests, relationship health), and gives product managers and CS teams a structured, always-current view of what customers actually said — not what sales decided to pass on.

### The core problem

In B2B SaaS companies operating in Southeast Asia, WhatsApp is the primary channel for sales, customer success, support, and product feedback. It functions simultaneously as CRM, helpdesk, sales pipeline, and product discovery. Customer conversations happen in group chats that include sales reps, CS managers, implementation partners, and end users.

PMs receive a filtered, summarised, often delayed version of what customers say. Sales reps decide what to escalate. Important signals get lost, misrepresented, or deprioritised. Product roadmaps end up reflecting what sales found easy to communicate, not what customers actually need.

### The thesis

> WhatsApp IS the CRM, the support desk, the sales pipeline, and the product feedback loop. The PM who reads every conversation knows more than the PM who waits for a standup summary.

Nectic automates the reading. Then it reasons about it.

### Positioning

Nectic targets the gap that enterprise conversation intelligence tools (e.g. ClosedLoop) ignore: companies at **Product Discovery Maturity Level 0–1** that operate entirely in WhatsApp and have no existing structured feedback pipeline. These companies cannot adopt enterprise tooling because their conversations don't happen in Slack, Salesforce, or Zoom. Nectic meets them where they are.

---

## 2. Who it is for

### Primary users

| Role | Job to be done | How Nectic helps |
|---|---|---|
| Product Manager | Understand what customers need without attending every customer call or relying on secondhand sales summaries | Weekly signal brief, cross-account clustering, AI chat for deep-dive |
| Customer Success Manager | Know which accounts are at risk before the customer says so explicitly | Risk signals, health score, relationship signal tracking |
| Founder / CEO | Maintain customer proximity as the team grows | Single dashboard view across all accounts |

### Secondary users (share recipients)

Teammates who receive a shared analysis link can read the full account report without a Nectic account.

### Target market (early access)

- B2B SaaS companies in Southeast Asia (Indonesia, Malaysia, Philippines, Singapore, Vietnam)
- 5–100 person teams
- WhatsApp Business as primary customer communication channel
- Bahasa Indonesia and/or English-speaking teams

---

## 3. Product principles

**1. Signal, not noise.** Every output must be grounded in an actual customer quote. Nectic never generates insight that isn't traceable to something a customer said.

**2. Agentic, not static.** Nectic doesn't just describe what's in the data. It reasons about it, asks for context when it's missing, and adapts its outputs based on what it learns.

**3. Honest about uncertainty.** When Nectic doesn't have enough data to be confident, it says so explicitly. Low-message-count analyses carry a visible confidence warning.

**4. Respect the customer voice.** All signals are attributed to the customer side of a conversation, not the vendor. Participant labelling ensures Nectic knows whose voice is whose.

**5. No feature factory.** Every feature exists because it removes a specific pain in the PM or CS workflow. Features are not added because they are technically interesting.

---

## 4. Feature inventory

### 4.1 Connect flow

**What it is:** A multi-stage guided flow for connecting a new WhatsApp account group to Nectic.

**Stages:**

| Stage | Description |
|---|---|
| Instructions | Step-by-step export guide for iOS and Android. Explains the "Without media" requirement. |
| Upload | Drag-and-drop zone accepting `.txt` (plain export) and `.zip` (folder export). Both are parsed client-side — the file never leaves the browser before analysis. |
| Ready | Three-panel review screen: parsed stats, participant labelling, and optional account context. |
| Analyzing | Progress screen with animated steps. Model and estimated time shown. |
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

**Maximum message cap:** 500 messages. If the export exceeds this, the most recent 500 are used and a truncation warning is shown.

---

### 4.2 Participant labelling

**What it is:** Per-participant role assignment before analysis runs. Ensures Claude attributes signals to the correct party.

**Roles:**

| Role | Meaning | Prompt treatment |
|---|---|---|
| `vendor` | Your company's team members | Excluded from risk/product signal attribution |
| `customer` | Customer-side participants | Primary source for all signals |
| `partner` | Resellers, implementation partners | Secondary signal source |
| `other` | Unknown participants | Passed to Claude as context, not attributed |

**Behaviour:**
- On first connect: all participants default to `other`, user labels each via dropdown
- On re-analysis: roles are pre-filled from the saved account. Only new/unknown participants need labelling. If all participants are recognised, a "all recognised" confirmation is shown and labelling is skipped.
- Roles are stored on the account and used for all future analyses

**Design rationale:** The binary vendor/customer model breaks with multi-party chats (reseller + vendor + customer, or multiple customer contacts). Four roles covers all real-world cases seen in SEA B2B contexts.

---

### 4.3 Account context

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

### 4.4 Analysis

**What it is:** The core AI processing step. A WhatsApp conversation is sent to Claude Sonnet 4.6 with participant context and account context. Claude returns a structured JSON analysis.

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

**Model:** `anthropic/claude-sonnet-4.6`  
**Temperature:** 0.2 (low to ensure consistent structured output)  
**Timeout:** 60 seconds

---

### 4.5 Account dashboard

**What it is:** The main authenticated view showing all connected accounts and cross-account signal intelligence.

**Left panel — Account cards:**
- Account name, risk badge, health score
- Top risk quote preview
- Message count, signal count, time since last analysis
- Industry context if set
- WhatsApp source indicator
- Delete with confirmation

**Right panel — Product signals (cross-account):**
- All product signals aggregated across accounts
- Grouped by `problemStatement` (semantic problem, not surface-level title)
- Accounts reporting the same underlying problem are clustered
- Sorted by account count descending, then priority
- "X accounts" badge on signals appearing in more than one account
- PM action shown for each cluster

**Summary stats:**
- Total accounts connected
- Accounts at high/critical risk (highlighted in red when > 0)
- Cross-account signal count (highlighted in blue when > 0)

---

### 4.6 Account detail

**What it is:** The full analysis view for a single account. Contains the complete report, the PM agent chat, and the brief generator.

**Sections:**
1. Analysis quality banner (collapsible) — confidence level, caveats, data gaps
2. Changes since banner — shown after re-analysis, with health delta
3. Health score card — score, risk level, summary, sentiment trend, stats
4. Recommended action — what, owner, urgency badge
5. Risk signals — quotes with severity, date, explanation
6. Product signals — type badge, title, priority, quote, PM action, Generate brief button
7. Relationship signals — observation + implication
8. Competitor mentions
9. Back link and file metadata

---

### 4.7 PM agent chat

**What it is:** A persistent chat panel docked to the bottom of the account detail page. Claude Haiku 4.5 acts as a PM co-pilot with full account context.

**Agentic behaviour:**
- Asks ONE clarifying question when it needs context before answering (e.g. "Is this account on trial or paid?")
- Applies JTBD framing to product discussions ("The feature request is a solution proposal — what job are they actually trying to get done?")
- Factors contract tier and renewal timing into urgency assessments
- Acknowledges data limitations explicitly ("I'm working with 18 messages — that's thin")
- Surfaces things the user hasn't asked about when they're important
- Updates its reasoning when the user provides new context ("That changes things — if X is resolved...")
- Writes full PM artifacts when asked: Jira tickets, emails, battle cards, meeting agendas, CS talking points

**Dynamic starter prompts:**
Generated from the actual account data, not static. Examples based on account state:
- High/critical risk → "Account is critical — what do I do in the next 24 hours?"
- Top risk quote → `Help me respond to: "[quote]"`
- Competitor mention → "[Competitor] was mentioned — how do I handle it?"
- Renewal month set → "Renewal is [month] — write me a prep plan"
- Declining sentiment → "Sentiment is declining — what should CS say to turn it around?"

**Follow-up suggestion chips:**
After each AI response, 2 contextual follow-up prompts appear based on what was just discussed. Examples:
- If renewal was discussed → "Draft the renewal prep email"
- If a ticket was mentioned → "Format this as a Jira ticket"
- If churn risk was discussed → "What's the strongest argument to prevent churn?"
- If a competitor was named → "Write a battle card against [name]"

Chips regenerate every turn. They are never static.

**Context passed to model:**
- Full `AnalysisResult` JSON
- Account meta: industry, contract tier, renewal month, vendor team names, customer team names
- Full conversation history (all prior turns)
- Analysis quality confidence level (low confidence triggers an explicit warning in the system prompt)

**Model:** `anthropic/claude-haiku-4.5`  
**Temperature:** 0.3  
**Streaming:** SSE, tokens forwarded directly to client

---

### 4.8 Feature brief generator

**What it is:** A slide-over panel that generates a structured PM feature brief from a product signal. Only available on signals of type `complaint` or `feature_request` with `medium` or `high` priority.

**Context step (before generation):**
The user is asked two questions before the brief is written:
1. **Is this already on your roadmap?** — Four options: Not on roadmap / Already planned / Similar thing planned / Not sure
2. **Additional context** — Free text. Examples: "tried this in Q3 but didn't ship", "blocking 2 enterprise deals", "design already exists"

The brief prompt adapts based on roadmap status:
- `new` — Includes a JTBD problem framing and validation checklist (what to confirm before building)
- `planned` — Focuses on implementation scope and closing the gap between plan and customer need
- `partial` — Highlights what the current plan may miss based on the signal
- `unknown` — Includes both validation steps and initial implementation scope

**Brief structure (markdown output):**
1. Problem (JTBD framing — what job is the customer trying to get done?)
2. Customer evidence (verbatim quote)
3. What we know vs. what we're assuming vs. what we don't know yet
4. Gap analysis (if planned/partial) OR Validation before building (if new/unknown)
5. Proposed solution (specific, scoped)
6. Acceptance criteria (testable checkboxes)
7. Priority rationale (accounts for risk level, renewal timing, competitive pressure)

**Actions:** Copy to clipboard, Regenerate, Change context (returns to context step)

**Model:** `anthropic/claude-sonnet-4.6`  
**Temperature:** 0.2  
**Streaming:** SSE

---

### 4.9 Re-analysis

**What it is:** Update an existing account analysis with new WhatsApp messages. Claude compares the new conversation against the prior analysis and produces an updated result with a `changesSince` delta.

**Flow:**
1. User clicks "Update →" on the account page
2. Uploads a newer WhatsApp export (.txt or .zip)
3. Nectic parses the file and compares participant list against saved roles
4. If all participants are recognised: "All N participants recognised" — proceed immediately
5. If new participants appear: labelling step shown for new participants only, existing roles pre-filled
6. On confirmation: sends prior analysis JSON + new conversation to Claude Sonnet 4.6
7. Account is updated in Firestore with new result and `updatedAt` timestamp
8. `changesSince` banner appears at the top of the account detail page

**`changesSince` fields:**
- `summary` — 1–2 sentence description of what changed
- `newRiskSignals` — count of new risk signals not in the previous analysis
- `resolvedSignals` — count of issues that appear resolved
- `healthDelta` — integer (positive = improved, negative = declined, 0 = stable)

**Model:** `anthropic/claude-sonnet-4.6`

---

### 4.10 Shareable read-only link

**What it is:** A public, no-auth link to a read-only view of an account analysis.

**Behaviour:**
- Each account is assigned a `shareToken` (UUID) at creation time
- Share link format: `/concept/shared/[token]`
- Anyone with the link can view the full analysis report (no login required)
- The shared view includes all analysis sections, the changes-since banner, and a Nectic CTA
- The shared view does NOT include the PM agent chat or brief generator (these require auth)
- Deleting an account also removes the `sharedAccounts` record, making the link 404

**Storage:** `sharedAccounts/{token}` Firestore collection (top-level, not under user). Stores `{ uid, accountId, accountName, createdAt }`.

---

### 4.11 Analysis quality transparency

**What it is:** A collapsible banner at the top of the account detail page (and shared view) that surfaces Nectic's own uncertainty about the analysis.

**Confidence levels:**

| Level | Colour | Trigger |
|---|---|---|
| High | Green | 50+ messages, clear customer voice, consistent signals |
| Medium | Neutral grey | 20–49 messages, or ambiguous signals, or uncertain roles |
| Low | Amber | Under 20 messages, mostly vendor voice, or very short date range |

**Sections shown when expanded:**
- **What Nectic is uncertain about** — Specific caveats generated by Claude (e.g. "Conversation went quiet after Mar 15 — issues may have moved to another channel")
- **What would improve accuracy** — Data gaps Claude identified (e.g. "Contract value unknown — cannot score renewal risk accurately")

**Effect on chat:** When confidence is `low`, the chat system prompt includes an explicit warning instructing the agent to surface uncertainty in its responses rather than presenting thin data as confident analysis.

---

### 4.12 Cross-account signal clustering

**What it is:** Aggregation logic that groups product signals across all connected accounts by their underlying problem.

**How it works:**
- Each product signal has a `problemStatement` field — the underlying customer job or problem, not the surface feature request (e.g. "customers cannot export data in their preferred format" rather than "needs Excel export")
- `aggregateSignals()` groups signals by `problemStatement` (case-insensitive, normalised)
- If `problemStatement` is absent (legacy data), falls back to `title`
- Signals appearing in multiple accounts are surfaced as cross-account patterns
- Sort order: account count descending, then priority

**Purpose:** Answers the question "Is this a one-account problem or a market problem?" without requiring a manual cross-reference across all accounts.

---

## 5. Data model

### Firestore collections

```
users/{uid}/
  accounts/{accountId}          — StoredAccount document

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
  shareToken: string                  // UUID for /concept/shared/[token]
  _createdAt: Timestamp               // Firestore server timestamp
  _updatedAt?: Timestamp              // Set on every updateAccount call
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  accountName: string
  healthScore: number                 // 1–10
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string
  sentimentTrend: "improving" | "stable" | "declining"
  riskSignals: {
    quote: string
    explanation: string
    severity: "low" | "medium" | "high"
    date: string
  }[]
  productSignals: {
    type: "complaint" | "feature_request" | "praise" | "confusion"
    title: string
    problemStatement?: string         // JTBD-framed underlying problem
    quote: string
    priority: "low" | "medium" | "high"
    pmAction: string
  }[]
  relationshipSignals: {
    observation: string
    implication: string
  }[]
  competitorMentions: string[]
  recommendedAction: {
    what: string
    owner: "CS" | "PM" | "Sales" | "Engineering"
    urgency: "immediate" | "this_week" | "this_month"
  }
  stats: {
    messageCount: number
    participantCount: number
    dateRange: string
    languages: string[]
  }
  analysisQuality?: {
    confidence: "high" | "medium" | "low"
    caveats: string[]
    dataGaps: string[]
  }
  changesSince?: {
    summary: string
    newRiskSignals: number
    resolvedSignals: number
    healthDelta: number               // positive = improved, negative = declined
  }
}
```

### sharedAccounts document

```typescript
{
  uid: string        // Owner's Firebase user ID
  accountId: string  // Account document ID under users/{uid}/accounts
  accountName: string
  createdAt: Timestamp
}
```

---

## 6. AI pipeline

### Model allocation

| Route | Model | Rationale |
|---|---|---|
| `/api/concept/analyze` | `anthropic/claude-sonnet-4.6` | Best structured JSON extraction (97.3% validation rate), strong multilingual Bahasa Indonesia / English handling |
| `/api/concept/reanalyze` | `anthropic/claude-sonnet-4.6` | Same requirements as analyze; comparative reasoning benefits from the larger model |
| `/api/concept/brief` | `anthropic/claude-sonnet-4.6` | JTBD framing, assumption decomposition, and PM writing quality warrant the larger model |
| `/api/concept/chat` | `anthropic/claude-haiku-4.5` | Streaming latency is user-visible; Haiku 4.5 is near-frontier quality at significantly lower latency |

All models accessed via **OpenRouter** (`openrouter.ai/api/v1/chat/completions`).

### Analysis pipeline detail

```
User uploads file (browser)
  → parseWhatsAppFile() [client-side]
    → JSZip (if .zip) → extract _chat.txt
    → parseWhatsAppExport() — strips Unicode artifacts, filters system messages, deduplicates
    → WaParsed { messages[], participants[], dateRange, totalMessages, truncated }
  → User labels participants + sets context
  → POST /api/concept/analyze
    → buildParticipantBlock() — formats roles for Claude
    → Claude Sonnet 4.6 — returns AnalysisResult JSON
    → Strip markdown fences if present
    → Parse + validate JSON
  → saveAccount() [Firestore]
    → users/{uid}/accounts/{id}
    → sharedAccounts/{shareToken}
```

### Prompt design principles

- **Participant block first** — Claude sees who is vendor, customer, partner before the conversation, preventing misattribution
- **Temperature 0.2** — Low temperature for consistent, structured JSON output in analysis and brief routes
- **Temperature 0.3** — Slightly higher for chat to allow natural conversational variation
- **Explicit JSON schema in prompt** — Full schema with field descriptions and valid enum values reduces hallucination on structure
- **Confidence rules in prompt** — Explicitly tells Claude the criteria for each confidence level; without this, Claude defaults to `high`
- **JTBD framing instruction** — The `problemStatement` field is explicitly described as "the underlying customer problem, not the feature request itself" to force JTBD reasoning at extraction time

---

## 7. API reference

### POST /api/concept/analyze

Analyse a WhatsApp conversation and return a structured account analysis.

**Request body**
```json
{
  "conversation": "string (formatted message log)",
  "messageCount": "number (optional, used to override stats)",
  "participants": "number (optional)",
  "participantRoles": {
    "Name": "vendor | customer | partner | other"
  },
  "context": {
    "industry": "string (optional)",
    "contractTier": "starter | growth | enterprise (optional)",
    "renewalMonth": "YYYY-MM (optional)"
  }
}
```

**Response**
```json
{ "result": AnalysisResult }
```

---

### POST /api/concept/reanalyze

Update an existing analysis with new conversation data.

**Request body**
```json
{
  "priorAnalysis": "AnalysisResult",
  "conversation": "string",
  "messageCount": "number (optional)",
  "participantRoles": "ParticipantRoles"
}
```

**Response**
```json
{ "result": AnalysisResult }
```
The result includes a `changesSince` field with a delta summary.

---

### POST /api/concept/chat

Stream an AI response from the PM agent.

**Request body**
```json
{
  "analysis": "AnalysisResult",
  "messages": "[{ role, content }] (conversation history)",
  "question": "string (current user message)",
  "accountMeta": {
    "industry": "string (optional)",
    "contractTier": "string (optional)",
    "renewalMonth": "string (optional)",
    "vendorTeam": "string[]",
    "customerTeam": "string[]"
  }
}
```

**Response:** `text/plain` SSE stream. Tokens are forwarded directly from Claude to the client.

---

### POST /api/concept/brief

Stream a PM feature brief for a specific product signal.

**Request body**
```json
{
  "signal": {
    "type": "complaint | feature_request | praise | confusion",
    "title": "string",
    "problemStatement": "string (optional)",
    "quote": "string",
    "priority": "low | medium | high",
    "pmAction": "string"
  },
  "accountName": "string",
  "accountSummary": "string",
  "roadmapStatus": "new | planned | partial | unknown",
  "additionalContext": "string (optional)"
}
```

**Response:** `text/plain` SSE stream. Markdown brief content.

---

## 8. Infrastructure and security

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

**Early access submissions:** Firestore allows unauthenticated `create` on `earlyAccess/{docId}`. Reads require auth.

### Firestore security rules summary

```
users/{uid}                    read/write: auth.uid == uid
users/{uid}/accounts/{id}      read/write: auth.uid == uid
sharedAccounts/{token}         read: public; create/delete: auth required
earlyAccess/{docId}            create: public; read: auth required
```

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

## 9. Known limitations

### Data

| Limitation | Impact | Mitigation |
|---|---|---|
| Analysis based on a single export snapshot | Signals may be stale if the group is active daily | Re-analysis flow. Signal dates are shown on all risk signals. |
| Maximum 500 messages per analysis | Long-running groups may lose early context | Truncation warning shown. Most recent messages prioritised. |
| Parser may misparse unusual export formats | Some messages may be dropped or garbled | Parser handles 3 timestamp formats and common Unicode artefacts. Warn-and-continue model. |
| Conversation context may be absent | Claude infers account name from context — may be wrong or generic | User can rename via re-analysis or will be able to rename directly (planned) |

### AI

| Limitation | Impact | Mitigation |
|---|---|---|
| Claude may misattribute signals when all participants are labelled `other` | Risk signals assigned to vendor rather than customer | Confidence degraded to `medium` or `low`. Caveats surface this explicitly. |
| JSON extraction may fail on very long or unusual conversations | Analysis errors | Markdown fence stripping on response. Error returned to UI with message. |
| Bahasa Indonesia code-switching detection is best-effort | Signal nuance may be lost in translation | Claude Sonnet 4.6 has the strongest multilingual Bahasa performance of tested models. |
| Brief quality depends on signal quality | Weak signals produce weak briefs | Brief is only available on `complaint` and `feature_request` signals with `medium`/`high` priority. |

### Product

| Limitation | Impact | Mitigation |
|---|---|---|
| No direct WhatsApp Business API integration | User must manually export and upload | Guided upload flow with step-by-step instructions for iOS and Android. |
| No multi-device sync for chat history | Chat history is in-memory, lost on page reload | Planned: persist chat to Firestore. |
| No notification/alert system | PM must check the dashboard manually | Planned: proactive risk alerts. |

---

## 10. Roadmap

### Near-term (validated with early customers)

- [ ] Account rename (user-editable account name to override Claude inference)
- [ ] Chat history persistence (Firestore, per account)
- [ ] Email digest — weekly brief to PM's inbox without login
- [ ] Proactive risk alert — notification when re-analysis reveals health delta < -2

### Medium-term

- [ ] WhatsApp Business API direct integration (no manual export)
- [ ] Multiple export ingestion — upload several exports at once to enrich a single account
- [ ] Signal marking — PM can mark a signal as "actioned", "already shipped", or "won't fix"
- [ ] Signal feedback — PM can mark a signal as wrong, improving future analysis quality
- [ ] Team accounts — multiple users on one Nectic workspace

### Longer-term

- [ ] Zoom call transcript ingestion (extend beyond WhatsApp)
- [ ] CRM sync (push signals to HubSpot or Salesforce as notes)
- [ ] Jira integration — publish generated briefs directly as Jira tickets
- [ ] Cohort view — segment accounts by industry, tier, or risk level

---

*This document is the source of truth for Nectic's product state. Update it when a feature changes, not after.*
