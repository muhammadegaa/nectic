# Testing Guide - Single Source of Truth

This is the **only** testing guide you need. It covers everything from basic setup to production testing.

---

## Quick Start

### Automated Tests (Run First)
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui
```

### Manual Tests
1. **Start the server**: `npm run dev`
2. **Log in** to your account
3. **Follow the manual test steps below**

---

## Part 1: Critical Path Tests (MVP Launch)

### Test 1: User Signup Flow

**Goal:** Verify new users can create accounts

**Prerequisites:**
- Server running: `npm run dev`
- Browser open to `http://localhost:3000`

**Steps (Atomic):**
1. Navigate to: `http://localhost:3000/auth/signup`
2. **Verify page loads:**
   - [ ] Page title shows "Sign Up" or "Create Account"
   - [ ] Email input field is visible
   - [ ] Password input field is visible
   - [ ] Confirm Password input field is visible
   - [ ] "Sign Up" button is visible
   - [ ] "Sign in with Google" button is visible (if enabled)

3. **Test email validation:**
   - [ ] Type invalid email: `test@` → Should show error
   - [ ] Type valid email: `test@example.com` → Error should clear
   - [ ] Clear email → Error should clear

4. **Test password validation:**
   - [ ] Type password less than 6 chars: `12345` → Should show error
   - [ ] Type password 6+ chars: `password123` → Error should clear
   - [ ] Clear password → Error should clear

5. **Test password match:**
   - [ ] Type password: `password123`
   - [ ] Type different confirm password: `password456` → Should show "Passwords do not match"
   - [ ] Type matching confirm password: `password123` → Error should clear

6. **Test signup:**
   - [ ] Fill in valid email: `test@example.com`
   - [ ] Fill in password: `password123`
   - [ ] Fill in confirm password: `password123`
   - [ ] Click "Sign Up" button
   - [ ] **Expected:** Loading spinner appears
   - [ ] **Expected:** Redirects to `/dashboard` or shows success message
   - [ ] **Expected:** User is logged in

7. **Verify in Firebase Console:**
   - [ ] Go to Firebase Console → Authentication
   - [ ] Verify new user appears with email `test@example.com`

**Success Criteria:**
- ✅ User can sign up with valid credentials
- ✅ Validation errors show correctly
- ✅ User is redirected after signup
- ✅ User appears in Firebase Auth

**Failure Indicators:**
- ❌ Page doesn't load
- ❌ Validation doesn't work
- ❌ Signup button doesn't respond
- ❌ Error messages not user-friendly
- ❌ User not created in Firebase

---

### Test 2: User Login Flow

**Goal:** Verify existing users can log in

**Prerequisites:**
- User account exists (from Test 1 or manually created)
- Server running: `npm run dev`

**Steps (Atomic):**
1. Navigate to: `http://localhost:3000/auth/login`
2. **Verify page loads:**
   - [ ] Page title shows "Sign In" or "Login"
   - [ ] Email input field is visible
   - [ ] Password input field is visible
   - [ ] "Sign In" button is visible
   - [ ] "Sign in with Google" button is visible
   - [ ] "Forgot Password?" link is visible (if implemented)
   - [ ] "Don't have an account? Sign up" link is visible

3. **Test invalid login:**
   - [ ] Type email: `wrong@example.com`
   - [ ] Type password: `wrongpassword`
   - [ ] Click "Sign In"
   - [ ] **Expected:** Error message appears (e.g., "Invalid credentials")
   - [ ] **Expected:** User stays on login page
   - [ ] **Expected:** Error message is user-friendly (no stack traces)

4. **Test valid login:**
   - [ ] Type correct email: `test@example.com` (from Test 1)
   - [ ] Type correct password: `password123`
   - [ ] Click "Sign In"
   - [ ] **Expected:** Loading spinner appears
   - [ ] **Expected:** Redirects to `/dashboard`
   - [ ] **Expected:** User is logged in (check navigation shows user info)

5. **Verify session:**
   - [ ] Refresh the page (`F5`)
   - [ ] **Expected:** User remains logged in
   - [ ] **Expected:** Still on dashboard (not redirected to login)

