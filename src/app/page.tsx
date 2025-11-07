"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Droplet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PricingCard } from "@/components/pricing-card"
import { CustomerLogo } from "@/components/customer-logo"
import { useLanguage } from "@/lib/language-context"
import { useBypassAuth } from "@/lib/bypass-auth"

const HERO_FALLBACK = {
  badge: "Enterprise AI for operators",
  title: "Ship AI wins your COO will sign off on",
  subtitle:
    "Designed for operations, finance, and transformation leaders who need executive-ready AI opportunities in weeks, not quarters.",
  features: [
    "Run the readiness diagnostic built for regulated teams",
    "Get quantified opportunities with ROI and control coverage",
    "Follow 90-day pilot playbooks with vendor shortlists",
  ],
  cta: "See your launch plan",
  trustedBy: "Trusted by transformation teams modernizing operations",
}

const PERSONA_FALLBACK = {
  badge: "Built for your operating rhythm",
  title: "Who we move fastest for",
  subtitle:
    "Nectic is proven with mid-market companies (50–500 FTE) modernizing compliance-heavy workflows. We map data lineage, quantify ROI, and give your exec team the confidence to scale pilots.",
  decisionTitle: "Decision criteria",
  decisions: [
    "• You run mission-critical processes across finance, customer operations, or risk.",
    "• You need compliant, auditable AI playbooks for leadership and regulators.",
    "• You measure success in reduced cycle time, lower cost-to-serve, and accuracy.",
  ],
  tiles: [
    {
      title: "Operations & Transformation",
      description:
        "Automate onboarding, claims, or underwriting without disrupting systems already in flight.",
    },
    {
      title: "Finance & Shared Services",
      description:
        "Compress month-end close, invoice processing, and vendor onboarding while preserving controls.",
    },
    {
      title: "Customer Experience & Support",
      description:
        "Resolve tickets faster with AI agents that follow your playbooks and escalation paths.",
    },
  ],
}

const PRICING_STANDARD_FEATURES = [
  "Readiness diagnostic & executive briefing",
  "Top 3 automation playbooks with ROI modeling",
  "Baseline vendor shortlists with risk coverage",
  "30-day pilot guidance & office hours",
]

const PRICING_PREMIUM_FEATURES = [
  "Full diagnostic across every process area",
  "Unlimited automation playbooks & ROI scenarios",
  "Advanced vendor evaluations with compliance reporting",
  "90-day pilot co-pilot and stakeholder comms",
]

