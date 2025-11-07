import React from "react"
import "../styles/globals.css"
import "../styles/responsive.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/lib/currency-context"
import { LanguageProvider } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AnalyticsProvider } from "@/components/providers/analytics-provider"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { AuthProvider } from "@/contexts/auth-context"
import { FeatureFlagProvider } from "@/contexts/feature-flag-context"
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "Nectic - Find Your Next AI Advantage",
  description:
    "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://js.stripe.com/v3/" async></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AnalyticsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <FeatureFlagProvider>
                <CurrencyProvider>
                  <LanguageProvider>
                    <DemoModeBanner />
                    {children}
                    <div className="fixed bottom-4 right-4 flex items-center gap-2">
                      <ThemeToggle />
                      <LanguageSwitcher />
                    </div>
                  </LanguageProvider>
                </CurrencyProvider>
              </FeatureFlagProvider>
            </AuthProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}