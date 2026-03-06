"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signInWithEmail } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("")
      return
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters")
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate before submitting
    validateEmail(email)
    validatePassword(password)
    
    if (emailError || passwordError || !email || !password) {
      return
    }

    setLoading(true)

    try {
      await signInWithEmail(email, password)
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 px-4 sm:px-6 pt-6 sm:pt-6">
          <CardTitle className="text-2xl sm:text-3xl font-light text-foreground">Welcome back</CardTitle>
          <CardDescription className="text-sm sm:text-base">Sign in to your Nectic account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6 pb-6 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateEmail(e.target.value)
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                required
                disabled={loading}
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-foreground/60 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                required
                disabled={loading}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-foreground/60">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-foreground hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
