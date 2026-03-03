# MVP Flow Audit — What Actually Works

**Reality check:** Chat works. Everything else has gaps. This traces each flow end-to-end.

---

## MVP Definition (from NECTIC)

**"Upload Excel → Ask question → Get answer in 30 seconds."**

No signup. No agent config. Connect data → Chat.

---

## Flow 1: Demo (Sample Data)

| Step | What happens | Works? | Depends on |
|------|--------------|--------|------------|
| User visits / | Landing loads | ✅ | Nothing |
| Clicks "Try free" | Goes to /upload | ✅ | Nothing |
| Clicks "Or try sample data" | Goes to /demo | ✅ | Nothing |
| Asks question on /demo | POST /api/chat/demo | ✅ | OPENAI_API_KEY |
| Gets answer | Sample finance data, embedded | ✅ | OPENAI_API_KEY |

**Verdict:** Works if OPENAI_API_KEY is set. No Firebase, no Redis.

---

## Flow 2: Upload → Chat (Core MVP)

| Step | What happens | Works? | Depends on |
|------|--------------|--------|------------|
| User visits /upload | Upload UI loads | ✅ | Nothing |
| Drops CSV/Excel file | POST /api/upload | ⚠️ | xlsx, upload-store |
| Upload parses file | parseSpreadsheet() | ✅ CSV / ⚠️ Excel | xlsx in node_modules |
| Upload stores session | setUploadSession() | ❌ Prod | Redis (Upstash) |
| Returns sessionId | Client gets it | ✅ | Store succeeded |
| User asks question | POST /api/chat/upload | ❌ Prod | getUploadSession() |
| Chat fetches session | getUploadSession(sessionId) | ❌ Prod | Redis or same process |
| Chat calls LLM | callLLM() | ✅ | OPENAI_API_KEY |
| Returns answer | With citation | ✅ | If session was found |

**Verdict:** 
- **Local dev:** May work if same Node process (in-memory store). Unreliable.
- **Vercel prod:** Fails. Serverless = different instances. In-memory doesn't persist. Redis required.

**Missing:** UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN in Vercel.

---

## Flow 3: Signup → Dashboard

| Step | What happens | Works? | Depends on |
|------|--------------|--------|------------|
| User clicks "Connect your data" or goes to /auth/signup | Signup page loads | ✅ | Nothing |
| Enters email/password or Google | signUpWithEmail / signInWithGoogle | ❌ | Firebase config |
| Firebase Auth | createUserWithEmailAndPassword | ❌ | 6 NEXT_PUBLIC_* vars |
| Redirect to /dashboard | router.push | ✅ | If auth succeeded |
| Dashboard fetches agents | GET /api/agents | ❌ | requireAuth, Firebase Admin |
| Agents from Firestore | FirebaseAgentRepository | ❌ | FIREBASE_SERVICE_ACCOUNT_KEY |

**Verdict:** Fails without Firebase. Auth, dashboard, agents all need it.

**Missing:** NEXT_PUBLIC_FIREBASE_*, FIREBASE_SERVICE_ACCOUNT_KEY.

---

## Flow 4: Create Agent → Agent Chat

| Step | What happens | Works? | Depends on |
|------|--------------|--------|------------|
| User on dashboard, clicks "New Agent" | Goes to /agents/new | ✅ | Auth |
| Fills name + collections, clicks Create | POST /api/agents | ❌ | Auth, Firebase, Firestore |
| Agent saved to Firestore | FirebaseAgentRepository | ❌ | Firebase |
| Redirect to /agents/[id]/chat | Chat page loads | ✅ | If agent created |
| User asks question | POST /api/chat (with agentId) | ❌ | Auth, Firebase |
| Chat queries Firestore | finance_transactions, etc. | ❌ | Firestore seeded |
| Returns answer | From Firestore data | ❌ | /api/seed run |

**Verdict:** Full chain fails without Firebase + Firestore seed. Even with Firebase, collections may be empty unless seeded.

**Missing:** Firebase, Firestore seed (finance_transactions, sales_deals, hr_employees).

---

## Summary: What Works Today

| Flow | Works? | Min requirements |
|------|--------|------------------|
| **Demo (sample data)** | ✅ | OPENAI_API_KEY |
| **Upload → Chat** | ❌ Prod | OPENAI_API_KEY + Redis |
| **Signup / Login** | ❌ | Firebase (6 vars + service account) |
| **Dashboard** | ❌ | Auth (Firebase) |
| **Create Agent** | ❌ | Auth + Firebase + Firestore |
| **Agent Chat** | ❌ | Auth + Firebase + seeded Firestore |

**Only Demo works out of the box.**

---

## What MVP Actually Needs (Priority Order)

### P0 — Make Upload → Chat work in prod

1. **Redis in Vercel** — Add UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.
2. **OR** — If no Redis: Redirect upload to demo. "Upload coming soon. Try sample data."
3. **Fallback** — When Redis missing, upload API returns 503 with message: "Upload temporarily unavailable. Try sample demo."

### P1 — Document what's required

4. **README / .env.example** — List env vars per flow:
   - Demo: OPENAI_API_KEY
   - Upload: + UPSTASH_REDIS_*
   - Auth/Dashboard/Agents: + Firebase vars

### P2 — Don't promise what doesn't work

5. **Landing "Try free"** — If upload will fail, either fix it or change CTA to "Try demo" until Redis is configured.
6. **"Connect your data"** on upload — Points to signup. Signup fails without Firebase. Remove or change copy.

---

## Recommended Fix Order

1. **Add Redis fallback** — Upload API: if Redis missing, return clear error. Upload page: show "Try sample demo" link.
2. **Configure Redis in Vercel** — So upload actually works.
3. **Update landing** — If Redis not configured, "Try free" could go to /demo instead of /upload. Or add health check.
4. **Document** — README: "For upload to work in prod, add Upstash Redis."

---

## Open Question

**Is Redis configured in Vercel?** If yes, upload may work. If no, it will fail. The code doesn't check or degrade gracefully.
