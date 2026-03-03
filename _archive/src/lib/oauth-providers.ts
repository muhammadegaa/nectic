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
  isFunctional?: boolean // True if tool executors exist and work
  features?: string[] // List of capabilities/tools enabled by this integration
  brandColor?: string // Brand color for visual identity
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
    category: 'communication',
    isFunctional: true,
    brandColor: '#4A154B',
    features: [
      'Send messages to channels',
      'Read channel messages',
      'List available channels'
    ]
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Microsoft Teams collaboration',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/ChannelMessage.Send', 'https://graph.microsoft.com/Channel.ReadBasic.All'],
    category: 'communication',
    isFunctional: false
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Discord server integration',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['bot', 'messages.read', 'messages.write'],
    category: 'communication',
    isFunctional: false
  },
  
  // CRM & Sales
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM and sales management',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'offline_access'],
    category: 'crm',
    isFunctional: true,
    brandColor: '#00A1E0',
    features: [
      'Query records with SOQL',
      'Create new records',
      'Update existing records',
      'Get record details'
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing, sales, and service platform',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['contacts', 'content', 'reports', 'sales-email-read'],
    category: 'crm',
    isFunctional: true,
    brandColor: '#FF7A59',
    features: [
      'Get contact information',
      'Create and update contacts',
      'Get and create deals',
      'Manage pipelines'
    ]
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales CRM and pipeline management',
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    scopes: ['base'],
    category: 'crm',
    isFunctional: false
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and ticketing',
    authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    scopes: ['read', 'write'],
    category: 'crm',
    isFunctional: true,
    brandColor: '#03363D',
    features: [
      'Get support tickets',
      'Create new tickets',
      'Update ticket status',
      'Add comments to tickets'
    ]
  },
  
  // Storage & Files
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'File storage and sharing',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    category: 'storage',
    isFunctional: false
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud file storage',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropbox.com/oauth2/token',
    scopes: ['files.content.read', 'files.content.write'],
    category: 'storage',
    isFunctional: false
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Amazon S3 cloud storage',
    authUrl: 'https://signin.aws.amazon.com/oauth',
    tokenUrl: 'https://signin.aws.amazon.com/oauth/token',
    scopes: ['s3:GetObject', 's3:PutObject'],
    category: 'storage',
    isFunctional: false
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
    category: 'productivity',
    isFunctional: true,
    brandColor: '#4285F4',
    features: [
      'Read and write Google Sheets',
      'Send emails via Gmail',
      'Access Google Calendar'
    ]
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Workspace and documentation',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: ['read', 'update'],
    category: 'productivity',
    isFunctional: true,
    brandColor: '#000000',
    features: [
      'Read pages and databases',
      'Create new pages',
      'Update page content',
      'Query databases'
    ]
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Team collaboration and documentation',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:confluence-content.all', 'write:confluence-content'],
    category: 'productivity',
    isFunctional: false
  },
  
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Website and app analytics',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    category: 'analytics',
    isFunctional: false
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics',
    authUrl: 'https://mixpanel.com/oauth/authorize',
    tokenUrl: 'https://mixpanel.com/api/2.0/oauth/token',
    scopes: ['read', 'export'],
    category: 'analytics',
    isFunctional: false
  },
  
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing (uses API keys, not OAuth)',
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    scopes: ['read', 'write'],
    category: 'payment',
    isFunctional: true,
    brandColor: '#635BFF',
    features: [
      'Get customer information',
      'Create customers',
      'View subscriptions',
      'Create invoices'
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Payment processing',
    authUrl: 'https://www.paypal.com/connect',
    tokenUrl: 'https://api.paypal.com/v1/oauth2/token',
    scopes: ['https://uri.paypal.com/services/invoicing'],
    category: 'payment',
    isFunctional: false
  },
  
  // Project Management
  {
    id: 'jira',
    name: 'Jira',
    description: 'Project and issue tracking',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'write:jira-work'],
    category: 'project',
    isFunctional: false
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Project management',
    authUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    scopes: ['default'],
    category: 'project',
    isFunctional: false
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Board-based project management',
    authUrl: 'https://trello.com/1/OAuthAuthorizeToken',
    tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
    scopes: ['read', 'write'],
    category: 'project',
    isFunctional: false
  },
  
  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing',
    authUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    scopes: ['campaign_read', 'list_read'],
    category: 'analytics',
    isFunctional: false
  },
  
  // Data Warehouses
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data warehouse',
    authUrl: 'https://{account}.snowflakecomputing.com/oauth/authorize',
    tokenUrl: 'https://{account}.snowflakecomputing.com/oauth/token',
    scopes: ['session:role-any'],
    category: 'analytics',
    isFunctional: false
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    description: 'Data warehouse and analytics',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/bigquery'],
    category: 'analytics',
    isFunctional: false
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

