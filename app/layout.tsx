import type React from "react"
import "./globals.css"
import "./responsive.css"
import { Inter } from "next/font/google"
import { LanguageProvider } from "@/lib/language-context"
import { CurrencyProvider } from "@/lib/currency-context"
import { AuthProvider } from "@/contexts/auth-context"
import { FeatureFlagProvider } from "@/contexts/feature-flag-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Nectic - AI for Slack",
  description: "Enhance your Slack communication with AI-powered assistance",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <FeatureFlagProvider>{children}</FeatureFlagProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
