# Enterprise Database Integration Guide

## Overview

Nectic AI Agents can connect to any data source your organization uses. While the demo uses Firestore with sample data, you can integrate with:

- **SQL Databases**: PostgreSQL, MySQL, SQL Server, Oracle
- **NoSQL Databases**: MongoDB, DynamoDB, Cassandra
- **Data Warehouses**: Snowflake, BigQuery, Redshift
- **APIs**: REST APIs, GraphQL endpoints
- **Cloud Storage**: S3, Azure Blob, Google Cloud Storage
- **SaaS Platforms**: Salesforce, HubSpot, Stripe, etc.

## How It Works

### Current Architecture (Firestore)

```
User Question → Agent → Tool Call → Firestore Query → Results → LLM Synthesis → Answer
```

### Enterprise Integration Pattern

```
User Question → Agent → Tool Call → Your Data Source → Results → LLM Synthesis → Answer
```

The agent uses **OpenAI Function Calling** to dynamically decide:
- Which data source to query
- What filters to apply
- How to analyze the results

## Integration Methods

### Method 1: Custom Tool Functions (Recommended)

Add custom tool functions that connect to your databases.

#### Step 1: Create Custom Tool

```typescript
// src/lib/enterprise-tools.ts
export const enterpriseTools = [
  {
    type: "function" as const,
    function: {
      name: "query_postgresql",
      description: "Query PostgreSQL database",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string" },
          filters: { type: "object" },
          limit: { type: "number" }
        }
      }
    }
  }
]
```

#### Step 2: Implement Executor

```typescript
// src/lib/enterprise-executors.ts
import { Pool } from 'pg'

export async function executeEnterpriseTool(toolName: string, args: any) {
  switch (toolName) {
    case "query_postgresql":
      const pool = new Pool({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      })
      
      const query = buildQuery(args.table, args.filters, args.limit)
      const result = await pool.query(query)
      return result.rows
  }
}
```

#### Step 3: Update Chat API

```typescript
// src/app/api/chat/route.ts
import { agentTools } from '@/lib/agent-tools'
import { enterpriseTools } from '@/lib/enterprise-tools'

// Combine tools
const allTools = [...agentTools, ...enterpriseTools]
```

### Method 2: API Gateway Pattern

Create an API layer that abstracts your data sources.

#### Architecture

```
Agent → API Gateway → Data Source Adapters → Your Databases
```

#### Implementation

```typescript
// src/lib/data-gateway.ts
export class DataGateway {
  async query(source: string, collection: string, filters: any) {
    switch (source) {
      case 'postgresql':
        return await this.queryPostgreSQL(collection, filters)
      case 'mongodb':
        return await this.queryMongoDB(collection, filters)
      case 'salesforce':
        return await this.querySalesforce(collection, filters)
      case 'api':
        return await this.queryAPI(collection, filters)
    }
  }
}
```

### Method 3: Direct Database Connection

For SQL databases, use connection pooling.

#### PostgreSQL Example

```typescript
// src/lib/db-adapters/postgresql.ts
import { Pool } from 'pg'

export class PostgreSQLAdapter {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
  }

  async query(table: string, filters: any, limit: number = 50) {
    let query = `SELECT * FROM ${table} WHERE 1=1`
    const params: any[] = []
    let paramIndex = 1

    if (filters.dateRange) {
      query += ` AND date >= $${paramIndex} AND date <= $${paramIndex + 1}`
      params.push(filters.dateRange.start, filters.dateRange.end)
      paramIndex += 2
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`
      params.push(filters.category)
      paramIndex++
    }

    query += ` LIMIT $${paramIndex}`
    params.push(limit)

    const result = await this.pool.query(query, params)
    return result.rows
  }
}
```

#### MongoDB Example

```typescript
// src/lib/db-adapters/mongodb.ts
import { MongoClient } from 'mongodb'

export class MongoDBAdapter {
  private client: MongoClient

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!)
  }

  async query(collection: string, filters: any, limit: number = 50) {
    await this.client.connect()
    const db = this.client.db(process.env.MONGODB_DB)
    const coll = db.collection(collection)

    const query: any = {}
    
    if (filters.dateRange) {
      query.date = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      }
    }

    if (filters.category) {
      query.category = filters.category
    }

    const results = await coll.find(query).limit(limit).toArray()
    return results
  }
}
```

## Security Considerations

### 1. Connection Security

- Use environment variables for credentials
- Enable SSL/TLS for database connections
- Use connection pooling with limits
- Implement connection timeouts

### 2. Query Security

- **Never allow raw SQL injection**: Always use parameterized queries
- **Validate filters**: Sanitize all user inputs
- **Limit query complexity**: Set max limits on results
- **Rate limiting**: Prevent abuse

### 3. Access Control

- Use read-only database users for agents
- Implement row-level security if needed
- Audit all queries
- Log access for compliance

## Example: Salesforce Integration

```typescript
// src/lib/integrations/salesforce.ts
import jsforce from 'jsforce'

export class SalesforceAdapter {
  private conn: jsforce.Connection

  constructor() {
    this.conn = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_LOGIN_URL
    })
  }

  async authenticate() {
    await this.conn.login(
      process.env.SALESFORCE_USERNAME!,
      process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!
    )
  }

  async query(sobject: string, filters: any, limit: number = 50) {
    let soql = `SELECT * FROM ${sobject} WHERE Id != null`
    
    if (filters.dateRange) {
      soql += ` AND CreatedDate >= ${filters.dateRange.start} AND CreatedDate <= ${filters.dateRange.end}`
    }

    soql += ` LIMIT ${limit}`

    const result = await this.conn.query(soql)
    return result.records
  }
}
```

## Environment Variables

```bash
# PostgreSQL
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
POSTGRES_SSL=true

# MongoDB
MONGODB_URI=mongodb://user:pass@host:port/db
MONGODB_DB=your-database

# Salesforce
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_USERNAME=your-username
SALESFORCE_PASSWORD=your-password
SALESFORCE_SECURITY_TOKEN=your-token

# API Integration
API_BASE_URL=https://api.example.com
API_KEY=your-api-key
```

## Testing Your Integration

### 1. Test Connection

```typescript
// Test script
import { PostgreSQLAdapter } from './lib/db-adapters/postgresql'

const adapter = new PostgreSQLAdapter()
const results = await adapter.query('transactions', {
  dateRange: { start: '2025-01-01', end: '2025-12-31' },
  limit: 10
})

console.log('Results:', results)
```

### 2. Test with Agent

1. Create an agent with your data source
2. Ask a question: "What are our top transactions this month?"
3. Verify the agent uses your custom tool
4. Check the results are accurate

## Migration from Firestore

If you're currently using Firestore and want to migrate:

1. **Keep Firestore as fallback**: Don't remove existing code
2. **Add new tools gradually**: Test each data source
3. **Update agent configs**: Point agents to new data sources
4. **Monitor performance**: Compare query times and accuracy

## Best Practices

1. **Start Small**: Integrate one data source at a time
2. **Test Thoroughly**: Verify queries return expected results
3. **Monitor Usage**: Track which tools are used most
4. **Optimize Queries**: Add indexes, limit results appropriately
5. **Document Schemas**: Help the LLM understand your data structure
6. **Handle Errors Gracefully**: Provide helpful error messages

## Support

For integration help:
- Check our [documentation](https://docs.nectic.ai)
- Join our [Discord](https://discord.gg/nectic)
- Email: support@nectic.ai

---

**Ready to integrate?** Start with Method 1 (Custom Tool Functions) - it's the most flexible and maintainable approach.