**Success Criteria:**
- ✅ User can log in with valid credentials
- ✅ Invalid credentials show clear error
- ✅ User is redirected after login
- ✅ Session persists on refresh

**Failure Indicators:**
- ❌ Login doesn't work with valid credentials
- ❌ No error message for invalid credentials
- ❌ User not redirected after login
- ❌ Session doesn't persist

---

### Test 3: Create New Agent

**Goal:** Verify users can create AI agents

**Prerequisites:**
- User is logged in (from Test 2)
- Server running: `npm run dev`

**Steps (Atomic):**
1. Navigate to: `http://localhost:3000/agents/new`
2. **Verify page loads:**
   - [ ] Page title shows "Create New AI Agent"
   - [ ] Name input field is visible
   - [ ] Description textarea is visible (optional)
   - [ ] Collections selector is visible
   - [ ] "Create Agent" or "Save" button is visible

3. **Test validation:**
   - [ ] Click "Create Agent" without filling anything
   - [ ] **Expected:** Error message appears (e.g., "Name is required")
   - [ ] **Expected:** Error highlights the name field

4. **Test agent creation:**
   - [ ] Type agent name: `Finance Assistant`
   - [ ] Type description: `Helps with financial queries` (optional)
   - [ ] Select at least one collection (e.g., `finance_transactions`)
   - [ ] Click "Create Agent"
   - [ ] **Expected:** Loading spinner appears
   - [ ] **Expected:** Success message appears (e.g., "Agent created successfully")
   - [ ] **Expected:** Redirects to agent chat page: `/agents/[agentId]/chat`

5. **Verify agent in dashboard:**
   - [ ] Navigate to: `http://localhost:3000/dashboard`
   - [ ] **Expected:** "Finance Assistant" appears in agents list
   - [ ] **Expected:** Can click on agent to open chat

6. **Verify in Firebase:**
   - [ ] Go to Firebase Console → Firestore
   - [ ] Navigate to `agents` collection
   - [ ] **Expected:** New agent document exists
   - [ ] **Expected:** Document has `name`, `userId`, `collections` fields

**Success Criteria:**
- ✅ Agent can be created with required fields
- ✅ Validation works correctly
- ✅ Agent appears in dashboard
- ✅ Agent is saved to Firestore
- ✅ User is redirected to chat page

**Failure Indicators:**
- ❌ Page doesn't load
- ❌ Validation doesn't work
- ❌ Agent not created
- ❌ Agent not saved to database
- ❌ No redirect after creation

---

### Test 4: Chat with Agent

**Goal:** Verify agents can respond to messages

**Prerequisites:**
- User is logged in
- Agent exists (from Test 3)
- Server running: `npm run dev`
- OpenAI API key configured

**Steps (Atomic):**
1. Navigate to agent chat page: `http://localhost:3000/agents/[agentId]/chat`
2. **Verify page loads:**
   - [ ] Agent name appears at top
   - [ ] Chat message input field is visible
   - [ ] Send button is visible
   - [ ] Chat history area is visible (may be empty)

3. **Test sending message:**
   - [ ] Type message: `What are our recent transactions?`
   - [ ] Click "Send" button (or press Enter)
   - [ ] **Expected:** Message appears in chat immediately
   - [ ] **Expected:** Loading indicator appears (e.g., "Agent is thinking...")
   - [ ] **Expected:** Input field clears

4. **Test agent response:**
   - [ ] Wait for response (may take 5-30 seconds)
   - [ ] **Expected:** Agent response appears in chat
   - [ ] **Expected:** Response is formatted nicely
   - [ ] **Expected:** No error messages

5. **Test multiple messages:**
   - [ ] Send second message: `Show me the top 5 transactions`
   - [ ] **Expected:** Both messages appear in chat history
   - [ ] **Expected:** Agent responds to second message
   - [ ] **Expected:** Chat history is maintained

6. **Test error handling:**
   - [ ] Send empty message (just spaces)
   - [ ] **Expected:** Message is not sent (or shows validation error)
   - [ ] Send message while previous one is loading
   - [ ] **Expected:** Second message waits or queues properly

