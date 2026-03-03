# Nectic Brainstorm Audit

**Purpose:** Prioritized backlog. What to do now, what to defer, what to cut.

---

## Priority Framework

| Priority | Definition | Do when |
|----------|------------|---------|
| **P0** | Blocks core conversion. User can't get value. | Immediately |
| **P1** | High impact. Trust or clarity. User-facing. | This week |
| **P2** | Quality. Reduces friction. Internal clarity. | When P0/P1 done |
| **P3** | Nice to have. Defer. | After validation |
| **Cut** | Don't do. Explicit no. | Never (for v1) |

---

## Prioritized Backlog

### P0 — Blocker (Do First)

| # | Item | Why | Effort |
|---|------|-----|--------|
| 1 | **Upload fails without Redis** | User clicks Try free → uploads file → chat fails (session lost). Core flow broken in prod. | 1h |

**Action:** If Redis missing, show clear message: "Upload needs setup. Try sample demo instead." + link to /demo. Don't silently fail.

---

### P1 — Must Do (This Week)

| # | Item | Why | Effort |
|---|------|-----|--------|
| 2 | **Remove dead footer links** | About, Careers, Privacy, Terms → `#` does nothing. Looks broken. Hurts trust. | 15m |
| 3 | **Update NECTIC.md** | Excel upload done. Citation done. Doc says "Next" and "Cut" but we shipped. Strategy drift. | 15m |

---

### P2 — Should Do (When P0/P1 Done)

| # | Item | Why | Effort |
|---|------|-----|--------|
| 4 | **Remove orphaned components** | testimonials, customer-logos, feature-highlights, how-to-section. Dead code. | 20m |
| 5 | **Env vars in README** | OPENAI_API_KEY, UPSTASH_REDIS_*. Anyone deploying needs this. | 10m |
| 6 | **"Connect your data" copy** | On upload page. Points to signup. Clarify or remove until persistent storage exists. | 10m |

---

### P3 — Defer (After Validation)

| # | Item | Why defer |
|---|------|-----------|
| 7 | Demo analytics | Need traffic first. Validate before instrumenting. |
| 8 | Bahasa UI | Indonesia launch. After LOI. |
| 9 | IDR pricing | After 2+ LOIs. |
| 10 | Persistent upload (signup → save) | Bigger build. Validate demand first. |

---

### Cut (Won't Do for v1)

| Item | Why |
|------|-----|
| New About/Careers/Privacy/Terms pages | No content. Don't fake it. Remove links instead. |
| Hide agent creation entirely | Power users exist. Keep as secondary path. |
| OAuth, workflow builder | NECTIC.md says cut. |

---

## One Thing That Matters Most

**Reality:** Only Demo chat works. Upload → Chat fails in prod (no Redis). Auth/Dashboard/Agents fail (no Firebase). See `MVP_FLOW_AUDIT.md` for full trace.

**P0 #1:** Make Upload → Chat work in prod. Either: (a) Add Redis to Vercel, or (b) When Redis missing, show "Try sample demo" instead of silent failure.

---

## Recommended Execution Order

1. **P0 #1** — Upload Redis fallback (blocker)
2. **P1 #2** — Footer: remove or fix dead links
3. **P1 #3** — Update NECTIC.md
4. **P2 #4** — Delete orphaned components
5. **P2 #5** — README env vars

Stop after P1 if time-constrained. P2 can wait.

---

## Reference: User Flows

| Flow | Path | Auth? | Status |
|------|------|-------|--------|
| **Landing → Try** | / → Try free → /upload | No | ✅ Primary |
| **Upload → Chat** | /upload → upload file → chat | No | ✅ Works (needs Redis in prod) |
| **Sample demo** | /upload → "Or try sample data" → /demo | No | ✅ Fallback |
| **Signup** | /auth/signup | No | ✅ Exists |
| **Dashboard** | /dashboard | Yes | ✅ After login |
| **New Agent** | /dashboard → New Agent → /agents/new | Yes | ✅ Simplified |
| **Agent Chat** | /agents/[id]/chat | Yes | ✅ After agent created |

---

## 2. What Works

