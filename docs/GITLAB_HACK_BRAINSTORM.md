# Nectic — GitLab AI Hackathon Brainstorm & Plan
> Created: March 2026
> Deadline: March 25, 2026 @ 2:00pm EDT (= March 26, 1:00am GMT+7)
> Prize target: Grand Prize ($15k) + Anthropic Prize ($10k) + Most Technically Impressive ($5k)
> Total potential: $30,000 from a single submission

---

## The Opportunity

The GitLab AI Hackathon ($65k total prizes) asks participants to build agents on the GitLab Duo Agent Platform. The Anthropic prize ($10k grand + $3.5k runner up) requires Claude to be the central reasoning engine. The Grand Prize ($15k) rewards best overall technical + impact + polish.

Nectic already has:
- A working Claude Sonnet 4.6 reasoning chain for CS account health
- Firestore longitudinal memory (healthHistory pattern)
- Approval interface UX (Queue cards)
- Health sparkline component
- Weekly digest email

The hackathon submission extends this to engineering teams via GitLab — same thesis, second connector, proof of platform.

---

## The Platform Thesis

**One sentence:**
> Nectic is the Autonomous Signal-to-Decision platform — it reads any high-volume business signal source, extracts what matters, and delivers a pre-formed decision to the right human for approval.

**Three-layer model:**

```
Layer 1 — CONNECTORS (data ingestion)
  WhatsApp exports → GitLab issues/MRs/pipelines → [Future: Slack, Salesforce]

Layer 2 — INTELLIGENCE ENGINE (shared, identical across connectors)
  Claude Sonnet 4.6
  Step 1: Classify signals (blocker vs noise)
  Step 2: Score health 1–10 with reasoning
  Step 3: Recommend actions with owner + urgency
  Step 4: Synthesise and act

Layer 3 — APPROVAL SURFACE (shared UX pattern)
  CS Product: Queue card + draft response
  GitLab Agent: Issue comment + action issue auto-created
```

**Why this is defensible:**
- Layer 2 (intelligence engine) gets better with every entity analyzed — moat
- Layer 3 (approval habit) — once adopted, hard to rip out
- Layer 1 (connectors) — each new connector = new market at near-zero rebuild cost

---

## Jobs-to-be-Done Analysis

### Core Job (identical in both markets)
> "When I need to know which situation requires my attention right now, help me get there without reading everything myself."

### CS Product Job Map
| Job Step | Without Nectic | With Nectic |
|---|---|---|
| Define — what needs attention | Gut feel per CS lead | AI-defined health score + risk level |
| Locate — find which accounts | Open every WhatsApp group | Dashboard sorted by risk |
| Prepare — understand situation | Read 50–200 messages | AI extracts signals + quotes |
| Confirm — decide if action needed | Personal judgment | Health score + severity already done |
| Execute — take the action | Draft from scratch, paste | Draft pre-written, one click |
| Monitor — did it work? | Re-read next week | Re-analysis delta + digest |
| Conclude — close the loop | Hope churn didn't happen | "Account saved — ARR protected" |

**Eliminated entirely: Locate + Prepare + Confirm = 80% of CS lead's time. All pattern recognition.**

### GitLab Agent Job Map
| Job Step | Without Nectic | With Nectic |
|---|---|---|
| Define — what "at risk" means | PM intuition | AI health score 1–10 |
| Locate — find which issues/MRs | Read 40+ issues manually | Flow triggered on mention |
| Prepare — understand situation | Cross-reference issue/MR/pipeline | AI reads everything, extracts signals |
| Confirm — decide if serious | Manual judgment in standup | Risk signals ranked with reasoning |
| Execute — take the action | Write tasks manually, assign owners | Action issue created automatically |
| Monitor — delivery improving? | Weekly retro, manual comparison | Health sparkline week-over-week |
| Conclude — sprint saved? | Post-mortem if it failed | "Sprint health improved" |

**Identical pattern. Same job map. Different data source.**

### Emotional Job (drives urgency)
- CS lead: "I don't want to miss the account that churned." → Fear of personal failure
- PM/TL: "I don't want to miss the sprint slipping." → Fear of team failure
- Both are anxiety-driven. Product must eliminate anxiety first, improve efficiency second.
- This is why **alerts come first** and **approval interface comes second**.

---

## Value Proposition Canvas

