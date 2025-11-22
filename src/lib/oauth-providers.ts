/**
 * OAuth Provider Configurations
 * Defines OAuth settings for various SaaS platforms
 */

export interface OAuthProvider {
  id: string
  name: string
  description: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  icon?: string
  category: 'communication' | 'crm' | 'storage' | 'productivity' | 'analytics' | 'payment' | 'project'
}

export const oauthProviders: OAuthProvider[] = [
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    category: 'communication'
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Microsoft Teams collaboration',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/ChannelMessage.Send', 'https://graph.microsoft.com/Channel.ReadBasic.All'],
    category: 'communication'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Discord server integration',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['bot', 'messages.read', 'messages.write'],
    category: 'communication'
  },
  
  // CRM & Sales
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM and sales management',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'offline_access'],
    category: 'crm'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing, sales, and service platform',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['contacts', 'content', 'reports', 'sales-email-read'],
    category: 'crm'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales CRM and pipeline management',
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    scopes: ['base'],
    category: 'crm'
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and ticketing',
    authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    scopes: ['read', 'write'],
    category: 'crm'
  },
  
  // Storage & Files
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'File storage and sharing',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    category: 'storage'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud file storage',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropbox.com/oauth2/token',
    scopes: ['files.content.read', 'files.content.write'],
    category: 'storage'
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Amazon S3 cloud storage',
    authUrl: 'https://signin.aws.amazon.com/oauth',
    tokenUrl: 'https://signin.aws.amazon.com/oauth/token',
    scopes: ['s3:GetObject', 's3:PutObject'],
    category: 'storage'
  },
  
  // Productivity
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Docs, Sheets',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
    category: 'productivity'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Workspace and documentation',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read', 'update'],
    category: 'productivity'
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Team collaboration and documentation',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:confluence-content.all', 'write:confluence-content'],
    category: 'productivity'
  },
  
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Website and app analytics',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    category: 'analytics'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics',
    authUrl: 'https://mixpanel.com/oauth/authorize',
    tokenUrl: 'https://mixpanel.com/api/2.0/oauth/token',
    scopes: ['read', 'export'],
    category: 'analytics'
  },
  
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    scopes: ['read', 'write'],
    category: 'payment'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Payment processing',
    authUrl: 'https://www.paypal.com/connect',
    tokenUrl: 'https://api.paypal.com/v1/oauth2/token',
    scopes: ['https://uri.paypal.com/services/invoicing'],
    category: 'payment'
  },
  
  // Project Management
  {
    id: 'jira',
    name: 'Jira',
    description: 'Project and issue tracking',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'write:jira-work'],
    category: 'project'
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Project management',
    authUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    scopes: ['default'],
    category: 'project'
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Board-based project management',
    authUrl: 'https://trello.com/1/OAuthAuthorizeToken',
    tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
    scopes: ['read', 'write'],
    category: 'project'
  },
  
  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing',
    authUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    scopes: ['campaign_read', 'list_read'],
    category: 'analytics'
  },
  
  // Data Warehouses
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data warehouse',
    authUrl: 'https://{account}.snowflakecomputing.com/oauth/authorize',
    tokenUrl: 'https://{account}.snowflakecomputing.com/oauth/token',
    scopes: ['session:role-any'],
    category: 'analytics'
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    description: 'Data warehouse and analytics',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/bigquery'],
    category: 'analytics'
  }
]

/**
 * Get OAuth providers by category
 */
export function getProvidersByCategory(category: OAuthProvider['category']): OAuthProvider[] {
  return oauthProviders.filter(p => p.category === category)
}

/**
 * Get OAuth provider by ID
 */
export function getProviderById(id: string): OAuthProvider | undefined {
  return oauthProviders.find(p => p.id === id)
}

