# AGENTS.md — Nectic

This file is read by Claude Code and agentic tools. Follow all instructions here precisely.

## Project
Nectic — AI-native Customer Health & Churn Prevention OS. Agentic product for WhatsApp-heavy B2B SaaS CS teams. Being pitched to Antler Indonesia VC.

## Canonical source of truth for types
- Data models: `src/lib/concept-firestore.ts`
- Analysis types: `src/app/api/concept/analyze/route.ts`
- Any local interface that duplicates these MUST include all fields (especially `productStory?: string` on WorkspaceContext)

## Before any code change
1. Read the file you are about to edit
2. Read the canonical interface if you are touching types
3. Run `npx tsc --noEmit` after changes — fix all type errors before committing

## Commit discipline
- Never commit code with TypeScript errors
- Never commit with broken JSX (unclosed tags, missing `)}`, stripped `async`)
- Commit messages: `fix:`, `feat:`, `refactor:` prefixes

## What is off-limits
- Adding new pages or nav items without explicit instruction
- Removing the daily cron job or health score tracking
- Implementing live WhatsApp (marked Coming Soon)
- Changing the two-screen product structure (Queue + Account Context)

## Stack
Next.js 14, TypeScript, Firebase/Firestore, OpenRouter (claude-sonnet-4-6 / claude-haiku-4-5), Resend, Vercel
