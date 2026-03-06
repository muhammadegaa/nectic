# Nectic — Living Product Document

> Last updated: March 2026 — agentic MVP complete (6 sprints)
> Status: Pre-revenue MVP. Early access. Targeting first paying customers and Antler Indonesia pitch.
>
> **Rule for maintainers:** Only document what is built and working. Mark everything else as [PLANNED], [DEFERRED], or [NOT BUILT]. Do not mix aspiration with reality.

---

## What Nectic is

Nectic is a **PM and CS intelligence tool for WhatsApp-first B2B SaaS teams in Southeast Asia**.

It reads WhatsApp conversations between your company and your customers, extracts churn signals and product insights, and gives you an agentic co-pilot to help you act on them.

**What it does today:**

- Parses WhatsApp exports (.txt / .zip) or pulls conversations via WATI API (1:1 contacts only)
- Runs AI analysis against Claude Sonnet 4.6 to produce structured intelligence: health score, risk signals, product signals, relationship observations, competitor mentions, recommended action
- Stores account analysis results per user in Firestore
- Provides an in-context chat co-pilot (Claude Haiku 4.5) that knows the account, workspace context, and the PM's prior signal decisions
- Aggregates signals across accounts on an **account-grouped** Signal Board with per-signal action tracking (grouped by account, sorted by worst risk)
- Generates PM feature briefs from product signals (Claude Sonnet 4.6, streamed)
- Allows re-analysis when new conversation data is available or context changes
- Shares read-only analysis reports via unique token links
- **Sends email alerts** (via Resend) for high-risk / critical accounts and competitor mentions, with exact customer quotes and renewal date
- **Competitor alert banner** on account detail page — shows competitor names, triggering quote, and pre-fills chat co-pilot with a retention response prompt
- **Dashboard outcome story** — `changesSince` delta line per card (green/red healthDelta), competitor badge, "X saved this month" chip, ARR protected metric
- **Weekly digest email** — Monday briefing with deteriorated accounts, saved accounts, competitive threats, and ARR at risk / ARR protected (manual send via workspace; cron-ready)
- **Two-step onboarding** — captures `notificationEmail` for alerts and digest on step 2

**What it does NOT do today:**

- No real-time WhatsApp monitoring
- No group chat support via WATI (WhatsApp Business API limitation — groups are not supported)
- No Jira/Notion/Slack integration
- No billing / paywall active (routes exist, pricing not wired up)
- No multi-user workspace (one workspace per Google account)

---

## Core user flows — end to end

### Flow 1: First-time user, file upload path

```
1. User lands on nectic.vercel.app (marketing page)
2. User clicks "Get started" → /concept/login
3. Sign in with Google (Firebase Auth) → redirected to /concept (dashboard)
4. Dashboard is empty — EmptyState component shown
5. User clicks "Connect first account"
6. ConnectModal opens at "method" stage
7. User selects "Upload export"
8. Instructions screen explains how to export from WhatsApp (3 platforms)
9. User clicks "I have the file →"
10. Upload screen (drag-and-drop or click): accepts .txt or .zip
11. File parsed client-side by parseWhatsAppFile()
    - Extracts messages, participants, date range
    - Truncates at 1500 messages for token budget
    - Errors if <5 messages found
12. Participant roles screen shown
    - Pre-fills from contact book (Firestore: users/{uid}.contactBook)
    - AI auto-classifies unknown participants via /api/concept/classify-participants
    - AI suggestions marked with a badge; user can correct any
13. Account context fields shown (optional): industry, contract tier, renewal month
14. Consent checkbox → "Run analysis" button
15. POST /api/concept/analyze called with:
    - conversation text (formatted)
    - participantRoles
    - context
    - workspace (from Firestore)
    - Model: anthropic/claude-sonnet-4.6, temp 0.2, maxDuration=60s
16. Analysis result returned as JSON (see Analysis Result Schema)
17. Account saved to Firestore: users/{uid}/accounts/{id}
    - Also mirrors shareToken → sharedAccounts/{token} for public links
18. Contact book updated in Firestore (merges non-"other" roles)
19. Modal closes, account card appears on dashboard
20. User clicks account card → /concept/account/{id}
```

