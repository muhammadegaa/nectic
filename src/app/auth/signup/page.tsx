"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/lib/password-utils"
import { trackEvent } from "@/lib/posthog"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUpWithEmail } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const passwordStrength = useMemo(() => {
    if (!password) return null
    return calculatePasswordStrength(password)
  }, [password])

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

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError("")
      return
    }
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    validateEmail(email)
    validatePassword(password)
    validateConfirmPassword(confirmPassword)

    if (emailError || passwordError || confirmPasswordError || !email || !password || !confirmPassword) {
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await signUpWithEmail(email, password)
      trackEvent("signup_completed", { method: "email" })
      toast({
        title: "Account created!",
        description: "Welcome to Nectic. Your account has been created successfully.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Sign up failed",
        description: err.message || "Failed to create account. Please try again.",
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
          <CardTitle className="text-2xl sm:text-3xl font-light text-foreground">Create account</CardTitle>
          <CardDescription className="text-sm sm:text-base">Get started with Nectic</CardDescription>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                  // Re-validate confirm password if it has a value
                  if (confirmPassword) {
                    validateConfirmPassword(confirmPassword)
                  }
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
              {password && passwordStrength && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={`font-medium ${
                      passwordStrength.strength === 'weak' ? 'text-red-500' :
                      passwordStrength.strength === 'fair' ? 'text-orange-500' :
                      passwordStrength.strength === 'good' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {getPasswordStrengthLabel(passwordStrength.strength)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.strength)}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && passwordStrength.strength !== 'strong' && (
                    <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      {passwordStrength.feedback.map((tip, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-destructive">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  validateConfirmPassword(e.target.value)
                }}
                onBlur={(e) => validateConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className={confirmPasswordError ? "border-destructive" : ""}
              />
              {confirmPasswordError && (
                <p className="text-xs text-destructive">{confirmPasswordError}</p>
              )}
              {confirmPassword && !confirmPasswordError && password === confirmPassword && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span>✓</span>
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-foreground/60">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
