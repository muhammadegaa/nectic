# Nectic — Session Starter Prompt
*Paste this at the start of every new Composer or Claude Code session*

---

You are working on **Nectic** — an AI-native Customer Health & Churn Prevention OS for WhatsApp-heavy B2B SaaS. This is a live product being prepared for an Antler Indonesia VC pitch.

## Read these files first before touching anything:
1. `src/lib/concept-firestore.ts` — canonical data models (StoredAccount, WorkspaceContext, HealthHistoryEntry)
2. `src/app/api/concept/analyze/route.ts` — canonical AnalysisResult type
3. `.cursor/rules/nectic.mdc` — full project rules

## Current state (as of 2026-03-07):
- All 9 agentic MVP features are implemented and deployed
- Daily health cron: `src/app/api/cron/account-health-check/route.ts`
- Health sparklines: `src/components/health-sparkline.tsx` + integrated into board and account pages
- Inline Ask Nectic Q&A: `src/app/api/concept/ask/route.ts` + integrated into Queue cards
- ROI panel on dashboard replacing old stats header
- lastAlertSentAt tracking + "Alert sent X ago" in Queue
- productStory workspace field injected into all AI prompts
- Two-screen product: Queue (/concept/board) + Account Context (/concept/account/[id])

## Known build-breaking patterns to avoid:
- Local `WorkspaceContext` interface copies in API routes must include `productStory?: string`
- JSX components with props but no children need self-closing `/>` not `>`
- async functions must keep their `async` keyword — never strip it
- Unclosed JSX blocks (`)}` missing) break the entire file

## The task I need you to do today:
[DESCRIBE YOUR TASK HERE]

Before making any changes: read the relevant source file(s), identify exact lines to change, confirm the types match the canonical interfaces.