### Flow 2: WATI 1:1 connection path (demo-ready)

```
1. User is on dashboard, clicks "Connect account"
2. ConnectModal opens at "method" stage
3. User selects "Connect WhatsApp"
4. Credentials screen shown (endpoint + access token)
   - If credentials saved from previous session, fields auto-populate
   - If credentials already saved AND substage resolves to "loading", auto-fetches contacts
   - Link to WATI Settings → API page provided
5. User enters WATI API endpoint + token, presses Enter or "Connect →"
6. Credentials saved to Firestore: users/{uid}.workspace.watiEndpoint / .watiToken
7. POST /api/wati/contacts fetches contacts (pageSize=100, page 1)
   - Server-side call to WATI GET /api/v1/getContacts
8. Contact list shown with search and last-active recency
9. User clicks a contact
10. POST /api/wati/messages called:
    - Fetches up to 200 messages for that contact
    - Formats into WhatsApp-export-style conversation text
    - Assigns participantRoles: owner=true → vendor, owner=false → customer
    - Returns { conversation, participantRoles, messageCount }
11. POST /api/concept/analyze called (same as file upload, step 15 above)
12. Account saved, modal closes, card appears on dashboard

Limitations:
- Only 1:1 business-to-contact conversations (no group chat support in WhatsApp Business API)
- WATI fetches most recent 200 messages per contact (pageSize cap)
- No pagination for contacts beyond first 100
```

### Flow 3: Daily active user workflow

```
1. User logs into /concept (persisted session via Firebase)
2. Dashboard shows account cards sorted by risk (critical → high → medium → low)
3. Stats row shows: account count, at-risk count (high+critical), cross-account pattern count, **"X saved this month"** chip
4. If atRisk > 0: Revenue at Risk module shown (ARR calculator with ACV presets, plus **ARR protected** metric for saved accounts)
5. If workspace empty: amber nudge linking to /concept/workspace
6. User clicks an account card — card shows `changesSince` delta line (green/red) and competitor badge if applicable
7. Account detail page loads (/concept/account/{id}):
   - Left column: AnalysisReport — **CompetitorAlert banner** above risk signals (shows competitor name, triggering quote, renewal month, CTA to pre-fill co-pilot)
   - Right column: ChatPanel (Nectic co-pilot) — accepts `initialInput` pre-fill from competitor alert CTA
   - Mobile: tab switcher between "Analysis" and "Ask Nectic"
8. User reviews risk signals, product signals, relationship observations
9. User assigns status to signals via action controls (open → in_progress → done → dismissed)
   - Saved to Firestore: accounts/{id}.signalActions
10. User asks Nectic a question in chat:
    - POST /api/concept/chat (streaming, Claude Haiku 4.5)
    - System prompt includes: full analysis JSON, account meta, workspace context, signal actions (as of March 2026)
    - Co-pilot knows what signals the PM has already marked in_progress/done
    - Follow-up prompt suggestions generated after each response
11. User clicks "Generate brief" on a product signal
    - BriefPanel slide-over opens
    - User selects roadmap status (new/planned/partial/unknown)
    - Optional: adds additional context
    - POST /api/concept/brief (streaming, Claude Sonnet 4.6)
    - Brief output: JTBD problem, customer evidence, know/assume/don't-know, validation checklist, proposed solution, acceptance criteria, priority rationale
12. User navigates to Signal Board (/concept/board)
    - Signals grouped by **account** (AccountSignalGroup), sorted by worst risk
    - Sticky group header: account name, risk badge, health score, open signal count
    - Filter tabs: Needs action / In progress / Done / All — hide empty groups
    - Per-signal: status control + note field (saved to Firestore)
13. User visits Workspace (/concept/workspace)
    - **"Alerts & digest"** section at top: notification email field + "Send test digest" button
    - Fills in product context (auto-save, 900ms debounce)
    - Can auto-fill productDescription + featureAreas from website URL
    - Staleness nudge shown if roadmapFocus hasn't been updated since last quarter
```

### Flow 4: Re-analysis