- **Landing:** Hero, How it works, ROI calculator, Competitive comparison, Use cases, Security, CTA, Footer
- **Upload flow:** Drag-drop, parse CSV/Excel, store in Redis or memory, chat on uploaded data
- **Demo:** Sample finance data, no signup
- **Citation:** Row indices in upload chat responses
- **Agents/new:** Simplified to name + collections + create; advanced in collapsible
- **Dashboard:** Upload Excel primary, New Agent secondary
- **Auth:** Login, signup, protected routes

---

## 3. What's Broken / Risky

| Issue | Where | Risk |
|-------|-------|------|
| **Upload without Redis** | /api/upload, upload-store | In-memory store is per-process. Vercel serverless = new process per request. **Upload will fail in prod** if Redis not configured. |
| **Footer dead links** | About, Careers → `#` | Click does nothing. Either remove or add real pages. |
| **Footer Contact** | `#contact` | Scrolls to CTA. Works but CTA section id is `contact` – fine. |
| **Privacy, Terms, Trust Center** | `#` | Dead links. |
| **Upload "Connect your data"** | Button links to /auth/signup | Signup exists but "Connect your data" doesn't persist uploads yet. Copy might confuse. |

---

## 4. Orphaned / Unused Code

| Component | Status | Action? |
|-----------|--------|---------|
| `how-to-section.tsx` | Not on home page | Remove or add to page |
| `testimonials-section.tsx` | Removed (fake testimonials) | Remove file |
| `customer-logos-section.tsx` | Removed (fake logos) | Remove file |
| `feature-highlights.tsx` | Removed from home | Remove file |
| `AgentForm.tsx` | Used? | Check – might be used in edit |
| `how-to-section` | Links to /auth/signup | Orphaned component |

---

## 5. Inconsistencies

| Area | Inconsistency |
|------|---------------|
| **NECTIC.md vs code** | NECTIC says "Cut agent creation for v1" but we kept it (simplified). Strategy doc not updated. |
| **PM_BREAKDOWN** | Says "Hide agent creation from nav" – we didn't. Dashboard still shows New Agent. |
| **Demo vs Upload** | Demo = sample data. Upload = user data. Both work. "Connect your data" on upload header points to signup – no persistent connect yet. |
| **Env vars** | Upload needs UPSTASH_REDIS_*. Demo needs OPENAI_API_KEY. No clear doc for deploy. |

---

## 6. Recommendations

### Remove
- [ ] `testimonials-section.tsx` – fake, removed from page
- [ ] `customer-logos-section.tsx` – fake, removed from page
- [ ] `feature-highlights.tsx` – removed from page
- [ ] `how-to-section.tsx` – orphaned, or repurpose

### Fix
- [ ] **Upload + Redis:** Add fallback or clear error when Redis missing. Or document: "Upload requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel."
- [ ] **Footer:** Replace `#` with `/` for About/Careers, or remove those links until pages exist
- [ ] **"Connect your data"** on upload: Clarify copy – e.g. "Save your data (sign up)" or remove until persistent storage exists

### Enhance
- [ ] **Upload error state:** When Redis missing, show: "Upload temporarily unavailable. Try sample demo."
- [ ] **README / NECTIC.md:** Add env vars needed for prod (OPENAI_API_KEY, UPSTASH_REDIS_*)
- [ ] **Demo analytics:** Track demo tries (Phase 3.1) – not done yet

### Defer
- Demo analytics
- Bahasa UI
- IDR pricing
- Persistent "Connect your data" (signup → save uploads)

---

## 7. Quick Wins (Pick One)

1. **Remove orphaned components** – 4 files, low risk
2. **Fix footer dead links** – Point to / or remove
3. **Upload Redis fallback** – Show friendly error when Redis missing
4. **Update NECTIC.md** – Mark Excel upload done, update "Next" and "Cut"

---

## 8. Open Questions

1. **Redis:** Is UPSTASH_REDIS configured in Vercel? If not, upload will fail in prod.
2. **Footer:** Keep About/Contact/Careers with `#` or remove until we have pages?
3. **Agent creation:** Keep as power-user path or hide from dashboard entirely?
4. **"Connect your data":** What should it do today? Signup only, or something else?
