"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Droplet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PricingCard } from "@/components/pricing-card"
import { useLanguage } from "@/lib/language-context"

// Import the bypass auth hook
import { useBypassAuth } from "@/lib/bypass-auth"

export default function LandingPage() {
  const { t, isLoading } = useLanguage()

  // Inside the LandingPage component, add the bypass auth hook
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-amber-50/30">
      <header
        className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
                <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
              </div>
              <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
                Nectic
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 transition-colors">
                <Link href="#how-it-works">{isLoading ? "How It Works" : t("nav_how_it_works")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 transition-colors">
                <Link href="#pricing">{isLoading ? "Pricing" : t("nav_pricing")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="#faq">{isLoading ? "FAQ" : t("nav_faq")}</Link>
              </Button>
              <Button
                size="sm"
                className="hidden md:flex"
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                {isLoading ? "Get Early Access" : t("nav_get_early_access")}
              </Button>
            </nav>
          </div>
        </div>

        {/* Secret code input display */}
        {doubleClicked && (
          <div className="absolute top-16 right-4 bg-white p-2 rounded shadow-md border text-xs">
            <span>Code: {secretCode}</span>
          </div>
        )}
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary px-3 py-1 animate-fade-in">
                  <Clock className="mr-1 h-3 w-3" /> {isLoading ? "Launching Soon" : t("hero_badge")}
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-700 animate-slide-up">
                  {isLoading ? "Find Your Next AI Advantage" : t("hero_title")}
                </h1>
                <p className="text-gray-500 md:text-xl max-w-[700px] mx-auto animate-slide-up [animation-delay:200ms]">
                  {isLoading
                    ? "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise."
                    : t("hero_subtitle")}
                </p>
              </div>

              {/* Features and CTA */}
              <div className="space-y-6 w-full max-w-md animate-slide-up [animation-delay:400ms]">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{isLoading ? "Spot inefficiencies in your workflows" : t("hero_feature_1")}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{isLoading ? "Find practical AI solutions" : t("hero_feature_2")}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{isLoading ? "Get clear implementation roadmaps" : t("hero_feature_3")}</div>
                  </div>
                </div>

                {/* Single CTA button */}
                <Button
                  className="w-full h-12 group relative overflow-hidden animate-pulse-subtle"
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <span className="relative z-10">{isLoading ? "Get Early Access" : t("hero_cta")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "How It Works" : t("how_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading ? "A simple process to help you find and implement AI solutions." : t("how_subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-2">{isLoading ? "Connect" : t("how_step_1_title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading ? "Link your business systems with secure, read-only access." : t("how_step_1_desc")}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-2">{isLoading ? "Discover" : t("how_step_3_title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "Get a personalized dashboard of AI opportunities ranked by impact."
                      : t("how_step_3_desc")}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-2">{isLoading ? "Implement" : t("how_step_4_title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "Follow clear implementation guides with vendor recommendations."
                      : t("how_step_4_desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-amber-50/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <Badge variant="outline" className="mb-2 bg-white">
                  {isLoading ? "Limited Time Offer" : t("pricing_badge")}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "Early Access Pricing" : t("pricing_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading
                    ? "Secure your spot now. Your card won't be charged until we launch."
                    : t("pricing_subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
              <PricingCard
                title="Standard Plan"
                description="For businesses starting their AI journey"
                priceUSD={249}
                earlyAdopterPriceUSD={199}
                features={[
                  "AI opportunity assessment",
                  "Top 3 implementation guides",
                  "Basic vendor comparisons",
                  "30-day implementation support",
                ]}
                plan="standard"
                popular={false}
              />

              <PricingCard
                title="Premium Plan"
                description="For businesses serious about AI transformation"
                priceUSD={499}
                earlyAdopterPriceUSD={399}
                features={[
                  "<strong>Complete</strong> AI opportunity assessment",
                  "<strong>Unlimited</strong> implementation guides",
                  "Advanced vendor comparisons with ROI calculators",
                  "<strong>90-day</strong> implementation support",
                ]}
                plan="premium"
                popular={true}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "Common Questions" : t("faq_title")}
                </h2>
              </div>
            </div>
            <div className="mx-auto max-w-3xl py-12">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "When will my card be charged?" : t("faq_q1")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Your card won't be charged until Nectic launches. We'll notify you 7 days before any charges occur, giving you time to cancel if you wish."
                      : t("faq_a1")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "How does Nectic identify AI opportunities?" : t("faq_q2")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Nectic connects to your business systems through secure, read-only integrations. We analyze your workflows and processes to find areas where AI can improve efficiency or outcomes."
                      : t("faq_a2")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "Is my business data secure?" : t("faq_q3")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Yes. All connections to your systems are secure and read-only. We use industry-standard encryption for all data in transit and at rest."
                      : t("faq_a3")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "What if I don't have technical expertise?" : t("faq_q4")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Nectic is designed for businesses without technical AI expertise. Our platform handles the analysis, and our implementation guides use plain language with step-by-step instructions."
                      : t("faq_a4")}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-8 md:py-12 bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              {isLoading ? "© 2025 Nectic. All rights reserved." : t("footer_rights")}
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="mailto:helloegglabs@gmail.com?subject=Nectic%20Inquiry&body=I'm%20interested%20in%20learning%20more%20about%20Nectic."
              className="text-sm text-gray-500 underline-offset-4 hover:underline hover:text-primary transition-colors"
            >
              {isLoading ? "Contact" : t("footer_contact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
