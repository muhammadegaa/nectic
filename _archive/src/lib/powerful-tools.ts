/**
 * Powerful Agentic AI Tools
 * These are REAL tools that perform complex business calculations,
 * not just simple queries. They enable true agentic behavior.
 */

import { ToolDefinition } from './agent-tools'
import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { COLLECTIONS } from '@/infrastructure/database/schema'

/**
 * Finance Tools - Powerful business calculations
 */
export const financeTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "budget_vs_actual",
      description: "Compare budgeted amounts vs actual spending. Calculates variance, percentage over/under budget, and identifies departments/categories that are over budget. This is a powerful analysis tool that queries budgets and transactions, then performs calculations.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze (e.g., '2024-Q4', '2025-01', '2024')"
          },
          department: {
            type: "string",
            description: "Optional: Filter by specific department"
          },
          category: {
            type: "string",
            description: "Optional: Filter by specific category"
          }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cash_flow_forecast",
      description: "Forecast cash flow for the next N months based on historical income/expense patterns. Uses trend analysis and seasonality to predict future cash flow. Returns projected income, expenses, and net cash flow.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description: "Number of months to forecast (default: 3)",
            default: 3
          },
          includeSeasonality: {
            type: "boolean",
            description: "Account for seasonal patterns in historical data",
            default: true
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "revenue_trend_analysis",
      description: "Analyze revenue trends over time with growth rates, period-over-period comparisons, and identification of growth/decline patterns. Returns monthly/quarterly breakdowns with percentage changes.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze (e.g., 'last-12-months', '2024', 'Q4-2024')"
          },
          groupBy: {
            type: "string",
            enum: ["month", "quarter", "year"],
            description: "How to group the analysis",
            default: "month"
          }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "expense_categorization_analysis",
      description: "Analyze spending patterns by category, department, or vendor. Identifies top spenders, unusual patterns, and opportunities for cost optimization. Returns ranked lists with percentages.",
      parameters: {
        type: "object",
        properties: {
          groupBy: {
            type: "string",
            enum: ["category", "department", "vendor"],
            description: "How to group expenses",
            default: "category"
          },
          period: {
            type: "string",
            description: "Time period (e.g., 'last-3-months', '2024-Q4')"
          },
          topN: {
            type: "number",
            description: "Number of top items to return",
            default: 10
          }
        },
        required: ["groupBy", "period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "financial_health_score",
      description: "Calculate overall financial health score (0-100) based on multiple factors: cash flow trends, expense ratios, budget adherence, revenue growth. Returns score with breakdown and recommendations.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze (e.g., 'last-6-months', '2024')"
          }
        },
        required: ["period"]
      }
    }
  }
]

/**
 * Sales Tools - Powerful pipeline and forecasting
 */
