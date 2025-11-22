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
  Info
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
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || provider.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleConnect = async (provider: OAuthProvider) => {
    try {
      // Redirect to OAuth initiation endpoint
      const redirectUri = `${window.location.origin}/api/oauth/${provider.id}`
      window.location.href = redirectUri
    } catch (error: any) {
      console.error('OAuth connection error:', error)
      // Fallback: still call the callback for UI state
      onProviderConnect(provider.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>OAuth Integrations</CardTitle>
            <CardDescription>
              Connect your SaaS platforms to enable tools and connectors
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {connectedProviders.length} connected
          </Badge>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
          {filteredProviders.map(provider => {
            const isConnected = connectedProviders.includes(provider.id)
            
            return (
              <div
                key={provider.id}
                className={`p-4 border rounded-lg transition-all ${
                  isConnected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{provider.name}</h4>
                      {isConnected && (
                        <Badge variant="default" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 mb-3">{provider.description}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{provider.name} Integration</DialogTitle>
                        <DialogDescription>{provider.description}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label className="text-xs">Required Scopes</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {provider.scopes.map(scope => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-foreground/60">
                            Connecting {provider.name} will enable tools like {provider.name.toLowerCase()}_send_message, 
                            {provider.name.toLowerCase()}_get_data, and more.
                          </p>
                        </div>
                        {!isConnected ? (
                          <Button
                            onClick={() => handleConnect(provider)}
                            className="w-full"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect {provider.name}
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            onClick={() => onProviderDisconnect(provider.id)}
                            className="w-full"
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!isConnected ? (
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleConnect(provider)}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-destructive"
                      onClick={() => onProviderDisconnect(provider.id)}
                    >
                      <Unlink className="w-3 h-3 mr-1" />
                      Disconnect
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