```
Trigger: new conversation data available OR PM has additional context to add

Path A — New conversation data:
1. User opens account detail, scrolls to "Re-analyse" section
2. User uploads new .txt or .zip export
3. Participant roles pre-filled from saved roles + contact book
4. "Run re-analysis" button calls POST /api/concept/reanalyze with:
   - priorAnalysis (existing result)
   - conversation (new messages)
   - participantRoles
   - signalActions (what PM has already actioned)
   - workspace
5. Model: Claude Sonnet 4.6, same maxDuration=60s
6. Returns updated AnalysisResult + changesSince delta
   { summary, newRiskSignals, resolvedSignals, healthDelta }
7. Account updated in Firestore, UI refreshes

Path B — Context-only update (no new messages):
1. User adds text to "Additional context" field
2. "Update analysis" button triggers POST /api/concept/reanalyze with:
   - priorAnalysis, supplementalContext (freeform text), signalActions, workspace
   - No new conversation text
3. AI updates analysis based on PM-provided context only
```

### Flow 5: Sharing an account analysis

```
1. User clicks "Share" button on account detail page
2. Generates URL: /concept/shared/{shareToken}
   - shareToken is a UUID, stored in account and in sharedAccounts/{token}
3. Anyone with the link can view the read-only analysis
   - No auth required
   - Shows: account name, health score, risk level, summary, risk signals,
     product signals, recommended action
   - Does NOT show: signal actions, chat history, re-analysis panel, workspace
4. Shared view has Nectic branding and "Get started" CTA
```

---

## Feature set — accurate status


| Feature                                          | Status           | Notes                                                                             |
| ------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------- |
| Google Sign-In                                   | ✅ Working        | Via Firebase Auth. Entry at /concept/login                                        |
| Email/password auth                              | ⚠️ Exists        | At /auth/signup and /auth/login but not the primary product path                  |
| File upload analysis (.txt, .zip)                | ✅ Working        | Client-side parsing, 1500 message cap                                             |
| WATI 1:1 contact analysis                        | ✅ Working (demo) | Requires user to provide WATI endpoint + token                                    |
| WATI group chat                                  | ❌ Not possible   | WhatsApp Business API does not support group chats                                |
| AI participant role classification               | ✅ Working        | Runs on unknowns after file upload                                                |
| Contact book (cross-session role memory)         | ✅ Working        | Stored in Firestore per user                                                      |
| Account health score                             | ✅ Working        | AI-generated 1–10 integer                                                         |
| Risk level classification                        | ✅ Working        | low / medium / high / critical                                                    |
| Risk signals with quotes                         | ✅ Working        | Customer-side quotes with severity and date                                       |
| Product signals                                  | ✅ Working        | complaint / feature_request / praise / confusion + JTBD framing                   |
| Relationship signals                             | ✅ Working        | Tone observations, response pattern shifts                                        |
| Competitor mentions                              | ✅ Working        | Extracted from conversation                                                       |
| Recommended action                               | ✅ Working        | What + Owner + Urgency                                                            |
| Analysis quality indicator                       | ✅ Working        | high/medium/low confidence + caveats + data gaps                                  |
| Account chat co-pilot                            | ✅ Working        | Streaming, knows signal actions, workspace, account state                         |
| Dynamic prompt suggestions                       | ✅ Working        | Context-driven, based on risk/signals/renewal                                     |
| Follow-up suggestions                            | ✅ Working        | Generated from last AI response keywords                                          |
| Signal board (account-grouped)                   | ✅ Working        | Grouped by account, sticky headers, sorted by worst risk, filter hides empty groups |
| Signal actions (open/in_progress/done/dismissed) | ✅ Working        | Per-signal, stored in Firestore, injected into chat and reanalysis                |
| Feature brief generation                         | ✅ Working        | JTBD framing, streaming, markdown output                                          |
| Re-analysis (new messages)                       | ✅ Working        | Delta tracking (changesSince field)                                               |
| Re-analysis (context-only)                       | ✅ Working        | Supplemental context text field                                                   |
| Workspace (product intelligence)                 | ✅ Working        | Auto-save, 4 fields injected into all analyses                                    |
| Workspace URL auto-fill                          | ✅ Working        | Scrapes website → AI extracts productDescription + featureAreas                   |
| Workspace staleness nudge                        | ✅ Working        | Quarter boundary detection on roadmapFocus                                        |
| Revenue at Risk module                           | ✅ Working        | ARR calculator, ACV presets, recovery comparison, link to top-risk account        |
| Account sharing (read-only)                      | ✅ Working        | Tokenized public URLs                                                             |
| Cross-account signal aggregation                 | ✅ Working        | Groups identical signals across accounts with account count                       |
| Account delete                                   | ✅ Working        | Removes from Firestore + cleans up sharedAccounts                                 |
| Dashboard delta line per card                    | ✅ Working        | `changesSince.summary` shown; green/red based on healthDelta                      |
| Competitor badge on dashboard cards              | ✅ Working        | Orange badge when account has competitor mentions                                 |
| "Saved this month" stat chip                     | ✅ Working        | Counts accounts that improved from high/critical risk in last 30 days             |
| ARR protected metric                             | ✅ Working        | Shown alongside ARR at risk in Revenue module                                     |
| CompetitorAlert banner (account detail)          | ✅ Working        | Above risk signals; shows names, quote, renewal month, co-pilot pre-fill CTA      |
| Chat co-pilot pre-fill from competitor alert     | ✅ Working        | CTA sets `initialInput` in ChatPanel text area                                    |
| Email alerts (risk + competitor mentions)        | ✅ Working        | Resend via `/api/concept/notify`; orange-header template for competitor alerts    |
| Weekly digest email                              | ✅ Working        | `/api/concept/weekly-digest`; manual trigger from workspace; Firestore Admin SDK  |
| Two-step onboarding                              | ✅ Working        | Step 2 captures `notificationEmail` for alerts and digest                         |
| Workspace "Alerts & digest" section              | ✅ Working        | `notificationEmail` field + "Send test digest" button at top of workspace page    |
| PostHog analytics                                | ⚠️ Disabled      | Removed to fix auth flow; re-enable after PMF validation                          |
| Pricing page                                     | ⚠️ Exists        | UI exists at /pricing, Stripe routes exist but checkout not wired to active plans |
| Billing / paywall                                | ❌ Not active     | No subscription enforcement                                                       |
| Jira / Notion / Slack integration                | ❌ Not built      |                                                                                   |
| Multi-user workspace                             | ❌ Not built      | One workspace per Google account                                                  |
| Proactive nudges (stale in-progress signals)     | ❌ Not built      | Design in "Agentic system design" section                                         |
| Roadmap versioning (Q1 → Q2 history)             | ❌ Not built      | Design in "Agentic system design" section                                         |
| WATI OAuth / consent flow                        | ❌ Not possible   | WATI does not offer OAuth for third-party apps                                    |


