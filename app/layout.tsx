import type React from "react"
import "./globals.css"
import "./responsive.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/lib/currency-context"
import { LanguageProvider } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AuthProvider } from "@/contexts/auth-context"
import { FeatureFlagProvider } from "@/contexts/feature-flag-context"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Nectic - Find Your Next AI Advantage",
  description:
    "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-white">
      <head>
        <script src="https://js.stripe.com/v3/" async></script>
      </head>
      <body className={`${inter.className} bg-white`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <FeatureFlagProvider>
              <CurrencyProvider>
                <LanguageProvider>
                  {children}
                  <LanguageSwitcher />
                </LanguageProvider>
              </CurrencyProvider>
            </FeatureFlagProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
