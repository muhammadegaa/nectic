# Testing Guide - Single Source of Truth

This is the **only** testing guide you need. It covers everything from basic setup to production testing.

---

## Quick Start

1. **Start the server**: `npm run dev`
2. **Log in** to your account
3. **Follow the test steps below**

---

## Part 1: Basic Functionality Tests

### Test 1: Chat with an Agent

**What you're doing:** Testing that agents can answer questions and access data.

**Steps:**
1. Go to an agent's chat page: `http://localhost:3000/agents/[agentId]/chat`
2. Send a message like: "What are our recent transactions?"
3. Wait for the agent to respond

**What should happen:**
- Agent responds with data
- No errors appear
- Response makes sense

**If it doesn't work:**
- Check that you're logged in
- Check that the agent exists
- Check browser console (F12) for errors

---

### Test 2: View Audit Logs

**What you're doing:** Testing the new audit log viewer page.

**Steps:**
1. On the chat page, click the magnifying glass icon (top right)
2. You should see the Audit Logs page

**What should happen:**
- Page loads showing "Audit Logs" at the top
- You see a table with columns: Time, Type, Source, Details, Status, Duration
- If you've used the agent, you should see log entries

**If it doesn't work:**
- Make sure you're logged in
- Make sure the agent belongs to you
- Try refreshing the page

---

### Test 3: Filter Audit Logs

**What you're doing:** Testing that you can filter logs by type.

**Steps:**
1. On the Audit Logs page, click the "Tool Calls" tab
2. Click the "Data Access" tab
3. Click the "All" tab

**What should happen:**
- "Tool Calls" shows only tool call entries
- "Data Access" shows only data access entries
- "All" shows everything

---

## Part 2: Security Tests

### Test 4: Restricted Access (Denied Queries)

**What you're doing:** Testing that agents can't access data they're not allowed to see.

**Steps:**
1. Create or use an agent that can only access ONE collection (e.g., only "finance_transactions")
2. In chat, ask it about data it CAN'T access (e.g., "Show me sales deals")
3. Go to Audit Logs page

**What should happen:**
- Agent gives an error message (not the data)
- In Audit Logs, you see entries with red X marks
- Status says "Denied"
- Error message is shown in the Details column

**Why this matters:** This proves the security system is working - agents can't access data they're not allowed to see.

---

### Test 5: Field Filtering

**What you're doing:** Testing that agents only return allowed fields, even if more exist in the database.

**Steps:**
1. Create an agent with restricted fields:
   - Only allow: `id`, `date`, `amount`, `category`
   - Don't allow: `description`, `vendor`, etc.
2. Ask the agent: "What are our recent transactions?"
3. Check the response data

**What should happen:**
- Response only contains: `id`, `date`, `amount`, `category`
- No other fields appear (like `description` or `vendor`)

**Why this matters:** This proves that sensitive fields are hidden even if they exist in the database.

---

### Test 6: Tool Restrictions

**What you're doing:** Testing that agents can only use tools they're allowed to use.

**Steps:**
1. Create an agent with `allowedTools: []` (empty - no tools allowed)
2. Try to chat with it (any message that would trigger a tool)
3. Check the response

**What should happen:**
- You get an error message saying the tool is not allowed
- In Audit Logs, you see a denied tool call entry

---

## Part 3: Production Testing

### Test 7: Multiple Agents

**What you're doing:** Testing that each agent only shows its own logs.

**Steps:**
1. Go to Agent A's Audit Logs page
2. Note what logs you see
3. Go to Agent B's Audit Logs page
4. Compare the logs

**What should happen:**
- Agent A's logs are different from Agent B's logs
- You don't see Agent B's logs when viewing Agent A
- Each agent name is shown at the top of its Audit Logs page

**Why this matters:** This proves that users can only see logs for their own agents, not other people's agents.

---

### Test 8: Error Handling

**What you're doing:** Testing that errors are shown safely (no sensitive information leaked).

**Steps:**
1. Try to access an agent that doesn't exist: `/agents/fake-id/audit`
2. Try to access an agent that belongs to someone else
3. Check the error messages

**What should happen:**
- You get clear error messages like "Agent not found" or "Unauthorized"
- You DON'T see stack traces or internal error details
- Error messages are user-friendly

---

## Part 4: Automated Testing

### Run the Test Script

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

✅ You can chat with agents and get responses  
✅ You can view audit logs in a nice table  
✅ Filter tabs work (All / Tool Calls / Data Access)  
✅ Denied access shows up with red X marks  
✅ Each agent only shows its own logs  
✅ Error messages are clear and safe  

---

## Technical Reference

- **API Endpoint**: `/api/agents/[agentId]/audit`
- **Page URL**: `/agents/[agentId]/audit`
- **Data Source**: Firestore `audit_logs` collection
- **Authentication**: Firebase Auth
- **Authorization**: User can only see their own agents' logs
- **Firestore Indexes**: Required composite indexes for audit_logs queries:
  - `(agentId, userId, timestamp)` - for basic queries
  - `(agentId, userId, type, timestamp)` - for filtered queries
  - See `firestore.indexes.json` for configuration

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

