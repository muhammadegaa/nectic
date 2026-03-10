import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { PostHogProvider } from "@/components/posthog-provider"

export const metadata: Metadata = {
  title: "Nectic - Product Intelligence from Your Sales Conversations",
  description:
    "Nectic reads your WhatsApp sales conversations and delivers weekly product intelligence to your PM team. No filters. No drama.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/logo-nectic-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-nectic-icon.svg",
    shortcut: "/logo-nectic-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <ErrorBoundary>
          <AuthProvider>
            <Suspense fallback={null}>
              <PostHogProvider>
                {children}
                <Toaster />
                <SonnerToaster position="bottom-center" richColors />
              </PostHogProvider>
            </Suspense>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
