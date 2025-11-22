# S-DAL & Tool Logging Test Guide

## Prerequisites
1. Start dev server: `npm run dev`
2. Have Firebase credentials configured
3. Have at least one agent created in Firestore
4. Know your `agentId` and `userId`

## Test Cases

### Test 1: Basic Chat with Allowed Collection
**Setup:**
- Create an agent with:
  - `collections: ['finance_transactions']`
  - `userId: "YOUR_USER_ID"`
  - `allowedTools: ['query_collection']` (optional)

**Test:**
1. Open chat UI: `http://localhost:3000/agents/[agentId]/chat`
2. Send message: "What are our recent transactions?"
3. **Expected:** Query succeeds, returns transaction data

**Verify:**
- Check Firestore `audit_logs` collection:
  - Entry with `type: 'tool_call'`, `toolName: 'query_collection'`, `success: true`
  - Entry with `type: 'data_access'`, `collection: 'finance_transactions'`, `rowCount > 0`

### Test 2: Disallowed Collection Access
**Setup:**
- Use agent with only `finance_transactions` allowed

**Test:**
1. Send message: "Show me sales deals"
2. **Expected:** HTTP 403 or error: "Collection sales_deals is not allowed"

**Verify:**
- Check `audit_logs`:
  - `tool_call` entry with `success: false`, `denied: true`
  - `data_access` entry with `denied: true`, `error` indicating disallowed collection

### Test 3: Disallowed Tool
**Setup:**
- Create agent with `allowedTools: []` (empty array)

**Test:**
1. Send any message that would trigger a tool
2. **Expected:** HTTP 403: "Tool 'query_collection' is not allowed"

**Verify:**
- Check `audit_logs`:
  - `tool_call` entry with `success: false`, `denied: true`, `errorMessage` indicating disallowed tool

### Test 4: Field Filtering
**Setup:**
- Create agent with explicit `firestoreAccess`:
```json
{
  "firestoreAccess": {
    "collections": [
      {
        "name": "finance_transactions",
        "allowedFields": ["id", "date", "amount", "category"]
      }
    ]
  }
}
```

**Test:**
1. Send message: "What are our recent transactions?"
2. **Expected:** Returned data only contains `id`, `date`, `amount`, `category` fields

**Verify:**
- Response JSON only has allowed fields
- `audit_logs` shows successful `data_access` entry

### Test 5: API Error Handling
**Test:**
1. Send invalid request (missing agentId)
2. **Expected:** HTTP 400 with safe error message (no stack traces)

**Verify:**
- Response doesn't leak internal error details
- Error message is user-friendly

## Quick Test Commands

```bash
# Check if files exist
ls -la src/infrastructure/firestore/safeQuery.ts
ls -la src/infrastructure/audit-log.repository.ts
ls -la src/domain/firestore.ts
ls -la src/domain/errors/access-errors.ts

# Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# Check audit logs (Firestore console)
# Filter by: agentId == "YOUR_AGENT_ID"
```

## Expected Audit Log Structure

**Data Access Entry:**
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

**Tool Call Entry:**
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