7. **Verify in browser console:**
   - [ ] Open browser DevTools (`F12`)
   - [ ] Go to Network tab
   - [ ] Send a message
   - [ ] **Expected:** POST request to `/api/chat` appears
   - [ ] **Expected:** Request has `Authorization` header
   - [ ] **Expected:** Response status is 200 (not 401, 500, etc.)

**Success Criteria:**
- ✅ Messages can be sent
- ✅ Agent responds with relevant information
- ✅ Chat history is maintained
- ✅ No errors in console
- ✅ API calls succeed

**Failure Indicators:**
- ❌ Messages don't send
- ❌ Agent doesn't respond
- ❌ Errors appear in console
- ❌ API returns 401 (unauthorized)
- ❌ API returns 500 (server error)

---

### Test 5: View Audit Logs

**Goal:** Verify audit logs are visible and accurate

**Prerequisites:**
- User is logged in
- Agent exists
- At least one chat message sent (from Test 4)

**Steps (Atomic):**
1. Navigate to audit logs: `http://localhost:3000/agents/[agentId]/audit`
2. **Verify page loads:**
   - [ ] Page title shows "Audit Logs"
   - [ ] Agent name appears at top
   - [ ] Table with columns: Time, Type, Source, Details, Status, Duration
   - [ ] Filter tabs visible: "All", "Tool Calls", "Data Access"

3. **Verify log entries:**
   - [ ] **Expected:** At least one log entry appears (from Test 4)
   - [ ] **Expected:** Time column shows timestamp
   - [ ] **Expected:** Type column shows "tool call" or "data access"
   - [ ] **Expected:** Status column shows checkmark (✓) or X
   - [ ] **Expected:** Duration column shows time in ms

4. **Test filtering:**
   - [ ] Click "Tool Calls" tab
   - [ ] **Expected:** Only tool call entries shown
   - [ ] Click "Data Access" tab
   - [ ] **Expected:** Only data access entries shown
   - [ ] Click "All" tab
   - [ ] **Expected:** All entries shown

5. **Verify log details:**
   - [ ] Click on a log entry (if expandable)
   - [ ] **Expected:** More details appear (tool name, collection, etc.)
   - [ ] **Expected:** No sensitive data exposed

**Success Criteria:**
- ✅ Audit logs page loads
- ✅ Log entries appear after chat activity
- ✅ Filtering works correctly
- ✅ Log details are accurate

**Failure Indicators:**
- ❌ Page doesn't load
- ❌ No log entries appear
- ❌ Filtering doesn't work
- ❌ Sensitive data exposed

---

## Part 2: Security & Authorization Tests

### Test 6: Authentication Required (Protected Routes)

**Goal:** Verify unauthenticated users cannot access protected pages

**Prerequisites:**
- Server running: `npm run dev`
- User is NOT logged in (use incognito/private window)

**Steps (Atomic):**
1. **Test dashboard access:**
   - [ ] Navigate to: `http://localhost:3000/dashboard`
   - [ ] **Expected:** Redirects to `/auth/login`
   - [ ] **Expected:** URL shows redirect parameter

2. **Test agents page:**
   - [ ] Navigate to: `http://localhost:3000/agents`
   - [ ] **Expected:** Redirects to `/auth/login`

3. **Test agent creation:**
   - [ ] Navigate to: `http://localhost:3000/agents/new`
   - [ ] **Expected:** Redirects to `/auth/login`

4. **Test agent chat:**
   - [ ] Navigate to: `http://localhost:3000/agents/[anyId]/chat`
   - [ ] **Expected:** Redirects to `/auth/login`

5. **Test API endpoints:**
   - [ ] Open browser DevTools (`F12`) → Network tab
   - [ ] Navigate to: `http://localhost:3000/api/agents`
   - [ ] **Expected:** Response status is 401 (Unauthorized)
   - [ ] **Expected:** Response body shows error message

**Success Criteria:**
- ✅ All protected routes redirect to login
- ✅ API endpoints return 401 without auth
- ✅ No data is exposed to unauthenticated users

**Failure Indicators:**
- ❌ Protected pages accessible without login
- ❌ API returns data without authentication
- ❌ Sensitive data exposed

---

### Test 7: Restricted Access (Denied Queries)