---

## Analysis result schema

Every analysis (initial and re-analysis) produces this structure:

```typescript
interface AnalysisResult {
  accountName: string                    // inferred from conversation
  healthScore: number                    // 1–10 integer
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string                        // 2-3 sentence executive summary
  sentimentTrend: "improving" | "stable" | "declining"

  riskSignals: {
    quote: string                        // exact customer-side quote
    explanation: string                  // why this is a risk signal
    severity: "low" | "medium" | "high"
    date: string                         // date from conversation
  }[]

  productSignals: {
    type: "complaint" | "feature_request" | "praise" | "confusion"
    title: string                        // max 8 words
    problemStatement: string             // underlying customer problem (JTBD framing)
    quote: string                        // exact customer-side quote
    priority: "low" | "medium" | "high"
    pmAction: string                     // recommended PM action
  }[]

  relationshipSignals: {
    observation: string
    implication: string
  }[]

  competitorMentions: string[]

  recommendedAction: {
    what: string                         // specific action, max 2 sentences
    owner: "CS" | "PM" | "Sales" | "Engineering"
    urgency: "immediate" | "this_week" | "this_month"
  }

  stats: {
    messageCount: number
    participantCount: number
    dateRange: string
    languages: string[]
  }

  analysisQuality: {
    confidence: "high" | "medium" | "low"
    caveats: string[]
    dataGaps: string[]
  }

  // Only present on re-analysis results
  changesSince?: {
    summary: string
    newRiskSignals: number
    resolvedSignals: number
    healthDelta: number                  // positive = improved, negative = declined
  }
}
```

