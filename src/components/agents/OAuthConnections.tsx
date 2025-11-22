"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Zap, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Users,
  Search,
  Link2,
  Unlink,
  Info,
  Shield,
  Lock,
  Circle
} from "lucide-react"
import { oauthProviders, getProvidersByCategory, type OAuthProvider } from "@/lib/oauth-providers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Get logo domain for Clearbit logo service
function getLogoDomain(providerId: string): string {
  const domainMap: Record<string, string> = {
    'slack': 'slack.com',
    'salesforce': 'salesforce.com',
    'hubspot': 'hubspot.com',
    'zendesk': 'zendesk.com',
    'google-workspace': 'google.com',
    'notion': 'notion.so',
    'stripe': 'stripe.com',
    'microsoft-teams': 'microsoft.com',
    'discord': 'discord.com',
    'pipedrive': 'pipedrive.com',
    'google-drive': 'drive.google.com',
    'dropbox': 'dropbox.com',
    'aws-s3': 'amazonaws.com',
    'confluence': 'atlassian.com',
    'google-analytics': 'analytics.google.com',
    'mixpanel': 'mixpanel.com',
    'paypal': 'paypal.com',
    'jira': 'atlassian.com',
    'asana': 'asana.com',
    'trello': 'trello.com',
    'mailchimp': 'mailchimp.com',
    'snowflake': 'snowflake.com',
    'bigquery': 'cloud.google.com',
  }
  return domainMap[providerId] || `${providerId}.com`
}

interface OAuthConnectionsProps {
  connectedProviders: string[]
  onProviderConnect: (providerId: string) => void
  onProviderDisconnect: (providerId: string) => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  communication: <MessageSquare className="w-4 h-4" />,
  crm: <Zap className="w-4 h-4" />,
  storage: <Database className="w-4 h-4" />,
  productivity: <BarChart3 className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
  payment: <TrendingUp className="w-4 h-4" />,
  project: <Users className="w-4 h-4" />,
}

export function OAuthConnections({ 
  connectedProviders, 
  onProviderConnect, 
  onProviderDisconnect 
}: OAuthConnectionsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)

  const categories = Array.from(new Set(oauthProviders.map(p => p.category)))

  const filteredProviders = oauthProviders.filter(provider => {
    // Only show functional integrations (ones with working tool executors)
    if (provider.isFunctional !== true) {
      return false
    }
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || provider.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleConnect = async (provider: OAuthProvider) => {
    try {
      // Get auth token and call API to get OAuth URL
      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      
      const response = await fetch(`/api/oauth/${provider.id}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to initiate OAuth connection')
      }

      // If response is a redirect, follow it
      if (response.redirected) {
        window.location.href = response.url
      } else {
        // If it returns JSON with URL, use that
        const data = await response.json().catch(() => ({}))
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No OAuth URL received')
        }
      }
    } catch (error: any) {
      console.error('OAuth connection error:', error)
      alert(error.message || 'Failed to connect. Please try again.')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
          <div>
                <CardTitle className="text-xl">Integrations</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Connect your SaaS platforms securely with OAuth 2.0
            </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1.5" />
                OAuth 2.0 Secure
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1.5" />
                Encrypted Storage
              </Badge>
              {connectedProviders.length > 0 && (
                <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                  <Check className="w-3 h-3 mr-1.5" />
                  {connectedProviders.length} Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2 capitalize"
            >
              {categoryIcons[category]}
              {category.replace('-', ' ')}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
          {filteredProviders.map(provider => {
            const isConnected = connectedProviders.includes(provider.id)
            const brandColor = provider.brandColor || '#6B7280'
            
            return (
              <div
                key={provider.id}
                className={`group relative p-5 border-2 rounded-xl transition-all duration-200 flex flex-col min-h-[320px] overflow-hidden ${
                  isConnected 
                    ? "border-primary/30 bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-md"
                }`}
              >
                {/* Provider Logo/Icon */}
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10 border border-border/50 shadow-sm overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    <img
                      src={`https://logo.clearbit.com/${getLogoDomain(provider.id)}`}
                      alt={provider.name}
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        // Fallback to letter if logo fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="font-semibold text-white text-lg">${provider.name.charAt(0)}</span>`
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base text-foreground">{provider.name}</h4>
                      {isConnected && (
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{provider.description}</p>
                  </div>
                </div>

                {/* Features List */}
                {provider.features && provider.features.length > 0 && (
                  <div className="mb-4 space-y-1.5 flex-1 min-h-0">
                    <div className="space-y-1.5">
                      {provider.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-foreground/60">
                          <Circle className="w-1.5 h-1.5 fill-current flex-shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </div>
                      ))}
                      {provider.features.length > 3 && (
                        <div className="text-xs text-foreground/50 pl-3.5">
                          +{provider.features.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trust Signals */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50 flex-shrink-0">
                  <Badge variant="outline" className="text-xs py-0.5 px-2">
                    <Shield className="w-3 h-3 mr-1" />
                    OAuth 2.0
                  </Badge>
                  <Badge variant="outline" className="text-xs py-0.5 px-2">
                    <Lock className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="flex gap-2 mt-auto pt-2 flex-shrink-0 w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-9 min-w-0"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <Info className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">Details</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 border border-border/50 overflow-hidden"
                            style={{ backgroundColor: brandColor }}
                          >
                            <img
                              src={`https://logo.clearbit.com/${getLogoDomain(provider.id)}`}
                              alt={provider.name}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<span class="font-semibold text-white text-sm">${provider.name.charAt(0)}</span>`
                                }
                              }}
                            />
                          </div>
                          <div>
                            <DialogTitle className="text-lg">{provider.name} Integration</DialogTitle>
                            <DialogDescription className="text-sm mt-1">{provider.description}</DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {provider.features && provider.features.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Capabilities</Label>
                            <div className="space-y-1.5">
                              {provider.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-foreground/70">
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Required Permissions</Label>
                          <div className="flex flex-wrap gap-2">
                            {provider.scopes.map(scope => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-foreground/60 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-foreground/70 leading-relaxed">
                              Your credentials are encrypted and stored securely. We use OAuth 2.0 for secure authentication.
                          </p>
                          </div>
                        </div>
                        {!isConnected ? (
                          <Button
                            onClick={() => handleConnect(provider)}
                            className="w-full h-10"
                            style={{ backgroundColor: brandColor }}
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect {provider.name}
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            onClick={() => onProviderDisconnect(provider.id)}
                            className="w-full h-10"
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Disconnect {provider.name}
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!isConnected ? (
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-9 font-medium min-w-0"
                      onClick={() => handleConnect(provider)}
                      style={{ backgroundColor: isConnected ? undefined : brandColor }}
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">Connect</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-9 min-w-0"
                      onClick={() => onProviderDisconnect(provider.id)}
                    >
                      <Unlink className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">Disconnect</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12 text-foreground/60">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No integrations found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