**Goal:** Verify agents cannot access unauthorized data

**Prerequisites:**
- User is logged in
- Agent exists with restricted access (only `finance_transactions` collection)
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Create restricted agent:**
   - [ ] Navigate to: `http://localhost:3000/agents/new`
   - [ ] Name: `Finance Only Agent`
   - [ ] Select ONLY `finance_transactions` collection
   - [ ] DO NOT select `sales_deals` or `hr_employees`
   - [ ] Create agent

2. **Test authorized query:**
   - [ ] Navigate to agent chat page
   - [ ] Send message: `Show me recent financial transactions`
   - [ ] **Expected:** Agent responds with transaction data
   - [ ] **Expected:** No error messages

3. **Test unauthorized query:**
   - [ ] Send message: `Show me sales deals`
   - [ ] **Expected:** Agent responds with error (e.g., "Access denied" or "Not authorized")
   - [ ] **Expected:** NO sales data is returned
   - [ ] **Expected:** Error message is user-friendly

4. **Verify in audit logs:**
   - [ ] Navigate to: `/agents/[agentId]/audit`
   - [ ] **Expected:** See log entry for denied query
   - [ ] **Expected:** Status column shows red X (✗)
   - [ ] **Expected:** Details column shows "Denied" or error message
   - [ ] **Expected:** Collection name shows `sales_deals` (what was attempted)

5. **Test another unauthorized collection:**
   - [ ] Go back to chat
   - [ ] Send message: `Show me employee records`
   - [ ] **Expected:** Access denied error
   - [ ] **Expected:** No HR data returned

**Success Criteria:**
- ✅ Agent can access authorized collections
- ✅ Agent cannot access unauthorized collections
- ✅ Denied access is logged in audit
- ✅ Error messages are clear and safe

**Failure Indicators:**
- ❌ Agent can access unauthorized data
- ❌ No error shown for denied access
- ❌ Sensitive data exposed
- ❌ Audit logs don't show denied attempts

---

---

### Test 8: Field Filtering

**Goal:** Verify agents only return allowed fields

**Prerequisites:**
- User is logged in
- Agent exists with field restrictions configured
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Create agent with field restrictions:**
   - [ ] Navigate to: `http://localhost:3000/agents/new`
   - [ ] Name: `Restricted Fields Agent`
   - [ ] Select collection: `finance_transactions`
   - [ ] Configure allowed fields: ONLY `id`, `date`, `amount`, `category`
   - [ ] DO NOT allow: `description`, `vendor`, `notes`, etc.
   - [ ] Create agent

2. **Test field filtering:**
   - [ ] Navigate to agent chat
   - [ ] Send message: `Show me recent transactions`
   - [ ] **Expected:** Response contains data
   - [ ] **Expected:** Response ONLY shows: `id`, `date`, `amount`, `category`
   - [ ] **Expected:** Response does NOT show: `description`, `vendor`, `notes`

3. **Verify in response:**
   - [ ] Open browser DevTools (`F12`) → Network tab
   - [ ] Find the `/api/chat` request
   - [ ] Click on it → Response tab
   - [ ] **Expected:** Response JSON only contains allowed fields
   - [ ] **Expected:** No sensitive fields in response

4. **Test with different query:**
   - [ ] Send message: `What transactions do we have?`
   - [ ] **Expected:** Same field restrictions apply
   - [ ] **Expected:** No additional fields exposed

**Success Criteria:**
- ✅ Only allowed fields are returned
- ✅ Sensitive fields are hidden
- ✅ Field filtering works consistently

**Failure Indicators:**
- ❌ All fields are returned
- ❌ Sensitive fields exposed
- ❌ Field restrictions not working

---

---

### Test 9: Tool Restrictions

**Goal:** Verify agents can only use allowed tools

**Prerequisites:**
- User is logged in
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Create agent with no tools:**
   - [ ] Navigate to: `http://localhost:3000/agents/new`
   - [ ] Name: `No Tools Agent`
   - [ ] Select collections: `finance_transactions`
   - [ ] Configure: `allowedTools: []` (empty array - no tools)
   - [ ] Create agent

