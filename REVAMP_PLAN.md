# Complete Project Revamp Plan

**Date:** Today  
**Status:** 🚨 **EXECUTING NOW**

---

## CRITICAL ISSUES FOUND

### 1. Route Chaos
- **Duplicate routes:** `/login` + `/auth/login`, `/signup` + `/auth/signup`, `/onboarding` + `/auth/onboarding`
- **Nested confusion:** `/dashboard/dashboard/*` structure
- **Dead routes:** `/dashboard/scanning` (deprecated), `/auth/welcome` (redundant)
- **Result:** Users confused, SEO broken, maintenance nightmare

### 2. Mock Data Everywhere
- **184 TODO/FIXME/mock references** across 50 files
- Implementation pages use `mockProjects`
- Team pages use `mockTeamMembers`
- Documents page uses hardcoded array
- **Result:** Nothing works with real data

### 3. Broken Architecture
- Two opportunity detail pages (`/dashboard/opportunities/[id]` + `/dashboard/dashboard/opportunities/[id]`)
- Two settings pages
- Two profile pages
- **Result:** Inconsistent UX, bugs, confusion

### 4. Assessment Flow Still Broken
- Answer extraction fixed but flow is convoluted
- Multiple redirects
- No clear state management
- **Result:** Users get lost

---

## REVAMP STRATEGY

### Phase 1: Clean Route Structure (NOW)
**Goal:** Single source of truth for all routes

**New Structure:**
```
/                          → Landing
/auth/login               → Login (ONLY)
/auth/signup              → Signup (ONLY)
/dashboard                → Main dashboard
/dashboard/assessment     → Assessment
/dashboard/opportunities → Opportunities list
/dashboard/opportunities/[id] → Opportunity detail
/dashboard/settings      → Settings (ONLY)
/checkout                → Checkout
```

**Delete:**
- `/login` → Redirect to `/auth/login`
- `/signup` → Redirect to `/auth/signup`
- `/onboarding` → Redirect to `/dashboard`
- `/auth/onboarding` → Redirect to `/dashboard`
- `/auth/welcome` → Redirect to `/dashboard`
- `/welcome` → Redirect to `/dashboard`
- `/dashboard/dashboard/*` → Move to `/dashboard/*`
- `/dashboard/scanning` → Remove (dead)

### Phase 2: Remove All Mock Data (NOW)
**Goal:** Everything uses real Firestore data

**Fix:**
- Implementation page → Load from opportunities with implementationSteps
- Team page → Load from Firestore or remove (not MVP)
- Documents page → Load from Firestore or remove (not MVP)
- Vendors page → Generate from opportunity data

### Phase 3: Consolidate Duplicate Pages (NOW)
**Goal:** One implementation per feature

**Merge:**
- `/dashboard/opportunities/[id]` + `/dashboard/dashboard/opportunities/[id]` → Keep one
- `/dashboard/settings` + `/dashboard/dashboard/settings` → Keep one
- `/dashboard/profile` + `/dashboard/dashboard/profile` → Keep one

### Phase 4: Simplify Assessment Flow (NOW)
**Goal:** Clean, linear flow

**New Flow:**
```
Signup → Dashboard → Assessment (if not done) → Dashboard (with opportunities)
```

**Remove:**
- Scanning page
- Welcome page
- Multiple redirects

---

## EXECUTION PLAN

### Step 1: Route Cleanup
1. Create redirects for old routes
2. Delete duplicate route files
3. Consolidate `/dashboard/dashboard/*` → `/dashboard/*`
4. Update all internal links

### Step 2: Remove Mock Data
1. Fix implementation page to use real data
2. Remove or fix team page
3. Remove or fix documents page
4. Fix vendors page

### Step 3: Consolidate Pages
1. Keep best implementation of each page
2. Delete duplicates
3. Update all links

### Step 4: Test Everything
1. Test signup flow
2. Test assessment flow
3. Test opportunity viewing
4. Test checkout flow

---

## SUCCESS CRITERIA

✅ **Zero duplicate routes**
✅ **Zero mock data in production flows**
✅ **Single implementation per feature**
✅ **Clean, linear user flow**
✅ **All links work**
✅ **Build passes**
✅ **No console errors**

---

**Let's execute this now.**

