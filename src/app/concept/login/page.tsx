"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { isOnboardingComplete } from "@/lib/concept-firestore"

async function getPostLoginRoute(uid: string): Promise<string> {
  const done = await isOnboardingComplete(uid)
  return done ? "/concept" : "/concept/onboarding"
}

export default function ConceptLoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && user) {
      getPostLoginRoute(user.uid).then((route) => router.replace(route))
    }
  }, [user, loading, router])

  const handleGoogle = async () => {
    setSigningIn(true)
    setError("")
    try {
      await signInWithGoogle()
      // Browser navigates away to Google — no code runs after this
    } catch {
      setError("Sign-in failed. Please try again.")
      setSigningIn(false)
    }
  }

  if (loading || user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Link href="/">
            <LogoIcon size={28} />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Early access</p>
            <h1 className="text-xl font-semibold text-neutral-900">Sign in to Nectic</h1>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Analyze your WhatsApp account conversations and surface what your customers are really telling you.
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold px-4 py-3 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {signingIn ? "Signing in…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-3 text-xs text-red-600 text-center">{error}</p>
          )}

          <p className="mt-6 text-xs text-neutral-400 text-center leading-relaxed">
            Files you upload are analyzed in-memory and never stored on our servers.
            Only your account intelligence results are saved.
          </p>
        </div>

        <p className="mt-6 text-xs text-neutral-400 text-center">
          <Link href="/" className="hover:text-neutral-700 transition-colors">← Back to nectic.vercel.app</Link>
        </p>
      </div>
    </div>
  )
}
