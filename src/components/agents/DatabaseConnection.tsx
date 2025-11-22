"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { DatabaseConnection } from "@/lib/db-adapters/base-adapter"

interface DatabaseConnectionProps {
  connection: DatabaseConnection | null
  onConnectionChange: (connection: DatabaseConnection | null) => void
}

export function DatabaseConnectionForm({ connection, onConnectionChange }: DatabaseConnectionProps) {
  const { toast } = useToast()
  const [connectionType, setConnectionType] = useState<'firestore' | 'postgresql' | 'mysql' | 'mongodb'>(
    connection?.type || 'firestore'
  )
  const [host, setHost] = useState(connection?.host || '')
  const [port, setPort] = useState(connection?.port?.toString() || '')
  const [database, setDatabase] = useState(connection?.database || '')
  const [username, setUsername] = useState(connection?.username || '')
  const [password, setPassword] = useState(connection?.password || '')
  const [connectionString, setConnectionString] = useState(connection?.connectionString || '')
  const [ssl, setSsl] = useState(connection?.ssl || false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTypeChange = (type: string) => {
    setConnectionType(type as any)
    if (type === 'firestore') {
      onConnectionChange(null)
      setTestResult(null)
    } else {
      // Reset fields when switching type
      setHost('')
      setPort('')
      setDatabase('')
      setUsername('')
      setPassword('')
      setConnectionString('')
      setSsl(false)
      setTestResult(null)
    }
  }

  const handleTestConnection = async () => {
    if (connectionType === 'firestore') {
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const testConnection: DatabaseConnection = {
        type: connectionType,
        host: host || undefined,
        port: port ? parseInt(port) : undefined,
        database: database || undefined,
        username: username || undefined,
        password: password || undefined,
        connectionString: connectionString || undefined,
        ssl: ssl,
      }

      const { getAuthHeaders } = await import('@/lib/auth-client')
      const headers = await getAuthHeaders()
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConnection),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult('success')
        onConnectionChange(testConnection)
        toast({
          title: "Connection Successful",
          description: "Database connection test passed",
        })
      } else {
        setTestResult('error')
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to database",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setTestResult('error')
      toast({
        title: "Connection Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConnection = () => {
    if (connectionType === 'firestore') {
      onConnectionChange(null)
      return
    }

    // Validate required fields
    if (!connectionString && (!host || !database)) {
      toast({
        title: "Validation Error",
        description: "Please provide either a connection string or host + database name",
        variant: "destructive",
      })
      return
    }

    if (!connectionString && connectionType !== 'mongodb' && (!username || !password)) {
      toast({
        title: "Validation Error",
        description: "Username and password are required for this database type",
        variant: "destructive",
      })
      return
    }

    const dbConnection: DatabaseConnection = {
      type: connectionType,
      host: host || undefined,
      port: port ? parseInt(port) : undefined,
      database: database || undefined,
      username: username || undefined,
      password: password || undefined,
      connectionString: connectionString || undefined,
      ssl: ssl,
    }

    onConnectionChange(dbConnection)
    toast({
      title: "Connection Saved",
      description: "Database connection configuration saved",
    })
  }

  if (connectionType === 'firestore') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Connection
          </CardTitle>
          <CardDescription>
            Choose your data source. Default is Firestore (demo data).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Database Type</Label>
              <Select value={connectionType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firestore">Firestore (Default - Demo Data)</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-foreground/60">
              Using Firestore with demo data. Switch to connect your own database.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Connect to your own database (PostgreSQL, MySQL, or MongoDB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Database Type</Label>
          <Select value={connectionType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firestore">Firestore (Default)</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mongodb">MongoDB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Connection String (optional)</Label>
          <Input
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="e.g., postgresql://user:pass@host:5432/db"
            className="font-mono text-xs"
          />
          <p className="text-xs text-foreground/60">
            Provide a connection string OR fill in individual fields below
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Host</Label>
            <Input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="localhost"
              disabled={!!connectionString}
            />
          </div>

          <div className="space-y-2">
            <Label>Port</Label>
            <Input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder={connectionType === 'postgresql' ? '5432' : connectionType === 'mysql' ? '3306' : '27017'}
              disabled={!!connectionString}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Database Name</Label>
          <Input
            type="text"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder="database_name"
            disabled={!!connectionString}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled={!!connectionString}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              disabled={!!connectionString}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ssl"
            checked={ssl}
            onChange={(e) => setSsl(e.target.checked)}
            className="rounded border-border"
            disabled={!!connectionString}
          />
          <Label htmlFor="ssl" className="cursor-pointer">
            Enable SSL/TLS
          </Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || (!connectionString && (!host || !database))}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                {testResult === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : testResult === 'error' ? (
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSaveConnection}
            disabled={isTesting || testResult !== 'success'}
          >
            Save Connection
          </Button>
        </div>

        {testResult === 'success' && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Connection successful! Click "Save Connection" to save.
          </p>
        )}

        {testResult === 'error' && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Connection failed. Please check your credentials and try again.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

