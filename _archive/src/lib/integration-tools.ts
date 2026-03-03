/**
 * Integration Tools - SaaS Platform Connectors
 * These tools enable agents to interact with external SaaS platforms
 */

import { ToolDefinition } from './agent-tools'

/**
 * Communication & Collaboration Tools
 */
export const communicationTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "slack_send_message",
      description: "Send a message to a Slack channel or user. Requires Slack OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Slack channel ID or name (e.g., #general, @username)" },
          message: { type: "string", description: "Message content to send" },
          thread_ts: { type: "string", description: "Optional: Thread timestamp to reply to a thread" }
        },
        required: ["channel", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "slack_get_messages",
      description: "Retrieve messages from a Slack channel. Requires Slack OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Slack channel ID or name" },
          limit: { type: "number", description: "Number of messages to retrieve (default: 50)", default: 50 },
          oldest: { type: "string", description: "Optional: Oldest message timestamp to retrieve" }
        },
        required: ["channel"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "email_send",
      description: "Send an email via configured email service (SMTP, SendGrid, etc.)",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body (HTML or plain text)" },
          cc: { type: "array", items: { type: "string" }, description: "Optional: CC recipients" },
          attachments: { type: "array", items: { type: "string" }, description: "Optional: Attachment file paths" }
        },
        required: ["to", "subject", "body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "teams_send_message",
      description: "Send a message to Microsoft Teams channel. Requires Teams OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          channel_id: { type: "string", description: "Teams channel ID" },
          message: { type: "string", description: "Message content" }
        },
        required: ["channel_id", "message"]
      }
    }
  }
]

/**
 * CRM & Sales Tools
 */
export const crmTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "salesforce_query",
      description: "Query Salesforce records using SOQL. Requires Salesforce OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          soql: { type: "string", description: "SOQL query string" },
          object_type: { type: "string", description: "Salesforce object type (e.g., Account, Contact, Opportunity)" }
        },
        required: ["soql"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "salesforce_create_record",
      description: "Create a new record in Salesforce. Requires Salesforce OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          object_type: { type: "string", description: "Salesforce object type" },
          fields: { type: "object", description: "Field values for the new record" }
        },
        required: ["object_type", "fields"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hubspot_get_contact",
      description: "Get contact information from HubSpot. Requires HubSpot API key.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "HubSpot contact ID" },
          email: { type: "string", description: "Contact email address (alternative to contact_id)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hubspot_create_deal",
      description: "Create a new deal in HubSpot. Requires HubSpot API key.",
      parameters: {
        type: "object",
        properties: {
          deal_name: { type: "string", description: "Deal name" },
          amount: { type: "number", description: "Deal amount" },
          pipeline: { type: "string", description: "Pipeline ID" },
          stage: { type: "string", description: "Deal stage" }
        },
        required: ["deal_name", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pipedrive_get_deals",
      description: "Get deals from Pipedrive CRM. Requires Pipedrive API token.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Deal status filter" },
          limit: { type: "number", description: "Number of deals to retrieve", default: 50 }
        }
      }
    }
  }
]

/**
 * Cloud Storage & File Tools
 */
export const storageTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "s3_upload_file",
      description: "Upload a file to AWS S3. Requires AWS credentials.",
      parameters: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "S3 bucket name" },
          key: { type: "string", description: "File path/key in S3" },
          file_path: { type: "string", description: "Local file path to upload" },
          content_type: { type: "string", description: "File MIME type" }
        },
        required: ["bucket", "key", "file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "s3_download_file",
      description: "Download a file from AWS S3. Requires AWS credentials.",
      parameters: {
        type: "object",
        properties: {
          bucket: { type: "string", description: "S3 bucket name" },
          key: { type: "string", description: "File path/key in S3" }
        },
        required: ["bucket", "key"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_drive_upload",
      description: "Upload a file to Google Drive. Requires Google OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Local file path" },
          folder_id: { type: "string", description: "Optional: Google Drive folder ID" },
          file_name: { type: "string", description: "File name in Drive" }
        },
        required: ["file_path", "file_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_drive_list_files",
      description: "List files in Google Drive. Requires Google OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          folder_id: { type: "string", description: "Optional: Folder ID to list files from" },
          query: { type: "string", description: "Optional: Search query (e.g., 'name contains \"report\"')" }
        }
      }
    }
  }
]

/**
 * Spreadsheet & Data Tools
 */
export const spreadsheetTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "google_sheets_read",
      description: "Read data from Google Sheets. Requires Google OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          spreadsheet_id: { type: "string", description: "Google Sheets spreadsheet ID" },
          range: { type: "string", description: "Cell range (e.g., 'Sheet1!A1:C10')" },
          sheet_name: { type: "string", description: "Sheet name (if range doesn't include it)" }
        },
        required: ["spreadsheet_id", "range"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "google_sheets_write",
      description: "Write data to Google Sheets. Requires Google OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          spreadsheet_id: { type: "string", description: "Google Sheets spreadsheet ID" },
          range: { type: "string", description: "Cell range to write to" },
          values: { type: "array", items: { type: "array", items: { type: "string" } }, description: "2D array of values" }
        },
        required: ["spreadsheet_id", "range", "values"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "excel_read",
      description: "Read data from Excel file (local or cloud storage)",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to Excel file" },
          sheet_name: { type: "string", description: "Sheet name to read from" },
          range: { type: "string", description: "Optional: Cell range (e.g., 'A1:C10')" }
        },
        required: ["file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "csv_read",
      description: "Read data from CSV file",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to CSV file" },
          delimiter: { type: "string", description: "CSV delimiter (default: comma)", default: "," },
          has_headers: { type: "boolean", description: "Whether CSV has header row", default: true }
        },
        required: ["file_path"]
      }
    }
  }
]