export default function LandingPage() {
  const { t, isLoading } = useLanguage()
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()

  const heroBadge = isLoading ? HERO_FALLBACK.badge : t("hero_badge")
  const heroTitle = isLoading ? HERO_FALLBACK.title : t("hero_title")
  const heroSubtitle = isLoading ? HERO_FALLBACK.subtitle : t("hero_subtitle")
  const heroFeatures = HERO_FALLBACK.features.map((fallback, index) =>
    isLoading ? fallback : t(`hero_feature_${index + 1}`)
  )
  const heroCTA = isLoading ? HERO_FALLBACK.cta : t("hero_cta")
  const heroTrustedBy = isLoading ? HERO_FALLBACK.trustedBy : t("hero_trusted_by")

  const personaBadge = isLoading ? PERSONA_FALLBACK.badge : t("persona_badge")
  const personaTitle = isLoading ? PERSONA_FALLBACK.title : t("persona_title")
  const personaSubtitle = isLoading ? PERSONA_FALLBACK.subtitle : t("persona_subtitle")
  const personaDecisionTitle = isLoading ? PERSONA_FALLBACK.decisionTitle : t("persona_decision_title")
  const personaDecisions = PERSONA_FALLBACK.decisions.map((fallback, index) =>
    isLoading ? fallback : t(`persona_decision_item_${index + 1}`)
  )
  const personaTiles = PERSONA_FALLBACK.tiles.map((fallback, index) => ({
    title: isLoading ? fallback.title : t(`persona_tile_${index + 1}_title`),
    description: isLoading ? fallback.description : t(`persona_tile_${index + 1}_desc`),
  }))

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

        {doubleClicked && (
          <div className="absolute top-16 right-4 bg-white p-2 rounded shadow-md border text-xs">
            <span>Code: {secretCode}</span>
          </div>
        )}
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary px-3 py-1 animate-fade-in">
                  <Clock className="mr-1 h-3 w-3" /> {heroBadge}
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-700 animate-slide-up">
                  {heroTitle}
                </h1>
                <p className="text-gray-500 md:text-xl max-w-[700px] mx-auto animate-slide-up [animation-delay:200ms]">
                  {heroSubtitle}
                </p>
              </div>

              <div className="space-y-6 w-full max-w-md animate-slide-up [animation-delay:400ms]">
                <div className="grid gap-4">
                  {heroFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 text-sm">
                      <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>{feature}</div>
                    </div>
                  ))}
                </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 group relative overflow-hidden animate-pulse-subtle"
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <span className="relative z-10">{heroCTA}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full h-12 border-2">
                    Start Free Trial — No Credit Card Required
                  </Button>
                </Link>
              </div>
              </div>
              <div className="mt-10 w-full">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 text-center mb-4">{heroTrustedBy}</p>
                <div className="flex flex-wrap items-center justify-center gap-6 opacity-80">
                  <CustomerLogo name="Northwind Capital" logoUrl="/placeholder-logo.svg" />
                  <CustomerLogo name="Apex Health" logoUrl="/placeholder-logo.svg" />
                  <CustomerLogo name="Summit Insurance" logoUrl="/placeholder-logo.svg" />
                  <CustomerLogo name="Lumen Logistics" logoUrl="/placeholder-logo.svg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="space-y-4">
                <Badge className="bg-black text-white uppercase tracking-wide">{personaBadge}</Badge>
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{personaTitle}</h2>
                <p className="text-slate-500 text-base sm:text-lg max-w-2xl">{personaSubtitle}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{personaDecisionTitle}</p>
                <ul className="space-y-3 text-sm text-slate-600">
                  {personaDecisions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {personaTiles.map((tile, index) => (
                <div
                  key={tile.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                    0{index + 1}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{tile.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{tile.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-amber-50/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <Badge variant="outline" className="mb-2 bg-white">
                  {isLoading ? "14-Day Free Trial" : t("pricing_badge")}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "Plans for readiness and pilot execution" : t("pricing_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading
                    ? "Start free. No credit card required. Upgrade anytime during your trial."
                    : t("pricing_subtitle")}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">14-day free trial • Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
              <PricingCard
                title="Standard Plan"
                description="For businesses starting their AI journey"
                priceUSD={249}
                earlyAdopterPriceUSD={199}
                features={PRICING_STANDARD_FEATURES.map((fallback, index) =>
                  isLoading ? fallback : t(`pricing_standard_feature_${index + 1}`)
                )}
                plan="standard"
                popular={false}
              />

              <PricingCard
                title="Premium Plan"
                description="For businesses serious about AI transformation"
                priceUSD={499}
                earlyAdopterPriceUSD={399}
                features={PRICING_PREMIUM_FEATURES.map((fallback, index) =>
                  isLoading ? fallback : t(`pricing_premium_feature_${index + 1}`)
                )}
                plan="premium"
                popular={true}
              />
            </div>
          </div>
        </section>

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
                    {isLoading ? "How do you run the diagnostic?" : t("faq_q1")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Our readiness diagnostic maps your processes, controls, and data fidelity to an enterprise AI scorecard so we only recommend projects you can execute."
                      : t("faq_a1")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "How does Nectic identify AI opportunities?" : t("faq_q2")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "We combine your diagnostic results with a vetted library of automation patterns to surface quantified opportunities with ROI, control coverage, and implementation guidance."
                      : t("faq_a2")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "Is my business data secure?" : t("faq_q3")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Yes. All connections are optional, read-only, and encrypted. We also map every recommendation to the controls you already audit."
                      : t("faq_a3")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {isLoading ? "What if I don't have technical expertise?" : t("faq_q4")}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isLoading
                      ? "Nectic is built for operators. We provide 90-day pilot playbooks, vendor shortlists, and mitigation guidance in plain language."
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
