"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'
import Link from "next/link"
import { Droplet, ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { getAssessmentResults } from "@/lib/assessment-service"
import { useBypassAuth } from "@/lib/bypass-auth"

export default function LoginPage() {
  const router = useRouter()
  const { user, signIn, signInWithGoogleProvider, bypassAuth, enableBypass, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBypassButton, setShowBypassButton] = useState(false)
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()

  // Use react-hook-form directly without zodResolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    console.log("Login page auth state:", { user, bypassAuth, loading })

    if (user && !loading) {
      // Check if user has completed assessment
      getAssessmentResults(user.uid)
        .then((assessment) => {
          if (assessment) {
            console.log("User has completed assessment, redirecting to /dashboard")
            router.push("/dashboard")
          } else {
            console.log("User needs to complete assessment, redirecting to /dashboard/assessment")
            router.push("/dashboard/assessment")
          }
        })
        .catch((error) => {
          console.error("Error checking assessment status:", error)
          // Default to dashboard - it will show assessment prompt if needed
          router.push("/dashboard")
        })
    }
  }, [user, bypassAuth, loading, router])

  // Listen for the secret code "nectic"
  useEffect(() => {
    let typedKeys = ""
    const keyHandler = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === "development") {
        typedKeys += e.key.toLowerCase()
        if (typedKeys.length > 6) {
          typedKeys = typedKeys.slice(-6)
        }
        if (typedKeys === "nectic") {
          setShowBypassButton(true)
        }
      }
    }
    window.addEventListener("keydown", keyHandler)
    return () => window.removeEventListener("keydown", keyHandler)
  }, [])

  // Handle form submission
  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    setError("")

    try {
      // Try to sign in
      if (signIn) {
        await signIn(data.email, data.password)
        // Router push is handled by the useEffect above
      } else {
        throw new Error("Authentication service is not available")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      await signInWithGoogleProvider()
      // Router push is handled by the useEffect above
    } catch (err: any) {
      console.error("Google login error:", err)
      setError(err.message || "Failed to login with Google. Please try again.")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Handle bypass button click
  const handleBypassClick = () => {
    console.log("Bypass button clicked")
    enableBypass()
    // Redirect is handled by the useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
              <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
              Nectic
            </span>
          </Link>
        </div>
      </header>

      <div className="container max-w-md mx-auto py-12 px-4 flex-1">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>Enter your email and password to access your Nectic dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || loading}
              >
                {isGoogleLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path
                          fill="#4285F4"
                          d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                        />
                        <path
                          fill="#34A853"
                          d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                        />
                      </g>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    {...register("password", { required: "Password is required" })}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                {error && (
                  <div className="text-sm text-red-500 text-center">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {/* Developer bypass mode button - only shown in development after typing "nectic" */}
              {process.env.NODE_ENV === "development" && showBypassButton && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={handleBypassClick}
                    disabled={loading}
                  >
                    Developer: Enter Bypass Mode
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