**Confidence rules:**

- `high`: 50+ messages with clear customer voice
- `medium`: 20–49 messages, ambiguous signals, or uncertain participant roles
- `low`: under 20 messages, mostly vendor-side, or very short date range

---

## Data architecture (Firestore)

```
Firestore
├── users/{uid}
│   ├── workspace: WorkspaceContext
│   │   ├── productDescription?: string
│   │   ├── featureAreas?: string
│   │   ├── roadmapFocus?: string
│   │   ├── knownIssues?: string
│   │   ├── watiEndpoint?: string       ← saved WATI credentials
│   │   ├── watiToken?: string
│   │   ├── notificationEmail?: string  ← for alerts and weekly digest
│   │   └── updatedAt?: string          ← ISO timestamp, quarter staleness check
│   └── contactBook: Record<string, "vendor"|"customer"|"partner"|"other">
│       └── {participantName}: role     ← accumulated across all account analyses
│
├── users/{uid}/accounts/{accountId}
│   ├── fileName: string                ← "chat.txt" or "WATI: Contact Name"
│   ├── analyzedAt: string              ← ISO timestamp of first analysis
│   ├── updatedAt?: string              ← ISO timestamp of last re-analysis
│   ├── result: AnalysisResult          ← full AI output (see schema above)
│   ├── participantRoles: Record<string, ParticipantRole>
│   ├── context: AccountContext
│   │   ├── industry?: string
│   │   ├── contractTier?: "starter"|"growth"|"enterprise"
│   │   └── renewalMonth?: string       ← "YYYY-MM"
│   ├── shareToken: string              ← UUID for public sharing
│   ├── supplementalContext?: string    ← freeform PM notes
│   └── signalActions?: Record<signalKey, SignalAction>
│       └── {type}-{slug}: {
│               status: "open"|"in_progress"|"done"|"dismissed"
│               note?: string
│               updatedAt: string
│           }
│
└── sharedAccounts/{shareToken}
    ├── uid: string                     ← account owner
    ├── accountId: string
    ├── accountName: string
    └── createdAt: Timestamp
```

**Signal key format:** `{type}-{title-slug-max-60-chars}` (e.g. `complaint-login-bug-crashes-on-android`)

---

## API surface

All routes under `/api/`. All are POST. No authentication middleware — auth is handled client-side; server routes trust the data passed.


