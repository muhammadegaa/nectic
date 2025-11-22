# S-DAL Manual Test Guide

## Prerequisites
1. Start dev server: `npm run dev`
2. Have Firebase credentials configured
3. Have at least one agent created in Firestore
4. Know your `agentId` and `userId`

## Automated Tests

Run the automated test suite:
```bash
npm run test:sdal
```

This will:
- Create a test agent with restricted access
- Test allowed collection queries
- Test disallowed collection access
- Test disallowed field filters
- Test tool execution logging
- Test disallowed tool execution
- Clean up test data

## Manual Test Cases

### Test 1: Query Allowed Collection & Tool ✅
**Setup:**
1. Create an agent (via API or Firestore console) with:
   ```json
   {
     "collections": ["finance_transactions"],
     "userId": "YOUR_USER_ID",
     "allowedTools": ["query_collection"],
     "firestoreAccess": {
       "collections": [{
         "name": "finance_transactions",
         "allowedFields": ["id", "date", "amount", "category", "type"]
       }]
     }
   }
   ```

2. Send chat message to this agent: "What are our recent transactions?"

**Expected:**
- Query succeeds, returns data
- Response only contains allowed fields: `id`, `date`, `amount`, `category`, `type`

**Verify in Firestore `audit_logs` collection:**
- One entry with `type: 'tool_call'`, `toolName: 'query_collection'`, `success: true`
- One entry with `type: 'data_access'`, `collection: 'finance_transactions'`, `rowCount > 0`

### Test 2: Query Disallowed Collection ❌
**Setup:**
1. Use the same agent (only has `finance_transactions` allowed)

**Test:**
1. Send chat message: "Show me sales deals"

**Expected:**
- HTTP 403 or error message in chat: "Collection sales_deals is not allowed for this agent."

**Verify in Firestore `audit_logs` collection:**
- One entry with `type: 'tool_call'`, `toolName: 'query_collection'`, `success: false`, `errorMessage` indicating disallowed collection
- One entry with `type: 'data_access'`, `collection: 'sales_deals'`, `denied: true`, `error` indicating disallowed collection

### Test 3: Call Disallowed Tool ❌
**Setup:**
1. Create an agent with `collections: ['finance_transactions']` but `allowedTools: []` (or omit `allowedTools` to default to no tools)

**Test:**
1. Send chat message: "What is the average transaction amount?" (This would typically trigger `analyze_data` or `query_collection`)

**Expected:**
- HTTP 403 or error message in chat: "Tool 'query_collection' is not allowed for this agent." (or the first tool attempted)

**Verify in Firestore `audit_logs` collection:**
- One entry with `type: 'tool_call'`, `toolName` (e.g., 'query_collection'), `success: false`, `errorMessage` indicating disallowed tool, `denied: true`

### Test 4: Field Filtering (Manual Verification) 🔒
**Setup:**
1. Create an agent with `firestoreAccess` explicitly defining allowed fields for `finance_transactions`, e.g.:
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

**Test:**
1. Send chat message: "What are our recent transactions?"

**Expected:**
- The returned data (in the chat response) for `finance_transactions` should *only* contain `id`, `date`, `amount`, and `category` fields, even if the original Firestore documents have more.

**Verify:**
- Check Firestore `audit_logs` for `data_access` entry
- Inspect the actual response JSON to confirm field filtering

### Test 5: Disallowed Field Filter ❌
**Setup:**
1. Use agent from Test 4 (only allows `id`, `date`, `amount`, `category`)

**Test:**
1. Try to query with a filter on a disallowed field (this would need to be done via direct API call or tool that uses `description` field)

**Expected:**
- ValidationError: "Field description is not allowed for collection finance_transactions"

**Verify:**
- Check `audit_logs` for denied `data_access` entry

### Test 6: Audit Logging Completeness 📊
**Steps:**
1. Perform various successful and failed queries/tool calls
2. Check Firestore `audit_logs` collection

**Expected:**
- All entries should have `agentId`, `userId`, `timestamp`, `type`
- `data_access` entries should have `collection`, `filters`, `rowCount`, `durationMs`
- `tool_call` entries should have `toolName`, `inputSummary`, `success`, `durationMs`
- Failed attempts should have `denied: true` and `error` fields

## Verification Commands

### Check audit logs (Firestore console or via API)
```javascript
// In Firestore console
collection('audit_logs')
  .where('agentId', '==', 'YOUR_AGENT_ID')
  .orderBy('timestamp', 'desc')
  .limit(50)
```

### Check denied access attempts
```javascript
collection('audit_logs')
  .where('denied', '==', true)
  .where('agentId', '==', 'YOUR_AGENT_ID')
```

### Example curl for allowed query (replace YOUR_TOKEN, AGENT_ID)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"agentId": "AGENT_ID", "message": "What are our recent transactions?"}'
```

## Agent Configuration Schema

### Minimal Agent (uses collections array)
```json
{
  "collections": ["finance_transactions", "sales_deals"],
  "userId": "user123",
  "allowedTools": ["query_collection", "analyze_data"]
}
```

### Full Agent with Explicit Access Control
```json
{
  "collections": ["finance_transactions"],
  "userId": "user123",
  "allowedTools": ["query_collection"],
  "firestoreAccess": {
    "collections": [
      {
        "name": "finance_transactions",
        "allowedFields": ["id", "date", "amount", "category", "type", "status"]
      }
    ]
  }
}
```

## Expected Audit Log Structure

### Successful Data Access Entry
```json
{
  "userId": "user123",
  "agentId": "agent456",
  "source": "firestore",
  "type": "data_access",
  "collection": "finance_transactions",
  "filters": [{"field": "type", "op": "=="}],
  "rowCount": 10,
  "timestamp": "2025-01-XX...",
  "durationMs": 150,
  "denied": false,
  "createdAt": "2025-01-XX..."
}
```

### Successful Tool Call Entry
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
  "durationMs": 200,
  "createdAt": "2025-01-XX..."
}
```

### Denied Access Entry
```json
{
  "userId": "user123",
  "agentId": "agent456",
  "source": "firestore",
  "type": "data_access",
  "collection": "sales_deals",
  "filters": [],
  "rowCount": 0,
  "timestamp": "2025-01-XX...",
  "durationMs": 50,
  "denied": true,
  "error": "Collection sales_deals is not allowed",
  "createdAt": "2025-01-XX..."
}
```

