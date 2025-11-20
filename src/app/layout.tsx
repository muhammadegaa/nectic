import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Nectic - Secure Internal AI Assistants",
  description:
    "Build secure internal AI assistants that connect to your private databases. Enterprise-grade security with zero data leakage.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/logo-icon.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-icon.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
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
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
