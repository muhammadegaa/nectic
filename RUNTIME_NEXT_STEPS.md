# Runtime & S-DAL Next Steps Roadmap

## Overview
This document outlines the next logical tasks for improving the Secure Data Access Layer (S-DAL), runtime security, observability, and user experience. Tasks are prioritized by security impact, governance needs, and user value.

---

## Priority 1: Observability & Governance

### 1.1 Audit Log Viewer UI
**What:** Build a React component/page that displays audit logs with filtering, search, and export capabilities.

**Why:** Currently, audit logs are only accessible via Firestore console. A dedicated UI enables:
- Security teams to quickly review access patterns
- Compliance officers to generate reports
- Developers to debug permission issues
- Product teams to understand agent usage

**Scope:** 
- List view with pagination
- Filters: agentId, userId, type (tool_call/data_access), denied status, date range
- Export to CSV/JSON
- Real-time updates (optional)

---

### 1.2 Audit Log Analytics Dashboard
**What:** Create aggregated views showing access patterns, denied attempts, tool usage statistics, and anomaly detection.

**Why:** Helps identify:
- Unusual access patterns (potential security issues)
- Most-used tools and collections (product insights)
- Agents with high denial rates (configuration issues)
- Performance bottlenecks (slow queries)

**Scope:**
- Charts: access over time, tool usage distribution, denial rate by agent
- Alerts: spike in denied access, unusual query patterns
- Summary cards: total queries today, denial rate, average query time

---

### 1.3 Audit Log Retention & Archival
**What:** Implement automatic archival of old audit logs to cold storage (e.g., Cloud Storage) and define retention policies.

**Why:** 
- Audit logs grow indefinitely, increasing Firestore costs
- Compliance may require long-term retention (e.g., 7 years)
- Active logs should be queryable, but old logs can be archived

**Scope:**
- Scheduled job (Cloud Functions or cron) to archive logs older than X days
- Archive format: JSON files in Cloud Storage, partitioned by date
- Query interface for archived logs (optional)

---

## Priority 2: Additional Connectors & Data Sources

### 2.1 SQL Database S-DAL Adapter
**What:** Extend S-DAL pattern to PostgreSQL/MySQL connectors, enforcing table/column allowlisting similar to Firestore collection/field allowlisting.

**Why:**
- Currently, S-DAL only covers Firestore
- SQL databases need the same security controls
- Enables consistent access control across data sources

**Scope:**
- Create `safeQuerySQL()` function mirroring `safeQueryFirestore()`
- Agent config: `sqlAccess: { tables: [{ name, allowedColumns }] }`
- Validate table/column access before executing SQL queries
- Log SQL access to same `audit_logs` collection

---

### 2.2 MongoDB S-DAL Adapter
**What:** Apply S-DAL pattern to MongoDB collections, enforcing collection/field allowlisting.

**Why:**
- MongoDB is already supported via adapter, but lacks S-DAL enforcement
- Need consistent security model across all data sources

**Scope:**
- Similar to SQL adapter: `safeQueryMongoDB()` function
- Agent config: `mongoAccess: { collections: [{ name, allowedFields }] }`
- Validate before query execution

---

## Priority 3: Runtime Safeguards

### 3.1 Query Timeout Enforcement
**What:** Add configurable timeouts for all data access operations (Firestore, SQL, MongoDB) to prevent long-running queries from blocking the system.

**Why:**
- Prevents resource exhaustion
- Improves user experience (fail fast vs. hanging)
- Protects against accidental expensive queries

**Scope:**
- Default timeout: 30 seconds per query
- Configurable per agent or globally
- Return timeout error to user with safe message
- Log timeout events to audit logs

---

### 3.2 Rate Limiting per Agent
**What:** Implement rate limiting to prevent agents from making excessive queries (e.g., max 100 queries per minute per agent).

**Why:**
- Prevents abuse (intentional or accidental)
- Protects backend resources
- Enables fair usage across agents

**Scope:**
- Token bucket or sliding window algorithm
- Configurable limits per agent tier (free vs. premium)
- Return 429 (Too Many Requests) when limit exceeded
- Log rate limit violations

---