### CS Product
**Pains:** 2–3 hrs/day reading WhatsApp, signals surface after save window, no audit trail, Indonesian churn 62–70% retention
**Gains:** Know every at-risk account by 9am, save window never missed, ARR protected metric for leadership
**Pain Relievers:** Replaces manual triage, proactive alerts, signal-to-draft in one step
**Gain Creators:** Health sparkline trajectory, "Accounts saved" metric, Ask Nectic Q&A

### GitLab Agent
**Pains:** 45 min/day reading GitLab noise, blockers found in standup not before, no longitudinal sprint data
**Gains:** Know every blocker before standup, sprint health visible week-over-week, delivery report for leadership
**Pain Relievers:** Replaces manual GitLab triage, proactive report on mention, blocker-to-action in one step
**Gain Creators:** Health sparkline (Nectic dashboard), "Sprints saved" metric, Ask agent Q&A per issue

---

## What Nectic Agent for GitLab Actually Is

### Primary artifact: Custom Flow (YAML)
A 4-step GitLab Duo Flow called `nectic-delivery-health`:

```
Trigger: Mention @ai-nectic-delivery-health in any issue or MR

Step 1 — GATHER
Tools: list_issues (open + priority::high/blocker), gitlab_merge_request_search 
       (open, updated last 14 days), get_pipeline_errors (last 3 runs), 
       get_job_logs (failed jobs)
Output: Structured project snapshot

Step 2 — CLASSIFY
Claude reasons: which signals are blockers vs noise, severity, business impact
Output: Typed RiskSignal[] with evidence quotes

Step 3 — RECOMMEND
Claude prescribes: actions with owner (PM/TL/Eng) + urgency (today/this_week)
Output: Ranked Action[]

Step 4 — SYNTHESISE + ACT
Claude writes: Delivery Health Report markdown
Tool: create_issue_note → posts report to triggering issue
Tool: create_issue → creates follow-up action issue labeled nectic-action, assigned to PM
```

### Secondary artifact: Custom Agent
`Nectic Health Analyst` — specialized agent for on-demand Q&A in issues/MRs
- Tools: list_issues, get_pipeline_errors, get_job_logs, create_issue_note
- Used for: "Ask Nectic: why is this sprint at risk?"
- Triggered via GitLab Duo Chat sidebar

### Tertiary artifact: Nectic Dashboard extension
New `/concept/gitlab` route in existing Next.js app:
- `StoredProject` Firestore schema (mirrors `StoredAccount`)
- `deliveryHistory` array (mirrors `healthHistory`)
- Health sparkline per project (reuse `health-sparkline.tsx`)
- Longitudinal memory differentiator — no other submission will have this

---

## Platform Architecture — How GitLab Connects to Existing Nectic

```
NECTIC PLATFORM
        │
┌───────┴────────┐
│                │
CS Product       GitLab Agent
(existing)       (hackathon)
│                │
WhatsApp         GitLab issues
exports          MRs + pipelines
│                │
Same Firestore   Same Firestore
healthHistory    deliveryHistory
pattern          pattern
│                │
Same             Same
health-          health-
sparkline        sparkline
component        component
│                │
Queue card       Issue comment
approval UI      + action issue
│                │
└───────┬────────┘
        │
Same Nectic dashboard
Same weekly digest (future)
Same platform story for Antler
```

**Three shared elements that prove it's a platform:**
1. Same dashboard — `/concept/gitlab` sits alongside `/concept` (CS accounts)
2. Same Firestore schema pattern — `StoredProject` mirrors `StoredAccount`
3. Same `health-sparkline.tsx` component — reused directly, zero changes

---

## Prize Strategy

| Prize | Amount | What judges look for | How this wins |
|---|---|---|---|
| Grand Prize | $15k | Technical + impact + polish + story | 4-step chain, longitudinal tracking, clean 3-min video, platform story |
| Anthropic Prize | $10k | Claude is reasoning engine (automatic via platform), creative use | 4-step chain visible in YAML, reasoning trace in issue output, non-trivial decisions |
| Most Technically Impressive | $5k | Platform depth: Tools, Triggers, Context | 8+ native tools, event trigger, follow-up issue creation, external memory |
| Most Impactful | $5k | Real pain, real users, real change | "Every PM running a sprint review" pain, quantified stat, real project demo |
| Easiest to Use | $5k | UX, install simplicity, workflow sense | One-step: mention @ai-nectic in any issue. Zero config. |

**Total potential: $40k. Target minimum: $25k (Grand + Anthropic).**

---

## Critical Platform Reality (Read Before Building)

**The original plan in the .docx was architecturally wrong.** That plan assumed "GitLab CI calls Vercel endpoint." The actual platform is:

- GitLab Duo Agent Platform has native agents and flows (YAML-configured, running inside GitLab)
- Claude Sonnet 4.6 is accessible by default — no Anthropic API key needed for the flow itself
- Agents have 50+ native tools: list_issues, get_pipeline_errors, create_issue, create_issue_note, etc.
- Triggers are event-driven: mention the service account in a comment
- Submissions must be in `gitlab.com/gitlab-ai-hackathon` group (request access first)
- The Anthropic prize is for using Anthropic models through GitLab — it's implicit in the platform

**The Vercel/Next.js app is secondary.** Primary artifact = GitLab YAML Flow + Custom Agent.

---

## Anthropic Prize Unlock (Critical)

Claude must do four verifiable things:
1. **Classify** — determine which signals are blockers vs noise without explicit rules
2. **Prioritise** — rank risks by business impact, not just labels
3. **Recommend** — prescribe specific actions with ownership and urgency
4. **Explain** — provide reasoning trace the judge can read in the issue comment

Each step is a separate prompt in the Flow YAML. The intermediate output of each step is stored and visible in the final GitLab issue. This is what makes Claude architecturally central, not bolted on.

**The "Why Nectic flagged this" section in the issue body is the prize unlock.** It must contain Claude's actual reasoning from Step 2, not a summary.

---

## Biggest Risks & Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Build a report generator, not an agent | Judges immediately distinguish scripts from agents | Claude must make non-trivial decisions that change output PATH not just text. Follow-up issue creation is the proof. |
| Demo breaks on real GitLab data | 200+ issues, stale MRs, cryptic pipeline names | Pre-processor filters: open issues only, MRs last 14 days, pipelines last 7 days. Cap 15+10+10. |
| GitLab Duo integration appears fake | Judges who know GitLab will mark down a script | Show actual flow session running in `Automate > Flows`. Show issue created with `nectic-action` label. Native, not simulated. |
| Access request denied or delayed | Can't submit without being in the hackathon group | Request access TODAY at contributors.gitlab.com/ai-hackathon |
| Flow YAML validation fails silently | CI pipeline failure = no submission | Test YAML against template, commit incrementally, check CI each time |

---

## What Makes This Win vs Just Pass

**Passing grade (functional):**
- Flow fetches GitLab data, sends to Claude, posts report as issue comment
- Works on one project

**Runner-up:**
- Multi-step Claude reasoning chain (visible in YAML output)
- Health score with written reasoning
- Actions with named owners and urgency

**Winning delta — three specific things:**

1. **Memory across runs.** Nectic dashboard shows delivery health trend over 3+ weeks. No other submission will have longitudinal tracking. This is the sparkline moment in the demo.

2. **Agent acts, not just reports.** After Claude identifies the top blocker, agent creates a follow-up GitLab issue tagged `nectic-action`, assigned to the owner identified in Step 3. Human just closes it when done. This closes the loop from "analysis tool" to "system of work."

3. **Reasoning is transparent.** "Why Nectic flagged this" section contains Claude's Step 2 reasoning verbatim — not a conclusion, the reasoning. Judges who care about "Claude is central" see it immediately.

---

## Decision Filter (Apply to Every Build Decision)

```
1. Does this reduce the gap between a signal appearing and a human approving an action?
   YES → build it | NO → defer

2. Does this require human judgment to operate?
   YES → approval interface | NO → intelligence engine (Claude does it)

3. Does this work across connectors (WhatsApp AND GitLab AND future)?
   YES → build in Layer 2 (shared) | NO → build in Layer 1 (connector-specific)

4. Will this be visible in the 3-minute demo video?
   YES for hackathon → prioritize | NO for hackathon → defer until post-submission
```

---

## Atomic Build Requirements (Sequenced)