2. **Test tool restriction:**
   - [ ] Navigate to agent chat
   - [ ] Send message: `Query the finance_transactions collection`
   - [ ] **Expected:** Error message appears (e.g., "Tool not allowed" or "Access denied")
   - [ ] **Expected:** No data is returned
   - [ ] **Expected:** Error is user-friendly

3. **Verify in audit logs:**
   - [ ] Navigate to: `/agents/[agentId]/audit`
   - [ ] **Expected:** Log entry for denied tool call
   - [ ] **Expected:** Status shows red X (✗)
   - [ ] **Expected:** Details show tool name and "Denied"

4. **Test with allowed tool:**
   - [ ] Edit agent (if possible) or create new agent
   - [ ] Configure: `allowedTools: ['query_collection']`
   - [ ] Send same message
   - [ ] **Expected:** Tool executes successfully
   - [ ] **Expected:** Data is returned

**Success Criteria:**
- ✅ Agents cannot use unauthorized tools
- ✅ Tool restrictions are enforced
- ✅ Denied tool calls are logged

**Failure Indicators:**
- ❌ Agents can use unauthorized tools
- ❌ No error for restricted tools
- ❌ Tool restrictions not working

---

## Part 3: Rate Limiting & Performance Tests

### Test 10: Rate Limiting

**Goal:** Verify rate limiting prevents abuse

**Prerequisites:**
- User is logged in
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Test normal usage:**
   - [ ] Navigate to agent chat
   - [ ] Send 5 messages (one at a time, wait for response)
   - [ ] **Expected:** All messages work normally
   - [ ] **Expected:** No rate limit errors

2. **Test rate limit:**
   - [ ] Send 10+ messages rapidly (within 1 minute)
   - [ ] **Expected:** After ~10 messages, rate limit error appears
   - [ ] **Expected:** Error message: "Rate limit exceeded" or "Too many requests"
   - [ ] **Expected:** Response status is 429
   - [ ] **Expected:** Response includes `Retry-After` header

3. **Verify rate limit headers:**
   - [ ] Open DevTools → Network tab
   - [ ] Find rate-limited request
   - [ ] **Expected:** Response headers include:
     - `X-RateLimit-Limit: 10`
     - `X-RateLimit-Remaining: 0`
     - `Retry-After: [number]`

4. **Test after wait:**
   - [ ] Wait 1-2 minutes
   - [ ] Send another message
   - [ ] **Expected:** Message works normally
   - [ ] **Expected:** Rate limit reset

**Success Criteria:**
- ✅ Rate limiting works (10 req/min)
- ✅ Clear error messages
- ✅ Rate limit resets after time window

**Failure Indicators:**
- ❌ No rate limiting
- ❌ Rate limit too strict
- ❌ No error message

---

## Part 4: Production Testing

### Test 11: Multiple Agents

**Goal:** Verify each agent has isolated logs

**Prerequisites:**
- User is logged in
- At least 2 agents created
- Both agents have been used (sent messages)

**Steps (Atomic):**
1. **Create Agent A:**
   - [ ] Create agent: `Agent A - Finance`
   - [ ] Send message: `Show transactions`
   - [ ] Note the agent ID from URL

2. **Create Agent B:**
   - [ ] Create agent: `Agent B - Sales`
   - [ ] Send message: `Show sales deals`
   - [ ] Note the agent ID from URL

3. **View Agent A logs:**
   - [ ] Navigate to: `/agents/[agentA-id]/audit`
   - [ ] **Expected:** Page title shows "Agent A - Finance"
   - [ ] **Expected:** Log entries appear
   - [ ] **Expected:** Logs are related to finance queries
   - [ ] Note: Count of log entries

4. **View Agent B logs:**
   - [ ] Navigate to: `/agents/[agentB-id]/audit`
   - [ ] **Expected:** Page title shows "Agent B - Sales"
   - [ ] **Expected:** Different log entries appear
   - [ ] **Expected:** Logs are related to sales queries
   - [ ] Note: Count of log entries

5. **Verify isolation:**
   - [ ] Compare log counts (should be different)
   - [ ] **Expected:** Agent A logs ≠ Agent B logs
   - [ ] **Expected:** No cross-contamination
   - [ ] **Expected:** Each agent shows only its own activity

