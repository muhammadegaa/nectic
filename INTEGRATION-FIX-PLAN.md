# Integration Fix Plan - Action Items

## Priority 1: Fix Broken UX (Users Can Connect But Can't Use)

### Task 1: Hide Non-Functional Integrations
**Problem:** 20+ providers show in UI, users can connect OAuth, but agents can't use them (no tool executors)

**Solution:** Filter providers list to only show ones with working executors

**Files to change:**
- `src/lib/oauth-providers.ts` - Add `isFunctional: boolean` flag to each provider
- `src/components/agents/OAuthConnections.tsx` - Filter to only show `isFunctional: true`

**Working integrations (keep):**
- slack ✅
- google-workspace ✅ (needs env vars)
- salesforce ✅ (needs env vars)
- notion ✅ (needs env vars)
- hubspot ⚠️ (needs testing)
- zendesk ⚠️ (needs testing)
- stripe ⚠️ (needs testing - may need different auth)

**Non-functional (hide):**
- microsoft-teams, discord, pipedrive, google-drive, dropbox, aws-s3, confluence, google-analytics, mixpanel, amplitude, paypal, square, asana, trello, jira, linear

---

## Priority 2: Make Existing Integrations Work

### Task 2: Add Environment Variable Documentation
**Problem:** Google, Salesforce, Notion need env vars but not documented

**Solution:** 
- Update `.env.example` with required vars
- Update README with setup instructions

**Env vars needed:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
ZENDESK_CLIENT_ID=
ZENDESK_CLIENT_SECRET=
```

### Task 3: Add Error Handling for Missing Env Vars
**Problem:** OAuth fails silently when env vars missing

**Solution:** Check env vars in OAuth route, return clear error

**File:** `src/app/api/oauth/[provider]/route.ts`

---

## Priority 3: Test and Fix Partial Implementations

### Task 4: Test HubSpot Executor
**File:** `src/lib/integration-tool-executors.ts` (executeHubSpotTool)
**Action:** Test with real OAuth token, verify all tools work

### Task 5: Test Zendesk Executor  
**File:** `src/lib/integration-tool-executors.ts` (executeZendeskTool)
**Action:** Test with real OAuth token, verify subdomain handling works

### Task 6: Fix Stripe Integration
**Problem:** Stripe uses API keys, not OAuth
**Action:** Check if Stripe executor uses OAuth or API keys, fix accordingly

---

## Priority 4: Cleanup

### Task 7: Remove PostHog
**Action:** Remove from package.json, check for any imports

### Task 8: Add Status Badges in UI
**Action:** Show "Working", "Coming Soon", "Needs Setup" badges

---

## Quick Wins (Do First)

1. **Hide non-functional providers** - Immediate UX fix
2. **Add env var docs** - Enable Google/Salesforce/Notion
3. **Add error handling** - Better user experience

## Estimated Time

- Task 1: 30 min
- Task 2: 15 min  
- Task 3: 20 min
- Task 4-6: 1-2 hours each (testing)
- Task 7: 5 min
- Task 8: 30 min

**Total: ~4-6 hours for quick wins, +3-6 hours for testing**

