/**
 * Agent Tools - Function definitions for OpenAI Function Calling
 * These tools enable the AI to dynamically query and analyze data
 */

export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: Record<string, any>
      required?: string[]
    }
  }
}

/**
 * Available collections that can be queried
 */
export const AVAILABLE_COLLECTIONS = [
  "finance_transactions",
  "sales_deals",
  "hr_employees"
] as const

export type CollectionName = typeof AVAILABLE_COLLECTIONS[number]

/**
 * Agent tools for OpenAI Function Calling
 * These enable the LLM to decide what data to fetch and how
 * 
 * NOTE: For powerful agentic AI tools (budget analysis, forecasting, etc.),
 * see powerful-tools.ts and import powerfulTools
 */
export const agentTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "query_collection",
      description: "Query a Firestore collection with filters. Use this to fetch specific data based on user questions. You can filter by date ranges, categories, status, amounts, and more. Always specify appropriate filters to get relevant data.",
      parameters: {
        type: "object",
        properties: {
          collection: {
            type: "string",
            description: "The collection/table to query. For Firestore: finance_transactions, sales_deals, hr_employees. For external databases: any table/collection name."
          },
          filters: {
            type: "object",
            description: "Filter criteria to narrow down results",
            properties: {
              dateRange: {
                type: "object",
                description: "Date range filter with start and end dates (ISO format)",
                properties: {
                  start: { type: "string", description: "Start date in ISO format (YYYY-MM-DD)" },
                  end: { type: "string", description: "End date in ISO format (YYYY-MM-DD)" }
                }
              },
              category: {
                type: "string",
                description: "Category filter (e.g., 'software', 'utilities', 'office supplies' for finance; 'qualified', 'proposal' for sales)"
              },
              status: {
                type: "string",
                description: "Status filter (e.g., 'pending', 'cleared', 'reconciled' for finance; 'open', 'won', 'lost' for sales)"
              },
              minAmount: {
                type: "number",
                description: "Minimum amount filter (for finance transactions or deal values)"
              },
              maxAmount: {
                type: "number",
                description: "Maximum amount filter (for finance transactions or deal values)"
              },
              department: {
                type: "string",
                description: "Department filter (e.g., 'Sales', 'HR', 'Engineering')"
              },
              limit: {
                type: "number",
                description: "Maximum number of records to return. Use higher limits (50-100) for analysis, lower (10-20) for summaries. Default: 50",
                default: 50
              },
              orderBy: {
                type: "string",
                description: "Field to order by (e.g., 'date', 'amount', 'createdAt')",
                enum: ["date", "amount", "createdAt", "updatedAt", "value"]
              },
              orderDirection: {
                type: "string",
                description: "Sort direction",
                enum: ["asc", "desc"],
                default: "desc"
              }
            }
          }
        },
        required: ["collection"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_data",
      description: "Analyze data for trends, anomalies, patterns, or summaries. Use this after querying data to provide insights. Can identify outliers, calculate statistics, compare periods, or summarize findings.",
      parameters: {
        type: "object",
        properties: {
          data: {
            type: "array",
            description: "The data array to analyze (from query_collection results)",
            items: {
              type: "object",
              description: "Data item from collection"
            }
          },
          analysisType: {
            type: "string",
            enum: ["trend", "anomaly", "summary", "comparison", "statistics"],
            description: "Type of analysis: 'trend' (identify trends over time), 'anomaly' (find outliers/unusual patterns), 'summary' (provide overview), 'comparison' (compare different groups/periods), 'statistics' (calculate totals, averages, etc.)"
          },
          groupBy: {
            type: "string",
            description: "Field to group by for analysis (e.g., 'category', 'department', 'month')"
          },
          metric: {
            type: "string",
            description: "Metric to analyze (e.g., 'amount', 'value', 'count')"
          }
        },
        required: ["data", "analysisType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_collection_schema",
      description: "Get the schema/structure of a collection to understand what fields are available. Use this when you need to know what data is available before querying.",
      parameters: {
        type: "object",
        properties: {
          collection: {
            type: "string",
            enum: AVAILABLE_COLLECTIONS,
            description: "The collection to get schema for"
          }
        },
        required: ["collection"]
      }
    }
  }
]

/**
 * Collection schemas for reference
 */
export const collectionSchemas: Record<CollectionName, any> = {
  finance_transactions: {
    fields: {
      id: "string - Transaction ID",
      date: "string - Transaction date (ISO format)",
      amount: "number - Transaction amount",
      category: "string - Category (e.g., 'software', 'utilities', 'office supplies')",
      description: "string - Transaction description",
      type: "string - Type (e.g., 'income', 'expense')",
      currency: "string - Currency code",
      status: "string - Status (e.g., 'pending', 'cleared', 'reconciled')",
      vendor: "string - Vendor name",
      department: "string - Department (e.g., 'Sales', 'HR', 'Engineering')"
    },
    example: {
      id: "txn_101",
      date: "2025-11-07",
      amount: 2270,
      category: "software",
      description: "Software subscription",
      type: "expense",
      currency: "USD",
      status: "pending",
      vendor: "Slack",
      department: "HR"
    }
  },
  sales_deals: {
    fields: {
      id: "string - Deal ID",
      name: "string - Deal name",
      company: "string - Company name",
      value: "number - Deal value",
      stage: "string - Sales stage (e.g., 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost')",
      owner: "string - Sales owner",
      expectedCloseDate: "string - Expected close date (ISO format)",
      probability: "number - Win probability (0-100)",
      createdAt: "string - Creation date (ISO format)"
    },
    example: {
      id: "deal_1",
      name: "Enterprise Contract",
      company: "Acme Corp",
      value: 50000,
      stage: "proposal",
      owner: "John Doe",
      expectedCloseDate: "2025-12-15",
      probability: 75,
      createdAt: "2025-10-01"
    }
  },
  hr_employees: {
    fields: {
      id: "string - Employee ID",
      firstName: "string - First name",
      lastName: "string - Last name",
      email: "string - Email address",
      department: "string - Department",
      role: "string - Job role/title",
      hireDate: "string - Hire date (ISO format)",
      salary: "number - Salary (if available)"
    },
    example: {
      id: "emp_1",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@company.com",
      department: "Engineering",
      role: "Senior Developer",
      hireDate: "2024-01-15"
    }
  }
}