**Success Criteria:**
- ✅ Each agent has separate logs
- ✅ No log mixing between agents
- ✅ Agent names displayed correctly

**Failure Indicators:**
- ❌ Logs are mixed between agents
- ❌ Wrong agent name displayed
- ❌ Can see other agents' logs

---

---

### Test 12: Error Handling

**Goal:** Verify errors are safe and user-friendly

**Prerequisites:**
- User is logged in
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Test non-existent agent:**
   - [ ] Navigate to: `/agents/fake-id-12345/chat`
   - [ ] **Expected:** Error page or message appears
   - [ ] **Expected:** Message: "Agent not found" or similar
   - [ ] **Expected:** NO stack traces visible
   - [ ] **Expected:** NO internal error details
   - [ ] **Expected:** User-friendly message

2. **Test invalid agent ID:**
   - [ ] Navigate to: `/agents/invalid/audit`
   - [ ] **Expected:** Error message appears
   - [ ] **Expected:** Message is clear and helpful
   - [ ] **Expected:** NO technical details exposed

3. **Test API errors:**
   - [ ] Open DevTools → Network tab
   - [ ] Navigate to: `/api/agents/fake-id`
   - [ ] **Expected:** Response status is 404
   - [ ] **Expected:** Response body: `{"error": "Agent not found"}` or similar
   - [ ] **Expected:** NO stack traces in response
   - [ ] **Expected:** NO internal paths or code exposed

4. **Test unauthorized access:**
   - [ ] Try to access: `/api/agents` without auth token
   - [ ] **Expected:** Response status is 401
   - [ ] **Expected:** Response: `{"error": "Unauthorized"}` or similar
   - [ ] **Expected:** Clear, safe error message

5. **Test malformed requests:**
   - [ ] Open DevTools → Console tab
   - [ ] Send chat message with invalid format (if possible)
   - [ ] **Expected:** Error message appears
   - [ ] **Expected:** NO console errors with stack traces
   - [ ] **Expected:** User-friendly error shown

**Success Criteria:**
- ✅ Errors are user-friendly
- ✅ No stack traces exposed
- ✅ No sensitive information leaked
- ✅ Clear error messages

**Failure Indicators:**
- ❌ Stack traces visible to users
- ❌ Internal paths or code exposed
- ❌ Confusing error messages
- ❌ Sensitive data in errors

---

## Part 5: Health Check & Monitoring Tests

### Test 13: Health Check Endpoint

**Goal:** Verify system health monitoring

**Prerequisites:**
- Server running: `npm run dev`

**Steps (Atomic):**
1. **Test health endpoint:**
   - [ ] Navigate to: `http://localhost:3000/api/health`
   - [ ] **Expected:** Response status is 200
   - [ ] **Expected:** Response is JSON

2. **Verify response structure:**
   - [ ] Open DevTools → Network tab
   - [ ] Click on `/api/health` request
   - [ ] **Expected:** Response contains:
     - `status`: "healthy" or "missing_config"
     - `checks`: object with Firebase and OpenAI checks
     - `message`: descriptive message

3. **Verify checks:**
   - [ ] **Expected:** `checks.firebase.projectId`: true/false
   - [ ] **Expected:** `checks.firebase.hasServiceAccountKey`: true/false
   - [ ] **Expected:** `checks.openai.hasApiKey`: true/false
   - [ ] **Expected:** `checks.environment`: "development" or "production"

4. **Test in production:**
   - [ ] Deploy to Vercel
   - [ ] Navigate to: `https://your-app.vercel.app/api/health`
   - [ ] **Expected:** Same structure
   - [ ] **Expected:** Status reflects production config

**Success Criteria:**
- ✅ Health endpoint returns 200
- ✅ Response structure is correct
- ✅ Checks reflect actual configuration

**Failure Indicators:**
- ❌ Health endpoint doesn't work
- ❌ Wrong status reported
- ❌ Missing checks

---

## Part 6: Automated Testing

### Vitest Unit Tests (NEW)

**What you're doing:** Running automated tests for critical API routes and functionality.

**Steps:**
1. Run: `npm test`
2. All tests should pass ✅

