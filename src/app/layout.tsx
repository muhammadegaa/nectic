import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Nectic - Product Intelligence from Your Sales Conversations",
  description:
    "Nectic reads your WhatsApp sales conversations and delivers weekly product intelligence to your PM team. No filters. No drama.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/logo-nectic-icon.png", type: "image/png" },
    ],
    apple: "/logo-nectic-icon.png",
    shortcut: "/logo-nectic-icon.png",
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