export const salesTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "pipeline_health",
      description: "Analyze sales pipeline health. Calculates weighted pipeline value, conversion rates by stage, average sales cycle, and identifies bottlenecks. Returns actionable insights.",
      parameters: {
        type: "object",
        properties: {
          owner: {
            type: "string",
            description: "Optional: Filter by sales owner"
          },
          industry: {
            type: "string",
            description: "Optional: Filter by industry"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "win_rate_analysis",
      description: "Calculate win rates by stage, owner, industry, or time period. Identifies what's working and what's not. Returns conversion rates and recommendations for improvement.",
      parameters: {
        type: "object",
        properties: {
          groupBy: {
            type: "string",
            enum: ["stage", "owner", "industry", "period"],
            description: "How to group the analysis"
          },
          period: {
            type: "string",
            description: "Time period (e.g., 'last-6-months', '2024')"
          }
        },
        required: ["groupBy", "period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sales_forecast",
      description: "Forecast sales revenue for upcoming periods based on pipeline, historical close rates, and deal velocity. Returns projected revenue with confidence intervals.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description: "Number of months to forecast",
            default: 3
          },
          includeProbability: {
            type: "boolean",
            description: "Weight forecast by deal probability",
            default: true
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "at_risk_deals_detection",
      description: "Identify deals at risk of being lost. Analyzes deal age, stage progression, activity patterns, and probability changes. Returns list of at-risk deals with risk factors.",
      parameters: {
        type: "object",
        properties: {
          riskThreshold: {
            type: "number",
            description: "Risk score threshold (0-100, default: 70)",
            default: 70
          },
          owner: {
            type: "string",
            description: "Optional: Filter by sales owner"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "conversion_funnel_analysis",
      description: "Analyze conversion funnel from prospect to closed-won. Identifies drop-off points, average time in each stage, and conversion rates. Returns funnel visualization data.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze"
          }
        },
        required: ["period"]
      }
    }
  }
]

/**
 * HR Tools - Team analytics and insights
 */
export const hrTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "team_capacity_analysis",
      description: "Analyze team capacity across departments. Calculates headcount, utilization rates, hiring needs, and identifies over/under-staffed areas. Returns capacity metrics and recommendations.",
      parameters: {
        type: "object",
        properties: {
          department: {
            type: "string",
            description: "Optional: Filter by specific department"
          },
          includeProjections: {
            type: "boolean",
            description: "Include projected capacity based on growth trends",
            default: true
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "performance_trends",
      description: "Analyze employee performance trends over time. Identifies top performers, improvement patterns, and areas needing attention. Returns performance metrics by department/role.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period (e.g., 'last-12-months', '2024')"
          },
          department: {
            type: "string",
            description: "Optional: Filter by department"
          }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "retention_risk_analysis",
      description: "Identify employees at risk of leaving. Analyzes performance trends, tenure, recent changes, and patterns. Returns risk scores and recommendations.",
      parameters: {
        type: "object",
        properties: {
          riskThreshold: {
            type: "number",
            description: "Risk score threshold (0-100, default: 60)",
            default: 60
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hiring_needs_prediction",
      description: "Predict hiring needs based on growth trends, current capacity, and projected workload. Returns recommended headcount by department with timeline.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description: "Forecast horizon in months",
            default: 6
          }
        }
      }
    }
  }
]

/**
 * Cross-Collection Tools - Work across multiple data sources
 */
export const crossCollectionTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "correlate_finance_sales",
      description: "Correlate finance and sales data. Analyzes relationships between revenue, expenses, and sales performance. Identifies patterns like 'when sales increase, which expenses also increase'.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze"
          },
          analysisType: {
            type: "string",
            enum: ["revenue_vs_expenses", "sales_growth_vs_costs", "deal_size_vs_marketing_spend"],
            description: "Type of correlation to analyze"
          }
        },
        required: ["period", "analysisType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "department_performance_comparison",
      description: "Compare performance across departments using finance, sales, and HR data. Returns comprehensive department scorecards with KPIs.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period to analyze"
          },
          metrics: {
            type: "array",
            items: { type: "string" },
            description: "Metrics to include (e.g., ['revenue', 'expenses', 'headcount', 'productivity'])"
          }
        },
        required: ["period"]
      }
    }
  }
]

/**
 * Advanced Analysis Tools - Predictive and sophisticated
 */
export const advancedTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "trend_forecasting",
      description: "Forecast trends using statistical methods (moving averages, exponential smoothing). More sophisticated than simple trend analysis. Returns forecasted values with confidence intervals.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            description: "Metric to forecast (e.g., 'revenue', 'expenses', 'deals')"
          },
          collection: {
            type: "string",
            enum: ["finance_transactions", "sales_deals", "hr_employees"],
            description: "Data source"
          },
          periods: {
            type: "number",
            description: "Number of future periods to forecast",
            default: 3
          },
          method: {
            type: "string",
            enum: ["moving_average", "exponential_smoothing", "linear_regression"],
            description: "Forecasting method",
            default: "exponential_smoothing"
          }
        },
        required: ["metric", "collection", "periods"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "what_if_scenario",
      description: "Run 'what-if' scenarios. For example: 'What if we increase marketing spend by 20%?' or 'What if we close 3 more deals this quarter?'. Returns projected outcomes.",
      parameters: {
        type: "object",
        properties: {
          scenario: {
            type: "string",
            description: "Description of the scenario (e.g., 'increase marketing spend by 20%', 'close 3 more deals')"
          },
          metric: {
            type: "string",
            description: "Metric to project (e.g., 'revenue', 'cash_flow', 'profit')"
          },
          period: {
            type: "string",
            description: "Time period for the scenario"
          }
        },
        required: ["scenario", "metric", "period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pattern_recognition",
      description: "Identify complex patterns in data that might not be obvious. Uses statistical analysis to find correlations, cycles, and anomalies across multiple dimensions.",
      parameters: {
        type: "object",
        properties: {
          collections: {
            type: "array",
            items: { type: "string" },
            description: "Collections to analyze (can be multiple)"
          },
          patternType: {
            type: "string",
            enum: ["seasonal", "cyclical", "correlation", "anomaly_cluster"],
            description: "Type of pattern to look for"
          },
          period: {
            type: "string",
            description: "Time period to analyze"
          }
        },
        required: ["collections", "patternType", "period"]
      }
    }
  }
]

/**
 * Combine all powerful tools
 */
export const powerfulTools: ToolDefinition[] = [
  ...financeTools,
  ...salesTools,
  ...hrTools,
  ...crossCollectionTools,
  ...advancedTools
]