**Tests included:**
- ✅ Health check API (`/api/health`)
- ✅ Agents API authentication and validation
- ✅ Chat API authentication and validation
- ✅ Rate limiting (when configured)

**What should happen:**
- All tests pass without errors
- Test output shows green checkmarks
- No failures or warnings

**If tests fail:**
- Check that environment variables are set
- Make sure dependencies are installed: `npm install`
- Check test output for specific error messages

**Run specific tests:**
```bash
# Run only API tests
npm test -- src/__tests__/api

# Run in watch mode (auto-reruns on file changes)
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

---

### S-DAL Verification Script

**What you're doing:** Running a script that checks if the code is set up correctly.

**Steps:**
1. Run: `npm run test:sdal`
2. Read the output

**What should happen:**
- Script runs without errors
- Shows a checklist of verified features
- Points you to this guide for manual testing

---

## Understanding the Logs

### What Each Column Means

- **Time**: When the action happened (shows both exact time and "2 minutes ago")
- **Type**: 
  - "tool call" = Agent used a tool (like query_collection)
  - "data access" = Agent looked at data (like finance_transactions)
- **Source**: Where it came from (usually "firestore" or "tool_call")
- **Details**: 
  - Tool name (if it's a tool call)
  - Collection name (if it's data access)
  - Number of rows returned
  - Error message (if it failed)
- **Status**: 
  - Green checkmark = Success
  - Red X = Failed or Denied
  - Gray clock = Unknown
- **Duration**: How long it took (in milliseconds, like "150ms")

---

## Common Issues

### "No audit logs found"
**Solution:** 
- Make sure you've actually used the agent (sent messages)
- Wait a few seconds and refresh
- Check that the agent has permissions

### Can't see the Audit Logs icon
**Solution:**
- Make sure you're logged in
- Make sure you're on an agent's chat page
- Try refreshing

### Logs don't update
**Solution:**
- Refresh the audit logs page
- Make sure your message actually triggered a tool call

### Getting error pages
**Solution:**
- Check that you're logged in
- Check the agent ID in the URL
- Check browser console (F12) for errors
- Make sure the server is running

---

## What Success Looks Like

### Automated Tests ✅
✅ All Vitest tests pass (`npm test`)  
✅ Health check API returns 200  
✅ Agents API requires authentication  
✅ Chat API requires authentication  
✅ Rate limiting works (when configured)  

### Manual Tests ✅
✅ You can chat with agents and get responses  
✅ You can view audit logs in a nice table  
✅ Filter tabs work (All / Tool Calls / Data Access)  
✅ Denied access shows up with red X marks  
✅ Each agent only shows its own logs  
✅ Error messages are clear and safe  

---

## Technical Reference

### Test Infrastructure
- **Test Framework**: Vitest
- **Test Location**: `src/__tests__/`
- **Test Config**: `vitest.config.ts`
- **Test Setup**: `vitest.setup.ts`

### API Endpoints
- **Health Check**: `/api/health` - Returns environment status
- **Agents API**: `/api/agents` - Create and list agents
- **Chat API**: `/api/chat` - Chat with agents
- **Audit API**: `/api/agents/[agentId]/audit` - Get audit logs

### Pages
- **Audit Logs**: `/agents/[agentId]/audit`
- **Data Source**: Firestore `audit_logs` collection
- **Authentication**: Firebase Auth
- **Authorization**: User can only see their own agents' logs
- **Firestore Indexes**: ✅ **Deployed** - Composite indexes for audit_logs queries:
  - `(agentId, userId, timestamp)` - for basic queries
  - `(agentId, userId, type, timestamp)` - for filtered queries
  - See `firestore.indexes.json` for configuration

### Rate Limiting
- **Implementation**: Upstash Redis (with in-memory fallback)
- **Limit**: 10 requests per minute per user
- **Routes Protected**: `/api/chat`, `/api/agents` (POST)
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

## Next Steps

If all tests pass:
- ✅ Feature is ready to use
- You can monitor agent activity
- Security and compliance features are working

If something fails:
- Note which test failed
- Check browser console (F12)
- Check server logs
- Report the issue with details

