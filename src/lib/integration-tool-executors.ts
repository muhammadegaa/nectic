/**
 * Integration Tool Executors
 * Executes tools for external services (Slack, Google, Salesforce, etc.)
 * Enterprise-grade with proper error handling, retries, and rate limiting
 */

import { getValidAccessToken, getOAuthTokenWithMetadata } from './oauth-manager'
import { apiRequest, ApiError } from './api-client'

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
      return await executeSalesforceTool(toolName, args, accessToken, userId)
    } else if (toolName.startsWith('notion_')) {
      return await executeNotionTool(toolName, args, accessToken)
    } else if (toolName.startsWith('stripe_')) {
      return await executeStripeTool(toolName, args, accessToken)
    } else if (toolName.startsWith('hubspot_')) {
      return await executeHubSpotTool(toolName, args, accessToken)
    } else if (toolName.startsWith('zendesk_')) {
      return await executeZendeskTool(toolName, args, accessToken, userId)
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
async function executeSalesforceTool(toolName: string, args: any, accessToken: string, userId: string): Promise<any> {
  // Get instance URL from stored token metadata
  const token = await getOAuthTokenWithMetadata(userId, 'salesforce')
  const instanceUrl = token?.metadata?.instanceUrl || args.instance_url || process.env.SALESFORCE_INSTANCE_URL || 'https://login.salesforce.com'
  
  // Use latest API version (v60.0 as of 2024)
  const apiVersion = 'v60.0'

  switch (toolName) {
    case 'salesforce_query': {
      const soql = args.soql
      if (!soql) {
        throw new Error('SOQL query is required')
      }

      try {
        const response = await apiRequest(
          `${instanceUrl}/services/data/${apiVersion}/query?q=${encodeURIComponent(soql)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
            retryOptions: {
              maxRetries: 3,
              retryDelay: 1000,
            },
          }
        )

        return {
          records: response.data.records || [],
          totalSize: response.data.totalSize || 0,
          done: response.data.done || false,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Salesforce query failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'salesforce_create_record': {
      const objectType = args.object_type
      const fields = args.fields

      if (!objectType || !fields) {
        throw new Error('Object type and fields are required')
      }

      try {
        const response = await apiRequest(
          `${instanceUrl}/services/data/${apiVersion}/sobjects/${objectType}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fields),
            retryOptions: {
              maxRetries: 2, // Less retries for write operations
            },
          }
        )

        return {
          success: response.data.success !== false,
          id: response.data.id,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Salesforce create failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'salesforce_update_record': {
      const objectType = args.object_type
      const recordId = args.record_id
      const fields = args.fields

      if (!objectType || !recordId || !fields) {
        throw new Error('Object type, record ID, and fields are required')
      }

      try {
        const response = await apiRequest(
          `${instanceUrl}/services/data/${apiVersion}/sobjects/${objectType}/${recordId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fields),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          id: recordId,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Salesforce update failed: ${error.message}`)
        }
        throw error
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
  // Use latest Notion API version (2022-06-28 is still current as of 2024)
  const notionVersion = '2022-06-28'

  switch (toolName) {
    case 'notion_create_page': {
      const parent = args.parent
      const properties = args.properties
      const content = args.content || []

      if (!parent || !properties) {
        throw new Error('Parent database ID and properties are required')
      }

      try {
        const response = await apiRequest(
          'https://api.notion.com/v1/pages',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Notion-Version': notionVersion,
            },
            body: JSON.stringify({
              parent: { database_id: parent },
              properties,
              children: content,
            }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          pageId: response.data.id,
          url: response.data.url,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Notion create page failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'notion_query_database': {
      const databaseId = args.database_id
      const filter = args.filter
      const sorts = args.sorts
      const pageSize = args.page_size || 100

      if (!databaseId) {
        throw new Error('Database ID is required')
      }

      try {
        const response = await apiRequest(
          `https://api.notion.com/v1/databases/${databaseId}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Notion-Version': notionVersion,
            },
            body: JSON.stringify({
              filter,
              sorts,
              page_size: pageSize,
            }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          results: response.data.results || [],
          hasMore: response.data.has_more || false,
          nextCursor: response.data.next_cursor,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Notion query failed: ${error.message}`)
        }
        throw error
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
  // IMPORTANT: Stripe integration uses API keys (secret keys), not OAuth tokens
  // For Stripe Connect (marketplace), OAuth is used, but for regular API operations,
  // users need to provide their Stripe secret key as the "accessToken"
  // In production, consider storing Stripe API keys separately from OAuth tokens
  const baseUrl = 'https://api.stripe.com/v1'

  switch (toolName) {
    case 'stripe_get_customer': {
      const customerId = args.customer_id
      const email = args.email

      if (!customerId && !email) {
        throw new Error('Customer ID or email is required')
      }

      try {
        let url = `${baseUrl}/customers`
        if (customerId) {
          url += `/${customerId}`
        } else if (email) {
          url += `/search?query=email:'${encodeURIComponent(email)}'`
        }

        const response = await apiRequest(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          retryOptions: {
            maxRetries: 3,
          },
        })

        if (customerId) {
          return {
            customer: response.data,
          }
        } else {
          return {
            customers: response.data.data || [],
            hasMore: response.data.has_more || false,
          }
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Stripe get customer failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'stripe_create_customer': {
      const email = args.email
      const name = args.name
      const metadata = args.metadata || {}

      if (!email) {
        throw new Error('Email is required')
      }

      try {
        const params = new URLSearchParams({
          email,
          ...(name ? { name } : {}),
        })

        // Add metadata if provided
        Object.entries(metadata).forEach(([key, value]) => {
          params.append(`metadata[${key}]`, String(value))
        })

        const response = await apiRequest(
          `${baseUrl}/customers`,
          {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
            body: params.toString(),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          customerId: response.data.id,
          customer: response.data,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Stripe create customer failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'stripe_get_subscriptions': {
      const customerId = args.customer_id
      const status = args.status

      if (!customerId) {
        throw new Error('Customer ID is required')
      }

      try {
        let url = `${baseUrl}/subscriptions?customer=${customerId}`
        if (status) {
          url += `&status=${status}`
        }

        const response = await apiRequest(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          retryOptions: {
            maxRetries: 3,
          },
        })

        return {
          subscriptions: response.data.data || [],
          hasMore: response.data.has_more || false,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Stripe get subscriptions failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'stripe_create_invoice': {
      const customerId = args.customer_id
      let amount = args.amount
      const currency = args.currency || 'usd'
      const description = args.description

      if (!customerId || amount === undefined) {
        throw new Error('Customer ID and amount are required')
      }

      // Convert amount to cents if it's in dollars (assume > 1000 means it's already in cents)
      if (amount < 1000) {
        amount = Math.round(amount * 100)
      }

      try {
        // Create invoice item first
        const invoiceItemParams = new URLSearchParams({
          customer: customerId,
          amount: String(amount),
          currency,
          ...(description ? { description } : {}),
        })

        await apiRequest(
          `${baseUrl}/invoiceitems`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: invoiceItemParams.toString(),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        // Then create invoice
        const invoiceParams = new URLSearchParams({
          customer: customerId,
          auto_advance: 'true',
        })

        const response = await apiRequest(
          `${baseUrl}/invoices`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: invoiceParams.toString(),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

      return {
        success: true,
          invoiceId: response.data.id,
          invoice: response.data,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Stripe create invoice failed: ${error.message}`)
        }
        throw error
      }
    }

    default:
      throw new Error(`Unknown Stripe tool: ${toolName}`)
  }
}

/**
 * Execute HubSpot tools
 */
async function executeHubSpotTool(toolName: string, args: any, accessToken: string): Promise<any> {
  const baseUrl = 'https://api.hubapi.com'

  switch (toolName) {
    case 'hubspot_get_contact': {
      const contactId = args.contact_id
      const email = args.email

      if (!contactId && !email) {
        throw new Error('Contact ID or email is required')
      }

      try {
        let url = `${baseUrl}/crm/v3/objects/contacts`
        if (contactId) {
          url += `/${contactId}`
        } else if (email) {
          url += `/search`
        }

        const requestOptions: RequestInit & { retryOptions?: any } = {
          method: contactId ? 'GET' : 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          retryOptions: {
            maxRetries: 3,
          },
        }

        if (email && !contactId) {
          requestOptions.body = JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              }],
            }],
          })
        }

        const response = await apiRequest(url, requestOptions)

        if (contactId) {
          return {
            contact: response.data,
          }
        } else {
          return {
            contacts: response.data.results || [],
            total: response.data.total || 0,
          }
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`HubSpot get contact failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'hubspot_create_contact': {
      const properties = args.properties

      if (!properties || !properties.email) {
        throw new Error('Contact properties with email are required')
      }

      try {
        const response = await apiRequest(
          `${baseUrl}/crm/v3/objects/contacts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          contactId: response.data.id,
          contact: response.data,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`HubSpot create contact failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'hubspot_get_deals':
    case 'hubspot_get_deal': {
      const limit = args.limit || 100
      const after = args.after
      const dealId = args.deal_id

      try {
        let url: string
        if (dealId) {
          url = `${baseUrl}/crm/v3/objects/deals/${dealId}`
        } else {
          const urlObj = new URL(`${baseUrl}/crm/v3/objects/deals`)
          urlObj.searchParams.set('limit', String(limit))
        if (after) {
            urlObj.searchParams.set('after', after)
          }
          url = urlObj.toString()
        }

        const response = await apiRequest(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          retryOptions: {
            maxRetries: 3,
          },
        })

        if (dealId) {
          return {
            deal: response.data,
          }
        } else {
        return {
          deals: response.data.results || [],
          paging: response.data.paging,
          }
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`HubSpot get deals failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'hubspot_create_deal': {
      const dealName = args.deal_name
      const amount = args.amount
      const pipeline = args.pipeline
      const stage = args.stage
      const properties = args.properties || {}

      if (!dealName || amount === undefined) {
        throw new Error('Deal name and amount are required')
      }

      try {
        const dealProperties = {
          dealname: dealName,
          amount: String(amount),
          ...(pipeline ? { pipeline } : {}),
          ...(stage ? { dealstage: stage } : {}),
          ...properties,
        }

        const response = await apiRequest(
          `${baseUrl}/crm/v3/objects/deals`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties: dealProperties }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          dealId: response.data.id,
          deal: response.data,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`HubSpot create deal failed: ${error.message}`)
        }
        throw error
      }
    }

    default:
      throw new Error(`Unknown HubSpot tool: ${toolName}`)
  }
}

/**
 * Execute Zendesk tools
 */
async function executeZendeskTool(toolName: string, args: any, accessToken: string, userId: string): Promise<any> {
  // Get subdomain from stored token metadata, args, or env
  const token = await getOAuthTokenWithMetadata(userId, 'zendesk')
  const subdomain = token?.metadata?.subdomain || args.subdomain || process.env.ZENDESK_SUBDOMAIN

  if (!subdomain) {
    throw new Error('Zendesk subdomain is required. Please reconnect your Zendesk account with your subdomain (e.g., "yourcompany" for yourcompany.zendesk.com).')
  }

  // Validate subdomain format (basic check)
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    throw new Error('Invalid Zendesk subdomain format. Subdomain should only contain lowercase letters, numbers, and hyphens.')
  }

  const baseUrl = `https://${subdomain}.zendesk.com/api/v2`

  switch (toolName) {
    case 'zendesk_get_tickets': {
      const status = args.status
      const limit = args.limit || 100

      try {
        let url = `${baseUrl}/tickets.json?per_page=${limit}`
        if (status) {
          url += `&status=${status}`
        }

        const response = await apiRequest(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          retryOptions: {
            maxRetries: 3,
          },
        })

        return {
          tickets: response.data.tickets || [],
          count: response.data.count || 0,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Zendesk get tickets failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'zendesk_create_ticket': {
      const subject = args.subject
      const description = args.description
      const priority = args.priority || 'normal'
      const type = args.type || 'question'

      if (!subject || !description) {
        throw new Error('Subject and description are required')
      }

      try {
        const response = await apiRequest(
          `${baseUrl}/tickets.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticket: {
                subject,
                comment: {
                  body: description,
                },
                priority,
                type,
              },
            }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          ticketId: response.data.ticket.id,
          ticket: response.data.ticket,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Zendesk create ticket failed: ${error.message}`)
        }
        throw error
      }
    }

    case 'zendesk_update_ticket': {
      const ticketId = args.ticket_id
      const status = args.status
      const comment = args.comment

      if (!ticketId) {
        throw new Error('Ticket ID is required')
      }

      try {
        const updateData: any = {}
        if (status) updateData.status = status
        if (comment) {
          updateData.comment = { body: comment }
        }

        const response = await apiRequest(
          `${baseUrl}/tickets/${ticketId}.json`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticket: updateData }),
            retryOptions: {
              maxRetries: 2,
            },
          }
        )

        return {
          success: true,
          ticket: response.data.ticket,
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw new Error(`Zendesk update ticket failed: ${error.message}`)
        }
        throw error
      }
    }

    default:
      throw new Error(`Unknown Zendesk tool: ${toolName}`)
  }
}