### 3.3 Query Result Size Limits
**What:** Enforce maximum result set sizes (e.g., 10,000 rows) and pagination requirements for large queries.

**Why:**
- Prevents memory exhaustion
- Reduces response payload size
- Encourages efficient querying

**Scope:**
- Hard limit: 10,000 rows per query
- Soft limit: 1,000 rows (warn but allow)
- Auto-pagination for large result sets
- Configurable per agent tier

---

### 3.4 Fallback Behavior for S-DAL Failures
**What:** Define graceful degradation when S-DAL validation fails (e.g., return empty result with explanation vs. throwing error).

**Why:**
- Better UX: users see explanation instead of cryptic errors
- Allows partial results when some collections are accessible
- Enables progressive permission granting

**Scope:**
- Option 1: Return empty result with message "Access denied to collection X"
- Option 2: Return partial results (only accessible collections)
- Configurable per agent or globally

---

## Priority 4: UX Improvements

### 4.1 Better Permission Error Messages in Chat
**What:** Improve how permission errors are surfaced in the chat UI. Instead of generic "Access denied", show specific, actionable messages.

**Why:**
- Users need to understand why access was denied
- Helps users request correct permissions
- Reduces support tickets

**Scope:**
- Parse `AccessDeniedError` and `ValidationError` messages
- Display user-friendly messages: "This agent doesn't have access to sales data. Contact your admin to grant access."
- Include link to agent settings page (if applicable)

---

### 4.2 Agent Permission Configuration UI
**What:** Build a UI for configuring agent permissions (collections, fields, tools) without editing Firestore directly.

**Why:**
- Makes permission management accessible to non-technical users
- Reduces configuration errors
- Enables self-service permission updates

**Scope:**
- Form to select allowed collections
- Field selector for each collection (checkboxes)
- Tool selector (checkboxes)
- Preview of effective permissions
- Save to agent config

---

### 4.3 Real-time Permission Status Indicator
**What:** Show in the chat UI when an agent has limited permissions (e.g., "This agent can only access finance data").

**Why:**
- Sets user expectations
- Reduces confusion when queries fail
- Transparent about agent capabilities

**Scope:**
- Badge or info icon in chat header
- Tooltip showing allowed collections/tools
- Warning when trying to query disallowed collection

---

## Priority 5: Advanced Features

### 5.1 Dynamic Permission Updates
**What:** Allow updating agent permissions without restarting or redeploying. Changes take effect immediately.

**Why:**
- Faster permission adjustments
- No downtime for permission changes
- Enables A/B testing of permission sets

**Scope:**
- API endpoint to update agent permissions
- Invalidate cached agent configs
- Broadcast permission changes to active sessions (optional)

---

### 5.2 Permission Templates
**What:** Create reusable permission templates (e.g., "Finance Analyst", "Sales Manager") that can be applied to multiple agents.

**Why:**
- Faster agent setup
- Consistent permissions across similar roles
- Easier compliance (standardized access patterns)

**Scope:**
- Template definition: collections, fields, tools
- Apply template to agent
- Override template settings per agent (optional)

---

### 5.3 Query Cost Estimation
**What:** Estimate and display query cost (time, rows, complexity) before execution, allowing users to cancel expensive queries.

**Why:**
- Prevents accidental expensive queries
- Helps users optimize queries
- Transparent about resource usage

**Scope:**
- Analyze query filters and estimate result size
- Show estimated cost in UI before execution
- Allow user to cancel or proceed
- Log cost estimates for analytics

---

## Implementation Notes

- **No breaking changes:** All new features should be backward compatible
- **Incremental rollout:** Start with observability (Priority 1), then safeguards (Priority 3), then UX (Priority 4)
- **Testing:** Each feature should include automated tests and manual validation steps
- **Documentation:** Update `S-DAL-TEST.md` and `PRODUCTION-TEST-GUIDE.md` as features are added

---

## Estimated Effort

- **Priority 1 (Observability):** 2-3 weeks
- **Priority 2 (Connectors):** 1-2 weeks per connector
- **Priority 3 (Safeguards):** 1-2 weeks
- **Priority 4 (UX):** 1-2 weeks
- **Priority 5 (Advanced):** 2-3 weeks per feature

---

*Last updated: After S-DAL implementation completion*

