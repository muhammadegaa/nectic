# S-DAL + Tool Logging Test Guide

## Prerequisites
1. Start dev server: `npm run dev`
2. Have at least one agent created
3. Know your `agentId` and `userId`
4. Have Firebase ID token (get from browser DevTools → Application → Cookies → `__session` or similar)

## Agent Configuration

### Option 1: Using `collections` field (simplest)
```json
{
  "collections": ["finance_transactions"],
  "allowedTools": ["query_collection"]
}
```

### Option 2: Using `firestoreAccess` (explicit field allowlisting)
```json
{
  "collections": ["finance_transactions"],
  "firestoreAccess": {
    "collections": [{
      "name": "finance_transactions",
      "allowedFields": ["id", "date", "amount", "category", "description"]
    }]
  },
  "allowedTools": ["query_collection", "analyze_data"]
}
```

### Option 3: Using `agenticConfig` (derived tools)
```json
{
  "collections": ["finance_transactions"],
  "agenticConfig": {
    "tools": {
      "basic": {
        "queryCollection": true,
        "analyzeData": false,
        "getCollectionSchema": false
      }
    }
  }
}
```

## Test Cases

### Test 1: Successful Query (Allowed Collection + Tool)
1. Create agent with `collections: ['finance_transactions']` and `allowedTools: ['query_collection']`
2. Send chat: "What are our recent transactions?"
3. **Expected**:
   - HTTP 200 response with `{ answer, conversationId }`
   - Data returned successfully
   - Two audit log entries in `audit_logs`:
     - `type: 'tool_call'`, `toolName: 'query_collection'`, `success: true`
     - `type: 'data_access'`, `collection: 'finance_transactions'`, `rowCount: > 0`

### Test 2: Denied Collection Access
1. Use agent with only `collections: ['finance_transactions']`
2. Send chat: "Show me sales deals" (triggers query to `sales_deals`)
3. **Expected**:
   - HTTP 403 response
   - Error message: "Collection sales_deals is not allowed..."
   - Audit log: `type: 'data_access'`, `denied: true`, `error: 'Collection sales_deals not allowed...'`

### Test 3: Denied Tool Access
1. Create agent with `allowedTools: ['analyze_data']` (no `query_collection`)
2. Send chat: "What are our recent transactions?" (triggers `query_collection`)
3. **Expected**:
   - HTTP 403 response
   - Error message: "Tool query_collection is not allowed..."
   - Audit log: `type: 'tool_call'`, `toolName: 'query_collection'`, `success: false`, `denied: true`

### Test 4: Field Filtering
1. Agent with `firestoreAccess.collections[0].allowedFields: ['id', 'date', 'amount']`
2. Query `finance_transactions` (which has more fields in schema)
3. **Expected**:
   - Only `id`, `date`, `amount` fields in returned rows
   - Other fields (e.g. `description`, `vendor`) stripped

### Test 5: Audit Log Verification
1. Check Firestore `audit_logs` collection
2. For each tool call, verify:
   - `type: 'tool_call'` or `type: 'data_access'`
   - `userId`, `agentId` present
   - `timestamp`, `createdAt` present
   - `success` boolean (for tool calls)
   - `denied` boolean (true for access denied)
   - `inputSummary` present (for tool calls, no sensitive data)
   - `rowCount` present (for data access)

## Manual Test Steps

### Step 1: Create Test Agent
```bash
# Via API or Firestore console, create agent:
{
  "name": "Test Agent",
  "collections": ["finance_transactions"],
  "allowedTools": ["query_collection"],
  "userId": "YOUR_USER_ID"
}
```

### Step 2: Test Allowed Query
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "agentId": "YOUR_AGENT_ID",
    "message": "What are our recent transactions?"
  }'
```

### Step 3: Test Denied Collection
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "agentId": "YOUR_AGENT_ID",
    "message": "Show me sales deals"
  }'
# Expected: 403 with error message
```

### Step 4: Verify Audit Logs
```bash
# In Firestore console, query:
collection: audit_logs
where: agentId == "YOUR_AGENT_ID"
orderBy: createdAt desc
limit: 10

# Verify entries have:
# - type: 'tool_call' or 'data_access'
# - All required fields present
# - denied: true for failed access
```

