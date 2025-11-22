# Production Test Guide - S-DAL & Tool Logging

## What Was Implemented

1. **Secure Data Access Layer (S-DAL)**
   - All Firestore queries go through `safeQueryFirestore()`
   - Collection allowlisting per agent
   - Field allowlisting (strips disallowed fields)
   - Agent ownership validation

2. **Tool Execution Logging**
   - Every tool call logged to `audit_logs` collection
   - Logs success/failure, duration, input summaries
   - Logs denied access attempts

3. **Tool Allowlisting**
   - Agents can restrict tools via `allowedTools` field
   - Enforced at execution time

4. **Error Handling**
   - Safe error messages (no stack traces)
   - Proper HTTP status codes (400/403/500)

## Test Checklist

### Test 1: Basic Chat with Allowed Collection ✅
**Steps:**
1. Create an agent with:
   ```json
   {
     "collections": ["finance_transactions"],
     "userId": "YOUR_USER_ID"
   }
   ```
2. Send chat message: "What are our recent transactions?"
3. **Expected:** Query succeeds, returns data

**Verify in Firestore `audit_logs`:**
- Entry with `type: 'tool_call'`, `toolName: 'query_collection'`, `success: true`
- Entry with `type: 'data_access'`, `collection: 'finance_transactions'`, `rowCount > 0`

### Test 2: Disallowed Collection Access ❌
**Steps:**
1. Use agent with only `finance_transactions` allowed
2. Send message: "Show me sales deals"
3. **Expected:** HTTP 403 error: "Collection sales_deals is not allowed"

**Verify in `audit_logs`:**
- `tool_call` entry with `success: false`, `denied: true`
- `data_access` entry with `denied: true`, `error` indicating disallowed collection

### Test 3: Disallowed Tool ❌
**Steps:**
1. Create agent with `allowedTools: []` (empty array)
2. Send any message that triggers a tool
3. **Expected:** HTTP 403: "Tool 'query_collection' is not allowed"

**Verify in `audit_logs`:**
- `tool_call` entry with `success: false`, `denied: true`, `errorMessage` indicating disallowed tool

### Test 4: Field Filtering 🔒
**Steps:**
1. Create agent with explicit `firestoreAccess`:
   ```json
   {
     "firestoreAccess": {
       "collections": [{
         "name": "finance_transactions",
         "allowedFields": ["id", "date", "amount", "category"]
       }]
     }
   }
   ```
2. Send message: "What are our recent transactions?"
3. **Expected:** Response only contains `id`, `date`, `amount`, `category` fields

**Verify:**
- Response JSON only has allowed fields
- `audit_logs` shows successful `data_access` entry

### Test 5: Error Handling 🛡️
**Steps:**
1. Send invalid request (missing agentId)
2. **Expected:** HTTP 400 with safe error message (no stack traces)

**Verify:**
- Response doesn't leak internal error details
- Error message is user-friendly

## Firestore Audit Logs Structure

### Data Access Entry
```json
{
  "userId": "user123",
  "agentId": "agent456",
  "source": "firestore",
  "type": "data_access",
  "collection": "finance_transactions",
  "filters": [{"field": "date", "op": ">="}],
  "rowCount": 10,
  "timestamp": "2025-01-XX...",
  "durationMs": 150,
  "denied": false
}
```

### Tool Call Entry
```json
{
  "userId": "user123",
  "agentId": "agent456",
  "source": "tool_call",
  "type": "tool_call",
  "toolName": "query_collection",
  "inputSummary": "collection: finance_transactions",
  "success": true,
  "timestamp": "2025-01-XX...",
  "durationMs": 200
}
```

## Quick Verification Queries

### Check all audit logs for an agent:
```javascript
// In Firestore console
collection('audit_logs')
  .where('agentId', '==', 'YOUR_AGENT_ID')
  .orderBy('timestamp', 'desc')
  .limit(50)
```

### Check denied access attempts:
```javascript
collection('audit_logs')
  .where('denied', '==', true)
  .where('agentId', '==', 'YOUR_AGENT_ID')
```

### Check tool call success rate:
```javascript
collection('audit_logs')
  .where('type', '==', 'tool_call')
  .where('agentId', '==', 'YOUR_AGENT_ID')
```

## Files Changed
- ✅ `src/infrastructure/firestore/safeQuery.ts` - S-DAL implementation
- ✅ `src/infrastructure/audit-log.repository.ts` - Audit logging
- ✅ `src/lib/tool-executors.ts` - Tool execution with logging
- ✅ `src/lib/workflow-executor.ts` - Workflow with agentId/userId
- ✅ `src/app/api/chat/route.ts` - Error handling
- ✅ `src/domain/entities/agent.entity.ts` - Added firestoreAccess and allowedTools

## All Committed & Pushed ✅
Commit: `3bf2be4`