| Route                                | Model                   | Max duration | Input                                                                            | Output                                                       |
| ------------------------------------ | ----------------------- | ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/api/concept/analyze`               | claude-sonnet-4.6       | 60s          | conversation, participantRoles, context, workspace                               | { result: AnalysisResult }                                   |
| `/api/concept/reanalyze`             | claude-sonnet-4.6       | 60s          | priorAnalysis, conversation?, supplementalContext?, signalActions, workspace     | { result: AnalysisResult }                                   |
| `/api/concept/chat`                  | claude-haiku-4.5        | 60s          | analysis, messages, question, accountMeta, workspace, signalActions              | text/plain stream                                            |
| `/api/concept/brief`                 | claude-sonnet-4.6       | 60s          | signal, accountName, accountSummary, roadmapStatus, additionalContext, workspace | text/plain stream (markdown)                                 |
| `/api/concept/classify-participants` | (unknown — check route) | —            | participants: [{name, messages[]}]                                               | { roles: Record<string, ParticipantRole> }                   |
| `/api/wati/contacts`                 | —                       | —            | endpoint, token, pageSize?                                                       | { contacts: WatiContact[], totalCount }                      |
| `/api/wati/messages`                 | —                       | —            | endpoint, token, phoneNumber, contactName, pageSize?                             | { conversation, participantRoles, messageCount, totalCount } |
| `/api/concept/notify`                | —                       | —            | uid, accountId, accountName, riskLevel, topSignalQuote, competitorNames, isCompetitorAlert, renewalMonth | 200 OK — sends Resend email |
| `/api/concept/weekly-digest`         | —                       | 15s          | uid, email                                                                       | { sent: true } — sends digest email via Resend               |
| `/api/workspace/autofill`            | claude-haiku-4.5        | 30s          | url                                                                              | { productDescription, featureAreas, source }                 |
| `/api/stripe/checkout`               | —                       | —            | plan, billing                                                                    | { url } (Stripe session)                                     |
| `/api/stripe/webhook`                | —                       | —            | Stripe event                                                                     | 200 OK                                                       |


**Constraints:**

- All routes run on Vercel Hobby plan → **maxDuration cap is 60 seconds**
- Analysis and re-analysis are the most expensive; large conversations (1500 messages) can take 30–45s
- Chat uses streaming — faster perceived performance
- No rate limiting or abuse protection implemented

---

## AI models and context

### Analysis (`/api/concept/analyze`, `/api/concept/reanalyze`)

- Model: `anthropic/claude-sonnet-4.6` via OpenRouter
- Temperature: 0.2 (low variance, consistent structure)
- Context injected: workspace fields, participant roles, account context (industry/tier/renewal)
- Re-analysis also injects: prior result JSON, signal actions with current status, supplemental context

### Chat co-pilot (`/api/concept/chat`)

- Model: `anthropic/claude-haiku-4.5` via OpenRouter (faster, cheaper for conversation)
- Temperature: 0.3
- Context injected: full analysis JSON, account meta, workspace fields, **signal actions** (as of March 2026)
- The AI knows what signals the PM has marked in_progress or done — will not re-suggest those
- Streaming via TransformStream

### Feature brief (`/api/concept/brief`)

- Model: `anthropic/claude-sonnet-4.6` via OpenRouter
- Temperature: 0.2
- Context: signal details, account name/summary, roadmap status, workspace
- Output: structured markdown brief following JTBD × PM brief framework
- Streaming via TransformStream

### Workspace autofill (`/api/workspace/autofill`)

- Model: `anthropic/claude-haiku-4.5` via OpenRouter
- Fetches URL server-side (8s timeout), strips HTML, extracts first 6000 chars
- Extraction prompt returns only `productDescription` and `featureAreas`
- Does NOT attempt roadmap or known issues (those are internal data)

### SEA language handling

All analysis prompts include explicit Bahasa Indonesia guidance:

- "Agak", "lumayan", "nanti saja" → indirect dissatisfaction signals
- Code-switching to English → escalation/emphasis
- "Iya iya" without follow-up → soft rejection
- Formal tone shift → unhappiness
- Predominantly Bahasa conversations → confidence lowered one level

---

## Infrastructure


| Component    | Service                 | Notes                                                                     |
| ------------ | ----------------------- | ------------------------------------------------------------------------- |
| Hosting      | Vercel                  | Hobby plan. maxDuration=60s hard cap.                                     |
| Database     | Firebase Firestore      | No schema enforcement. Client-side Firebase SDK.                          |
| Auth         | Firebase Auth           | Google Sign-In only at /concept/login                                     |
| AI routing   | OpenRouter              | Key: OPENROUTER_API_KEY in Vercel env vars                                |
| Analytics    | PostHog                 | Key: NEXT_PUBLIC_POSTHOG_KEY in Vercel env vars                           |
| WhatsApp API | WATI                    | User-provided endpoint + token. No server-side key.                       |
| Payments     | Stripe                  | STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel env vars. Not active. |
| Framework    | Next.js 14 (App Router) | TypeScript, Tailwind CSS                                                  |


---

## Analytics tracking plan

PostHog events currently tracked:


| Event                   | Fired when                                       | Properties                                  |
| ----------------------- | ------------------------------------------------ | ------------------------------------------- |
| `signup_completed`      | After successful Google or email signup          | `method: "google"                           |
| `file_uploaded`         | WhatsApp file successfully parsed                | `messageCount, participants`                |
| `analysis_completed`    | Account saved after first analysis               | `riskLevel, healthScore, messageCount`      |
| `analysis_failed`       | Analysis API returned error                      | `error`                                     |
| `wati_import_attempted` | Before WATI message fetch                        | `contactName`                               |
| `wati_import_completed` | WATI account saved                               | `riskLevel, healthScore`                    |
| `reanalysis_triggered`  | Re-analysis run button clicked                   | `accountId, riskLevel`                      |
| `chat_message_sent`     | User sends message in chat panel                 | `accountRiskLevel, isFollowUp`              |
| `signal_actioned`       | Signal status changed on board or account detail | `status`                                    |
| `brief_generated`       | PM generates a feature brief                     | `signalType, signalPriority, roadmapStatus` |
| `pricing_page_viewed`   | /pricing page loaded                             | —                                           |
| `checkout_started`      | Stripe checkout initiated                        | `plan, billing`                             |


