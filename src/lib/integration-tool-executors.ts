/**
 * Integration Tool Executors
 * Executes tools for external services (Slack, Google, Salesforce, etc.)
 */

import { getValidAccessToken } from './oauth-manager'

/**
 * Execute an integration tool
 */
export async function executeIntegrationTool(
  toolName: string,
  args: any,
  userId: string
): Promise<any> {
  try {
    // Determine provider from tool name
    const provider = getProviderFromToolName(toolName)
    
    if (!provider) {
      throw new Error(`Unknown integration tool: ${toolName}`)
    }

    // Get access token
    const accessToken = await getValidAccessToken(userId, provider)

    // Route to appropriate executor
    if (toolName.startsWith('slack_')) {
      return await executeSlackTool(toolName, args, accessToken)
    } else if (toolName.startsWith('google_') || toolName.startsWith('sheets_') || toolName.startsWith('gmail_')) {
      return await executeGoogleTool(toolName, args, accessToken)
    } else if (toolName.startsWith('salesforce_')) {
      return await executeSalesforceTool(toolName, args, accessToken)
    } else if (toolName.startsWith('notion_')) {
      return await executeNotionTool(toolName, args, accessToken)
    } else if (toolName.startsWith('stripe_')) {
      return await executeStripeTool(toolName, args, accessToken)
    }

    throw new Error(`Integration tool executor not implemented: ${toolName}`)
  } catch (error: any) {
    return {
      error: error.message || "Integration tool execution failed",
      tool: toolName,
      args
    }
  }
}

/**
 * Get provider ID from tool name
 */
function getProviderFromToolName(toolName: string): string | null {
  if (toolName.startsWith('slack_')) return 'slack'
  if (toolName.startsWith('google_') || toolName.startsWith('sheets_') || toolName.startsWith('gmail_')) return 'google-workspace'
  if (toolName.startsWith('salesforce_')) return 'salesforce'
  if (toolName.startsWith('notion_')) return 'notion'
  if (toolName.startsWith('stripe_')) return 'stripe'
  if (toolName.startsWith('hubspot_')) return 'hubspot'
  if (toolName.startsWith('zendesk_')) return 'zendesk'
  if (toolName.startsWith('jira_')) return 'jira'
  if (toolName.startsWith('asana_')) return 'asana'
  if (toolName.startsWith('trello_')) return 'trello'
  return null
}

/**
 * Execute Slack tools
 */
async function executeSlackTool(toolName: string, args: any, accessToken: string): Promise<any> {
  switch (toolName) {
    case 'slack_send_message': {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: args.channel,
          text: args.message,
          ...(args.thread_ts ? { thread_ts: args.thread_ts } : {}),
        }),
      })

      const data = await response.json()
      if (!data.ok) {
        throw new Error(data.error || 'Slack API error')
      }

      return {
        success: true,
        channel: args.channel,
        message_ts: data.ts,
        message: data.message,
      }
    }

    case 'slack_get_channels': {
      const response = await fetch('https://slack.com/api/conversations.list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()
      if (!data.ok) {
        throw new Error(data.error || 'Slack API error')
      }

      return {
        channels: data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          is_private: ch.is_private,
          is_archived: ch.is_archived,
        })),
      }
    }

    case 'slack_get_messages': {
      const response = await fetch(`https://slack.com/api/conversations.history?channel=${args.channel}&limit=${args.limit || 100}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()
      if (!data.ok) {
        throw new Error(data.error || 'Slack API error')
      }

      return {
        messages: data.messages.map((msg: any) => ({
          text: msg.text,
          user: msg.user,
          ts: msg.ts,
          thread_ts: msg.thread_ts,
        })),
      }
    }

    default:
      throw new Error(`Unknown Slack tool: ${toolName}`)
  }
}

/**
 * Execute Google tools (Sheets, Gmail, etc.)
 */
async function executeGoogleTool(toolName: string, args: any, accessToken: string): Promise<any> {
  switch (toolName) {
    case 'sheets_read_range': {
      const spreadsheetId = args.spreadsheet_id
      const range = args.range || 'A1:Z1000'
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Google Sheets API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        range: data.range,
        values: data.values || [],
      }
    }

    case 'sheets_write_range': {
      const spreadsheetId = args.spreadsheet_id
      const range = args.range
      const values = args.values

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Google Sheets API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        success: true,
        updatedCells: data.updatedCells,
        updatedRange: data.updatedRange,
      }
    }

    case 'gmail_send_email': {
      const to = args.to
      const subject = args.subject
      const body = args.body

      // Create email message
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n')

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Gmail API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        success: true,
        messageId: data.id,
      }
    }

    default:
      throw new Error(`Unknown Google tool: ${toolName}`)
  }
}

/**
 * Execute Salesforce tools
 */
async function executeSalesforceTool(toolName: string, args: any, accessToken: string): Promise<any> {
  // Get Salesforce instance URL from token (would need to store this)
  const instanceUrl = args.instance_url || process.env.SALESFORCE_INSTANCE_URL || 'https://login.salesforce.com'

  switch (toolName) {
    case 'salesforce_query': {
      const soql = args.soql
      const response = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soql)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Salesforce API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        records: data.records,
        totalSize: data.totalSize,
      }
    }

    case 'salesforce_create_record': {
      const objectType = args.object_type
      const fields = args.fields

      const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/${objectType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Salesforce API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        success: data.success,
        id: data.id,
      }
    }

    default:
      throw new Error(`Unknown Salesforce tool: ${toolName}`)
  }
}

/**
 * Execute Notion tools
 */
async function executeNotionTool(toolName: string, args: any, accessToken: string): Promise<any> {
  switch (toolName) {
    case 'notion_create_page': {
      const parent = args.parent
      const properties = args.properties
      const content = args.content || []

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: parent },
          properties,
          children: content,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Notion API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        success: true,
        pageId: data.id,
        url: data.url,
      }
    }

    default:
      throw new Error(`Unknown Notion tool: ${toolName}`)
  }
}

/**
 * Execute Stripe tools
 */
async function executeStripeTool(toolName: string, args: any, accessToken: string): Promise<any> {
  switch (toolName) {
    case 'stripe_create_customer': {
      const response = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: args.email,
          name: args.name || '',
        }).toString(),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Stripe API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return {
        success: true,
        customerId: data.id,
        customer: data,
      }
    }

    default:
      throw new Error(`Unknown Stripe tool: ${toolName}`)
  }
}