### Pre-conditions (Day 0 — do today)
- [ ] Request hackathon group access: contributors.gitlab.com/ai-hackathon
- [ ] Register on Devpost for this hackathon
- [ ] Set GitLab Duo default namespace to `GitLab AI Hackathon` in profile preferences
- [ ] Get direct Anthropic API key from console.anthropic.com
- [ ] Test `@anthropic-ai/sdk` call with `claude-sonnet-4-5` — confirm it works
- [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars
- [ ] Add MIT license to Nectic repo (required for OSS detection at top of repo page)

### Phase 1 — GitLab platform setup (Day 1, 2hrs)
- [ ] Find participant project in hackathon group (auto-created after access granted)
- [ ] Review `.gitlab/duo/flows/` and `.gitlab/duo/agents/` template files
- [ ] Confirm CI pipeline passes on template files
- [ ] Create a test issue to understand mention trigger mechanics

### Phase 2 — Intelligence Engine prompts (Days 1–2, 8hrs — highest priority)
- [ ] Step 1 CLASSIFY prompt: raw GitLab data → typed `RiskSignal[]` JSON with severity + evidence quote
- [ ] Step 2 PRIORITISE prompt: signals → health score 1–10 + written reasoning (this section becomes "Why Nectic flagged this")
- [ ] Step 3 RECOMMEND prompt: signals + health → `Action[]` with `owner`, `urgency`, exact action text
- [ ] Step 4 SYNTHESISE prompt: all above → full GitLab issue markdown with health badge, signals, reasoning trace, actions
- [ ] Data pre-processor: filter open issues + priority::high/blocker, MRs last 14 days, pipelines last 7 days, cap 15+10+10

### Phase 3 — Flow YAML (Days 2–3, 6hrs)
- [ ] Write `.gitlab/duo/flows/nectic-delivery-health.yaml` wiring all 4 steps
- [ ] Step 1 tools: `list_issues`, `gitlab_merge_request_search`, `get_pipeline_errors`, `get_job_logs`
- [ ] Step 4 tools: `create_issue_note` (report to triggering issue), `create_issue` (action issue, label `nectic-action`)
- [ ] Commit → CI pipeline must pass YAML validation
- [ ] Create tag → publishes to AI Catalog
- [ ] Enable flow in participant project with Mention trigger
- [ ] Smoke test: mention `@ai-nectic-...` in a real issue, confirm report appears

### Phase 4 — Custom Agent (Day 3, 2hrs)
- [ ] Create `Nectic Health Analyst` agent with delivery health expert system prompt
- [ ] Enable tools: `list_issues`, `get_pipeline_errors`, `get_job_logs`, `create_issue_note`
- [ ] Create tag, publish to AI Catalog, enable in project
- [ ] Smoke test: Duo Chat sidebar → select agent → ask "what is the top delivery risk this sprint?"

### Phase 5 — Nectic Dashboard GitLab extension (Days 3–4, 6hrs)
- [ ] Add `StoredProject` to `src/lib/concept-firestore.ts`: `deliveryHistory: DeliveryHistoryEntry[]`, `signals`, `healthScore`, `lastRunAt`
- [ ] Create `/api/gitlab/snapshot` POST route — saves `StoredProject` to Firestore
- [ ] Create `/concept/gitlab` page — project cards sorted by delivery risk
- [ ] Add `HealthSparkline` to project cards (reuse `src/components/health-sparkline.tsx` — zero new code)
- [ ] Seed 3 weeks of `deliveryHistory` snapshots manually to show sparkline in demo
- [ ] Optional: call `/api/gitlab/snapshot` from GitLab CI job after flow run

### Phase 6 — Demo setup (Day 4, 2hrs)
- [ ] Confirm demo project has: 10+ open issues (some labeled `blocker`), 3+ open MRs, recent pipeline failures
- [ ] Nectic's own GitLab repo is a strong demo project (dogfooding story)
- [ ] Verify full loop: mention → report appears → action issue created → dashboard shows trend

### Phase 7 — Demo video (Day 5, 3hrs)
- [ ] Follow 3-minute script (see below)
- [ ] Lead with sparkline/longitudinal trend — NOT issue creation
- [ ] Show "Why Nectic flagged this" section clearly (Anthropic prize proof)
- [ ] Show action issue auto-created and assigned
- [ ] Show face on camera for first 45 seconds
- [ ] Upload to YouTube, set public, test link from incognito

### Phase 8 — Submission (Day 5–6)
- [ ] Devpost description: 600–800 words (problem → agent solution → platform thesis → Claude integration)
- [ ] Must state: "uses Claude Sonnet 4.6 through GitLab Duo Agent Platform as sole reasoning engine across a 4-step chain"
- [ ] Verify: repo in hackathon group, OSS license visible at top
- [ ] Verify: at least one public agent AND one public flow in AI Catalog
- [ ] Verify: demo video link works from incognito
- [ ] Submit before March 25, 2:00pm EDT

---

## Demo Video Script (3 minutes exact)

**0:00–0:45 — The Problem (face on camera)**
"I'm a product manager. Every Monday I spend 45 minutes before standup reading GitLab — which issues are blocked, which MRs are stale, which pipelines are failing. I'm doing pattern recognition. That's not what PMs are for."

Cut to GitLab project: 15 open issues, 4 stale MRs, 2 failed pipelines.
"This is a real project. Right now nobody has synthesized this into a decision."

**0:45–1:45 — The Agent Running**
"I mention Nectic in any issue. That's it."
Type `@ai-nectic-delivery-health please check this sprint's health` in issue comment.
Show flow session starting in `Automate > Flows`.
Narrate: "It's fetching open blockers. Checking stale MRs. Reading failed job logs. Running a 4-step Claude reasoning chain — classify, prioritise, recommend, synthesise."
Show Delivery Health Report appearing as comment.
Zoom in on "Why Nectic flagged this" section. Read one line aloud.
Show action issue auto-created, assigned to PM.

**1:45–2:30 — Longitudinal Memory (biggest differentiator)**
Switch to Nectic dashboard `/concept/gitlab`.
Show 3-week health sparkline: 7 → 5 → 3.
"Nectic remembers. Three weeks ago this project was healthy. Sprint velocity dropped 40%. Two new blockers, zero resolved. The PM doesn't investigate — they approve the action."

**2:30–3:00 — The Why**
"I built Nectic originally for CS teams — to detect churn in WhatsApp conversations. Same thesis: stop allocating expensive human judgment to pattern recognition. Computers are better at it. This is the same intelligence, applied to software delivery."
Show Nectic CS dashboard and GitLab dashboard side by side.
"Mention Nectic. Get clarity. Ship faster."

---

## Reusable Components from Existing Nectic

| Component | Status | Notes |
|---|---|---|
| `src/components/health-sparkline.tsx` | ✅ Reuse directly | Zero changes needed |
| `src/lib/concept-firestore.ts` | ✅ Extend | Add StoredProject + DeliveryHistoryEntry |
| `src/lib/arr-utils.ts` | ✅ Reference pattern | For delivery risk calculation |
| OpenRouter → Claude call pattern | ✅ Reuse | Same model, same prompt structure |
| Resend digest email | ✅ Reuse template | Adapt for delivery digest (post-hackathon) |
| Design system (Tailwind tokens) | ✅ Reuse all | `bg-neutral-50`, risk colors, card styles |
| `/api/concept/analyze` prompt structure | ✅ Adapt | Swap WhatsApp for GitLab snapshot as input |
| `concept-nav.tsx` | ✅ Add "GitLab" nav item | Only if fits cleanly |

---

## What NOT to Build for Hackathon

| Item | Reason |
|---|---|
| Full approval UI in Nectic dashboard | GitLab issue IS the approval surface |
| Weekly delivery digest email | Extra scope, not judged |
| Google Cloud integration | Different thesis, dilutes focus |
| Green Agent prize | Wrong thesis for this submission |
| Multi-user workspace for GitLab | Post-hackathon |
| Live WhatsApp connection | Already deferred, unrelated |

---

## Connection to Antler Pitch

This hackathon entry strengthens the Antler pitch in three ways:

1. **Platform proof** — "We started with CS teams and WhatsApp. The same engine now monitors engineering delivery health in GitLab. Same product, second vertical, proven in 18 days."

2. **Distribution** — The GitLab flow is a public artifact in the GitLab AI Catalog. Any of the 4,000+ hackathon participants can install it. That's a free distribution channel into engineering teams globally.

3. **Revenue bridge** — CS buyers and engineering buyers often sit in the same company. Once one team uses Nectic, the other has a reason to try the CS product.

**Revised one-sentence pitch for Antler:**
"Nectic is the autonomous signal-to-decision platform for B2B teams. We detect churn in WhatsApp for CS teams today, and delivery risk in GitLab for engineering teams — same AI engine, two workflows, one platform."

---

## Reference Links

- Hackathon: https://gitlab.devpost.com/
- Rules: https://gitlab.devpost.com/rules
- Resources: https://gitlab.devpost.com/resources
- Access request: https://contributors.gitlab.com/ai-hackathon
- GitLab Agent docs: https://docs.gitlab.com/user/duo_agent_platform/agents/
- Custom flows docs: https://docs.gitlab.com/user/duo_agent_platform/flows/custom/
- Agent tools list: https://docs.gitlab.com/user/duo_agent_platform/agents/tools/
- Flow YAML schema: https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md
- Model selection: https://docs.gitlab.com/user/duo_agent_platform/model_selection/
- Participant template example: https://gitlab.com/gitlab-ai-hackathon/participants/621485/-/issues/1
- Anthropic SDK: https://www.npmjs.com/package/@anthropic-ai/sdk