**User identification:** `identifyUser(uid, { email, name })` called on dashboard load when user is authenticated.

---

## Design system

All `/concept` pages use these conventions:


| Element                       | Token                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Page background               | `bg-neutral-50`                                                                      |
| Nav                           | `h-12 bg-white border-b border-neutral-200 sticky top-0 z-10`                        |
| Nav active link               | `text-neutral-900 font-semibold border-b-2 border-neutral-900 pb-0.5`                |
| Cards                         | `bg-white border border-neutral-200 rounded-xl`                                      |
| Account card hover            | `transition-all hover:-translate-y-0.5 hover:shadow-md`                              |
| List row hover                | `hover:bg-neutral-50/50 transition-colors`                                           |
| Loading spinner               | `w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin` |
| Page title                    | `text-xl font-semibold text-neutral-900`                                             |
| Subtitle                      | `text-sm text-neutral-500 mt-0.5`                                                    |
| Risk: critical                | dot `bg-red-500`, badge `bg-red-50 text-red-700 border-red-200`                      |
| Risk: high                    | dot `bg-orange-400`, badge `bg-orange-50 text-orange-700 border-orange-200`          |
| Risk: medium                  | dot `bg-amber-400`, badge `bg-amber-50 text-amber-700 border-amber-200`              |
| Risk: low                     | dot `bg-green-400`, badge `bg-green-50 text-green-700 border-green-200`              |
| Max-width: workspace          | `max-w-2xl`                                                                          |
| Max-width: accounts dashboard | `max-w-4xl`                                                                          |
| Max-width: signal board       | `max-w-5xl`                                                                          |
| Max-width: account detail     | `max-w-6xl`                                                                          |


**Rules:**

- `rounded-xl` on all card containers
- `rounded-lg` only for inline elements (inputs, buttons, tags, chips)
- `tabular-nums` on all numeric displays
- No external animation libraries — CSS transitions only

---

## Known limitations and honest gaps

**Analysis quality:**

- Low-message conversations (<20 messages) produce low-confidence output; AI flags this explicitly
- WATI fetches max 200 messages per contact; very long relationships may be under-represented
- Analysis is a point-in-time snapshot — it doesn't know about actions taken outside Nectic
- Bahasa Indonesia NLP is imperfect; indirect dissatisfaction may be missed

**Architecture:**

- No server-side auth on API routes — anyone with the right JSON payload can call them (not exploitable in practice since data requires valid Firestore tokens, but technically open)
- All accounts stored flat under users/{uid}/accounts — no team sharing, no org concept
- shareToken is a UUID but never expires and has no access revocation
- WATI credentials (endpoint + token) stored in Firestore in plaintext in the workspace document

**Scalability:**

- 60s Vercel function cap will be hit on very large conversation exports (close to 1500 messages)
- No background processing — all analysis is synchronous in the request/response cycle
- No job queue, no retry logic on analysis failure beyond client-side retry

**WATI-specific:**

- No OAuth or consent flow — user must manually copy endpoint and token from WATI dashboard
- Only fetches page 1 of contacts (max 100)
- `lastUpdated` on WATI contacts reflects contact record update time, not last message time
- Phone number format: WATI uses `wAid` (no `+` prefix) — the client strips `+` automatically

---

## Agentic system design — context window and temporal awareness

> Design decisions for features not yet built. Do not move to "built" until code ships.

### The context window model

Every analysis and chat operates on a four-layer context window:


