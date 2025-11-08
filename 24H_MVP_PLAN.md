# 24-Hour MVP Plan

**Goal:** Simplest possible product that validates the idea and can be sold

---

## Core Value Proposition

**"Discover your top AI automation opportunities in 5 minutes"**

**What users get:**
1. Complete 5-minute assessment
2. Get 3-5 personalized AI opportunities
3. See ROI (monthly savings, time saved)
4. Upgrade to see vendor recommendations & implementation guides

---

## MVP Feature Set (MINIMAL)

### ✅ KEEP (Core Value)
1. **Landing Page** - Sell the value, pricing, CTA
2. **Auth** - Signup/Login (email + Google)
3. **Assessment** - 5-7 questions max, smart skip logic
4. **Dashboard** - Shows opportunities, simple metrics
5. **Opportunity Detail** - ROI, benefits, requirements
6. **Checkout** - Stripe integration, free trial
7. **Settings** - Basic profile (name, email)

### ❌ REMOVE (Not MVP)
- Team page
- Documents page
- Implementation tracking
- Analytics dashboard
- Help page
- Admin pages
- Feature flags
- Complex onboarding flows
- Welcome pages
- Scanning pages
- Nested dashboard structure

---

## Simplified User Flow

```
Landing → Signup → Dashboard → Assessment → Dashboard (with opportunities) → Opportunity Detail → Upgrade
```

**Total pages:** 7 pages max

---

## Page Structure (CLEAN)

```
/                          → Landing (sell value)
/auth/login               → Login
/auth/signup              → Signup
/dashboard                → Main dashboard (shows opportunities or assessment prompt)
/dashboard/assessment     → Assessment (5-7 questions)
/dashboard/opportunities/[id] → Opportunity detail (ROI, benefits)
/dashboard/settings      → Basic settings (name, email)
/checkout                 → Stripe checkout
```

**That's it. 8 pages total.**

---

## What Each Page Does

### 1. Landing (`/`)
- Hero: "Discover your top AI opportunities"
- Value prop: "5-minute assessment → personalized opportunities"
- Pricing: Free trial, Standard $249, Premium $499
- CTA: "Start Free Trial"

### 2. Signup (`/auth/signup`)
- Email + password OR Google
- Collect: Name, Email, Company (optional)
- Redirect to dashboard

### 3. Dashboard (`/dashboard`)
- **If no assessment:** Show assessment prompt (big CTA)
- **If assessment done:** Show opportunities list
- **If generating:** Show loading state
- Simple metrics: Total savings, opportunities count

### 4. Assessment (`/dashboard/assessment`)
- 5-7 questions max
- Smart skip logic (only show relevant questions)
- Progress bar
- Submit → Generate opportunities → Redirect to dashboard

### 5. Opportunity Detail (`/dashboard/opportunities/[id]`)
- Title, description
- ROI: Monthly savings, time saved, impact score
- Benefits list
- Requirements list
- **Premium features:** Vendors, implementation guide (paywalled)

### 6. Settings (`/dashboard/settings`)
- Name, Email
- Subscription status
- Logout

### 7. Checkout (`/checkout`)
- Stripe integration
- Free trial option
- Plan selection

---

## Technical Simplifications

### Remove:
- `/dashboard/dashboard/*` nested structure
- `/dashboard/scanning` (dead page)
- `/dashboard/team` (mock data)
- `/dashboard/documents` (mock data)
- `/dashboard/help` (not needed)
- `/dashboard/analytics` (not MVP)
- `/dashboard/implementation/*` (not MVP)
- `/admin/*` (not MVP)
- All duplicate routes

### Consolidate:
- One opportunity detail page
- One settings page
- One profile page (merge with settings)

### Simplify:
- Assessment: 5-7 questions max
- Opportunities: 3-5 max per user
- No complex filtering/sorting (just show all)
- No pagination (show all opportunities)

---

## Data Model (MINIMAL)

### User Document:
```typescript
{
  uid: string
  email: string
  displayName: string
  hasCompletedAssessment: boolean
  subscription: {
    tier: "free" | "standard" | "premium"
    status: "active" | "trialing" | "canceled"
    currentPeriodEnd: Date
  }
  freeTrial?: {
    startDate: Date
    endDate: Date
  }
}
```

### Assessment Document:
```typescript
{
  userId: string
  answers: AssessmentAnswer[]
  scores: {
    documentAutomation: number
    customerServiceAI: number
    dataProcessing: number
    workflowAutomation: number
    overallReadiness: number
  }
  completedAt: Date
}
```

### Opportunity Document:
```typescript
{
  id: string
  userId: string
  title: string
  description: string
  monthlySavings: number
  timeSavedHours: number
  impactScore: number
  benefits: string[]
  requirements: string[]
  recommended: boolean
  quickWin: boolean
  createdAt: Date
}
```

**That's it. 3 collections.**

---

## Success Criteria

✅ **User can sign up in < 30 seconds**
✅ **User can complete assessment in < 5 minutes**
✅ **User sees opportunities in < 1 minute after assessment**
✅ **User understands ROI immediately**
✅ **User can upgrade to see vendors**

---

## Implementation Order

1. **Delete all non-MVP pages** (team, documents, implementation, etc.)
2. **Consolidate routes** (remove `/dashboard/dashboard/*`)
3. **Simplify assessment** (5-7 questions max)
4. **Clean dashboard** (show opportunities or assessment prompt)
5. **Simplify opportunity detail** (ROI + benefits only)
6. **Test end-to-end flow**

---

**Let's execute this now.**