/**
 * Payment & Billing Tools
 */
export const paymentTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "stripe_get_customer",
      description: "Get customer information from Stripe. Requires Stripe API key.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Stripe customer ID" },
          email: { type: "string", description: "Customer email (alternative to customer_id)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "stripe_get_subscriptions",
      description: "Get customer subscriptions from Stripe. Requires Stripe API key.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Stripe customer ID" },
          status: { type: "string", enum: ["active", "canceled", "past_due", "trialing"], description: "Filter by subscription status" }
        },
        required: ["customer_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "stripe_create_invoice",
      description: "Create an invoice in Stripe. Requires Stripe secret API key (not OAuth token).",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Stripe customer ID" },
          amount: { type: "number", description: "Invoice amount in dollars (will be converted to cents)" },
          currency: { type: "string", description: "Currency code (e.g., 'usd')", default: "usd" },
          description: { type: "string", description: "Invoice description" }
        },
        required: ["customer_id", "amount"]
      }
    }
  }
]

/**
 * Project Management Tools
 */
export const projectManagementTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "jira_get_issues",
      description: "Get issues from Jira. Requires Jira API credentials.",
      parameters: {
        type: "object",
        properties: {
          project_key: { type: "string", description: "Jira project key" },
          status: { type: "string", description: "Filter by issue status" },
          assignee: { type: "string", description: "Filter by assignee" },
          jql: { type: "string", description: "JQL query string (advanced)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "jira_create_issue",
      description: "Create a new issue in Jira. Requires Jira API credentials.",
      parameters: {
        type: "object",
        properties: {
          project_key: { type: "string", description: "Jira project key" },
          summary: { type: "string", description: "Issue summary/title" },
          description: { type: "string", description: "Issue description" },
          issue_type: { type: "string", description: "Issue type (e.g., 'Bug', 'Task', 'Story')" }
        },
        required: ["project_key", "summary", "issue_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "asana_get_tasks",
      description: "Get tasks from Asana. Requires Asana API token.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Asana project ID" },
          assignee: { type: "string", description: "Filter by assignee" },
          completed: { type: "boolean", description: "Filter by completion status" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trello_get_cards",
      description: "Get cards from Trello board. Requires Trello API credentials.",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "string", description: "Trello board ID" },
          list_id: { type: "string", description: "Optional: Filter by list ID" }
        },
        required: ["board_id"]
      }
    }
  }
]

/**
 * Marketing & Analytics Tools
 */
export const marketingTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "google_analytics_get_report",
      description: "Get analytics report from Google Analytics. Requires Google OAuth connection.",
      parameters: {
        type: "object",
        properties: {
          property_id: { type: "string", description: "GA4 property ID" },
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          metrics: { type: "array", items: { type: "string" }, description: "Metrics to retrieve (e.g., ['sessions', 'users'])" },
          dimensions: { type: "array", items: { type: "string" }, description: "Dimensions to group by" }
        },
        required: ["property_id", "start_date", "end_date", "metrics"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mailchimp_get_campaigns",
      description: "Get email campaigns from Mailchimp. Requires Mailchimp API key.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["sent", "scheduled", "draft"], description: "Filter by campaign status" },
          count: { type: "number", description: "Number of campaigns to retrieve", default: 10 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mailchimp_get_list_members",
      description: "Get members from a Mailchimp list. Requires Mailchimp API key.",
      parameters: {
        type: "object",
        properties: {
          list_id: { type: "string", description: "Mailchimp list ID" },
          status: { type: "string", enum: ["subscribed", "unsubscribed", "cleaned"], description: "Filter by member status" }
        },
        required: ["list_id"]
      }
    }
  }
]

/**
 * Database & Data Warehouse Tools
 */
export const dataWarehouseTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "snowflake_query",
      description: "Execute SQL query on Snowflake data warehouse. Requires Snowflake credentials.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL query to execute" },
          database: { type: "string", description: "Database name" },
          schema: { type: "string", description: "Schema name" }
        },
        required: ["sql"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bigquery_query",
      description: "Execute SQL query on Google BigQuery. Requires Google Cloud credentials.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL query to execute" },
          project_id: { type: "string", description: "GCP project ID" },
          dataset: { type: "string", description: "BigQuery dataset name" }
        },
        required: ["sql", "project_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "redshift_query",
      description: "Execute SQL query on AWS Redshift. Requires AWS credentials.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL query to execute" },
          database: { type: "string", description: "Database name" }
        },
        required: ["sql"]
      }
    }
  }
]

/**
 * API & Webhook Tools
 */
export const apiTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "http_request",
      description: "Make HTTP request to any REST API endpoint. Supports GET, POST, PUT, DELETE methods.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "API endpoint URL" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], description: "HTTP method", default: "GET" },
          headers: { type: "object", description: "HTTP headers (e.g., {'Authorization': 'Bearer token'})" },
          body: { type: "object", description: "Request body (for POST/PUT)" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "webhook_trigger",
      description: "Trigger a webhook endpoint with payload",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Webhook URL" },
          payload: { type: "object", description: "Payload to send" },
          method: { type: "string", enum: ["POST", "PUT"], description: "HTTP method", default: "POST" }
        },
        required: ["url", "payload"]
      }
    }
  }
]

/**
 * Combine all integration tools
 */
export const integrationTools: ToolDefinition[] = [
  ...communicationTools,
  ...crmTools,
  ...storageTools,
  ...spreadsheetTools,
  ...paymentTools,
  ...projectManagementTools,
  ...marketingTools,
  ...dataWarehouseTools,
  ...apiTools
]

