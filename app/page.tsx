"use client"

import { useLanguage } from "@/lib/language-context"
import { useBypassAuth } from "@/lib/bypass-auth"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PricingCard } from "@/components/pricing-card"
import { ArrowRight, CheckCircle2, Clock, Droplet } from "lucide-react"
import Link from "next/link"

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
                className="hidden md:flex bg-primary hover:bg-primary/90"
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
                  <Clock className="mr-1 h-3 w-3" /> {isLoading ? "Limited Spots Available" : t("hero_badge")}
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-700 animate-slide-up">
                  {isLoading ? "Unlock AI's ROI Without The Tech Headache" : t("hero_title")}
                </h1>
                <p className="text-gray-500 md:text-xl max-w-[700px] mx-auto animate-slide-up [animation-delay:200ms]">
                  {isLoading
                    ? "Nectic identifies your highest-impact AI opportunities and provides automated implementation roadmaps, saving you thousands in consulting fees."
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
                    <div>{isLoading ? "Save 15+ hours of research per AI solution" : t("hero_feature_1")}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{isLoading ? "Avoid $10K+ in wasted implementation costs" : t("hero_feature_2")}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{isLoading ? "Get results in weeks, not months" : t("hero_feature_3")}</div>
                  </div>
                </div>

                {/* CTA with countdown */}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 group relative overflow-hidden"
                    onClick={() => {
                      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <span className="relative z-10">{isLoading ? "Secure Your Early Access Spot" : t("hero_cta")}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Button>
                  <p className="text-xs text-amber-600 font-medium animate-pulse">Only few spots available</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Why Business Leaders Choose Nectic
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                Stop wasting time and money on AI initiatives that don't deliver
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">ROI-Focused Approach</h3>
                <p className="text-gray-500">
                  We identify AI opportunities with the highest ROI potential for your specific business context.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <path d="M12 18V6"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Cost-Effective</h3>
                <p className="text-gray-500">
                  Save thousands on consultants and avoid costly implementation mistakes with our automated guidance.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">No Technical Expertise Needed</h3>
                <p className="text-gray-500">
                  Our platform translates complex AI concepts into plain language anyone can understand and implement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 relative bg-gradient-to-b from-amber-50/30 to-white"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "How Nectic Works" : t("how_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading
                    ? "A simple, automated process to find and implement the right AI solutions for your business."
                    : t("how_subtitle")}
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
                  <h3 className="text-xl font-bold mb-2">{isLoading ? "Connect & Scan" : t("how_step_1_title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "Our AI scans your business systems to identify inefficiencies and opportunities."
                      : t("how_step_1_desc")}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {isLoading ? "Prioritize Opportunities" : t("how_step_3_title")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "Get a personalized dashboard of AI opportunities ranked by ROI and implementation ease."
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
                  <h3 className="text-xl font-bold mb-2">
                    {isLoading ? "Automated Implementation" : t("how_step_4_title")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "Follow our step-by-step implementation guides with vendor comparisons and ROI calculators."
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
                  <span className="text-primary animate-pulse">🔥 Early Adopter Pricing</span>
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "Early Access Pricing" : t("pricing_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading
                    ? "Join our early adopters and be the first to experience Nectic as we develop."
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
                  "AI solution vendor recommendations",
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
                  "<strong>Priority</strong> access to new features",
                ]}
                plan="premium"
                popular={true}
              />
            </div>

            {/* Money-back guarantee */}
            <div className="text-center mt-6">
              <p className="inline-flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-primary"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                </svg>
                30-day money-back guarantee
              </p>
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
                  <AccordionTrigger className="text-lg font-medium">When will my card be charged?</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Your card will be charged immediately upon completing your purchase. You'll receive an email receipt
                    confirming your payment and subscription details.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    What exactly am I getting as an early adopter?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    As an early adopter, you're getting priority access to Nectic as we develop and refine our platform.
                    You'll receive access to our initial assessment tools, implementation guides, and vendor
                    recommendations. You'll also have the opportunity to provide feedback that will directly shape the
                    development of Nectic, and you'll lock in our lowest pricing for the lifetime of your subscription.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">Is my business data secure?</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Yes. All connections to your systems are secure and read-only. We use industry-standard encryption
                    for all data in transit and at rest, and we follow best practices for data security and privacy.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    What if I don't have technical expertise?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Nectic is designed for businesses without technical AI expertise. Our platform handles the analysis,
                    and our implementation guides use plain language with step-by-step instructions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    How does the 30-day money-back guarantee work?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    We stand behind our platform. If you're not satisfied with Nectic for any reason within the first 30
                    days, simply contact our support team at support@nectic.com, and we'll process a full refund of your
                    purchase. No questions asked.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    What is the current development status?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Nectic is currently in early development. As an early adopter, you'll have access to our core
                    features as they're developed and released. We're actively working on enhancing our AI assessment
                    tools, expanding our implementation guides, and refining our vendor recommendation engine. Your
                    feedback during this phase will be invaluable in shaping the platform.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">What happens after I subscribe?</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    After subscribing, you'll receive a welcome email with instructions on how to access your Nectic
                    account. You'll be among the first to experience new features as they're released, and you'll have
                    direct channels to provide feedback to our development team. We'll keep you updated on our progress
                    and new feature releases through regular email updates.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to Transform Your Business with AI?
              </h2>
              <p className="text-xl text-gray-600">
                Join our early adopter program today and help shape the future of AI implementation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Become an Early Adopter
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Learn More
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Limited spots available. Early adopters get lifetime discounted pricing.
              </p>
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
