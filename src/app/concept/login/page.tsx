"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LogoIcon from "@/components/logo-icon"
import { useAuth } from "@/contexts/auth-context"
import { isOnboardingComplete } from "@/lib/concept-firestore"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

async function getPostLoginRoute(uid: string): Promise<string> {
  const done = await isOnboardingComplete(uid)
  return done ? "/concept" : "/concept/onboarding"
}

export default function ConceptLoginPage() {
  const { user, loading, signInWithGoogleIdToken } = useAuth()
  const router = useRouter()
  const [error, setError] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Redirect once authenticated
  useEffect(() => {
    if (!loading && user) {
      getPostLoginRoute(user.uid).then((route) => router.replace(route))
    }
  }, [user, loading, router])

  // Load Google Identity Services and render button
  useEffect(() => {
    let script: HTMLScriptElement | null = null

    async function initGSI() {
      // Fetch Google OAuth client ID from our API (sourced from Firebase project config)
      let clientId: string | null = null
      try {
        const res = await fetch("/api/auth/google-config")
        const data = await res.json()
        clientId = data.clientId
      } catch {
        setError("Failed to load sign-in. Please refresh.")
        return
      }

      if (!clientId) {
        setError("Google Sign-In not configured. Contact support.")
        return
      }

      script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => {
        if (!window.google || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            setSigningIn(true)
            setError("")
            try {
              await signInWithGoogleIdToken(response.credential)
              // onAuthStateChanged fires → useEffect above handles redirect
            } catch (err: unknown) {
              const code = (err as { code?: string })?.code ?? "unknown"
              setError(`Sign-in failed: ${code}`)
              setSigningIn(false)
            }
          },
          ux_mode: "popup",
          context: "signin",
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: buttonRef.current.offsetWidth || 320,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        })
      }
      document.body.appendChild(script)
    }

    if (!loading && !user) {
      initGSI()
    }

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [loading, user, signInWithGoogleIdToken])

  if (loading || (user && !error)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Link href="/">
            <LogoIcon size={28} />
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Early access</p>
            <h1 className="text-xl font-semibold text-neutral-900">Sign in to Nectic</h1>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Analyze your WhatsApp account conversations and surface what your customers are really telling you.
            </p>
          </div>

          {signingIn ? (
            <div className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-lg py-3 text-sm text-neutral-500">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
              Signing in…
            </div>
          ) : (
            <div ref={buttonRef} className="w-full" />
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 text-center font-mono">{error}</p>
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