| Layer           | Source                 | Updated by                          | Staleness risk             |
| --------------- | ---------------------- | ----------------------------------- | -------------------------- |
| Product context | Workspace fields       | PM manually                         | High — quarter boundaries  |
| Account state   | Analysis result        | Each analysis run                   | Medium — needs fresh data  |
| PM decisions    | Signal actions         | PM on signal board / account detail | Low — tracked per-action   |
| Conversation    | WhatsApp export / WATI | PM manually uploads                 | High — needs fresh exports |


**What's built:** All four layers are injected into reanalysis and chat. Signal actions now included in chat context (March 2026 fix).

### Q1 → Q2 roadmap versioning [DEFERRED]

**Problem:** When the PM updates `roadmapFocus` for a new quarter, the old value is overwritten. The AI has no memory that "mobile app" was Q1's priority and may have shipped.

**Current mitigation:** Staleness nudge on `roadmapFocus` when `updatedAt` timestamp is from a previous quarter.

**Design when we build it:**

```typescript
// Add to WorkspaceContext:
roadmapHistory?: {
  quarter: string        // "Q1 2026"
  focus: string
  archivedAt: string
  archiveReason?: "new_quarter" | "pivot" | "manual"
}[]
```

When PM updates `roadmapFocus` and quarter boundary detected: prompt "Archive Q1 roadmap before updating?" → push to history array.

Inject into re-analysis prompt:

```
PREVIOUS ROADMAP (Q1 2026, archived): [text]
CURRENT ROADMAP (Q2 2026): [text]
```

**Build trigger:** First user complaint about losing quarter context OR first enterprise customer requesting quarterly review features.

### Proactive nudges for stale in-progress signals [DEFERRED]

**Problem:** PM marks signal as "in_progress", forgets to follow up. 30 days later, same customer complaint appears in new analysis.

**Design:**

- Vercel Cron job (weekly): query all users' signal actions
- Find signals with `status: "in_progress"` and `updatedAt` > 21 days old
- Surface: in-app banner on next dashboard load — "3 signals you're working on haven't had a re-analysis in 30+ days"
- No email until PMF confirmed

**Build trigger:** 10+ active users with consistent signal action usage, or first user complaint about forgotten follow-ups.

### Cross-account behavioral analytics [DEFERRED]

**Problem:** Did the PM's actions actually improve account health? We don't track action → outcome correlation.

**Needs:** Multiple re-analyses per account over time (longitudinal data). No users have this yet.

**Build trigger:** Users who have been on the product for 90+ days with 3+ re-analyses per account.

---

## Product strategy

### North Star

**Time from customer signal to PM action.**

Every feature should be answerable with: does this reduce the gap between a customer expressing a problem in WhatsApp and the PM making a decision about it?

### The core thesis

In SEA B2B SaaS, WhatsApp IS the CRM. Customer success, sales, and product feedback all happen in WhatsApp group chats. PMs and CS leads receive a filtered, delayed version of what customers actually said — because sales reps decide what gets escalated.

The result:

- Churn signals surface weeks after the save window closes
- Roadmap decisions are based on escalated anecdotes, not actual customer language
- CS teams waste hours reading chat history to understand account health

**Why this is worse in SEA:**

- Indonesian B2B SaaS retention: 62–70% (vs. 90% global median)
- Monthly churn at Series A: 5.7% (vs. 3.5% global)
- 91% of B2B customer communication in Indonesia happens on WhatsApp

### ICP

**Primary (locked):**

- Role: Head of CS, VP Product, or co-founder in a post-Series A B2B SaaS company in Indonesia or Singapore
- Company: 50–500 customers, $1–20M ARR, customer relationships managed via WhatsApp group chats
- Pain: Churn is high, escalation process is broken, product roadmap is driven by sales-filtered anecdotes

**Anti-ICP:**

- SMB companies with <20 customers (analysis not worth it)
- Companies that use Salesforce or HubSpot as the primary communication channel (not the SEA pattern)
- Companies that don't use WhatsApp for customer communication

### What Nectic is NOT

- Not a WhatsApp CRM (that is Qontak, Wati, Respond.io)
- Not a chatbot platform
- Not a customer support ticketing tool
- Not a general-purpose AI assistant
- Not building for SMB volume at low ACV
- Not indexing all messages in real-time

---

## Research appendix (LuminixAI, March 2026)

Eight research reports were commissioned to validate the Nectic thesis.

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