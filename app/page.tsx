"use client"

import { useLanguage } from "@/lib/language-context"
import { useBypassAuth } from "@/lib/bypass-auth"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PricingCard } from "@/components/pricing-card"
import { ArrowRight, CheckCircle2, Clock, Droplet } from "lucide-react"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function LandingPage() {
  const { language, t, isLoading } = useLanguage()
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-amber-50/30">
      <LanguageSwitcher />
      <header
        className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
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
                <Link href="#how-it-works">{language === "id" ? "Cara Kerja" : "How It Works"}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 transition-colors">
                <Link href="#pricing">{language === "id" ? "Harga" : "Pricing"}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="#faq">FAQ</Link>
              </Button>
              <Button
                size="sm"
                className="hidden md:flex bg-primary hover:bg-primary/90"
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                {language === "id" ? "Dapatkan Early Access" : "Get Early Access"}
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
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary px-3 py-1 animate-fade-in">
                  <Clock className="mr-1 h-3 w-3" /> {language === "id" ? "Segera" : "Launching Soon"}
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-700 animate-slide-up">
                  {language === "id" ? "Temukan Keunggulan AI Anda" : "Find Your Next AI Advantage"}
                </h1>
                <p className="text-gray-500 md:text-xl max-w-[700px] mx-auto animate-slide-up [animation-delay:200ms]">
                  {language === "id"
                    ? "Nectic membantu bisnis menengah mengidentifikasi peluang AI praktis dan mengimplementasikannya tanpa keahlian teknis."
                    : "Nectic helps mid-market businesses identify practical AI opportunities and implement them without technical expertise."}
                </p>
              </div>

              {/* Features and CTA */}
              <div className="space-y-6 w-full max-w-md animate-slide-up [animation-delay:400ms]">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {language === "id"
                        ? "Temukan inefisiensi dalam alur kerja Anda"
                        : "Spot inefficiencies in your workflows"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>{language === "id" ? "Temukan solusi AI praktis" : "Find practical AI solutions"}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {language === "id"
                        ? "Dapatkan roadmap implementasi yang jelas"
                        : "Get clear implementation roadmaps"}
                    </div>
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
                    <span className="relative z-10">
                      {language === "id" ? "Amankan Early Access" : "Secure Early Access"}
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Button>
                  <p className="text-xs text-amber-600 font-medium animate-pulse">
                    {language === "id" ? "Hanya tersedia beberapa slot" : "Only few spots available"}
                  </p>
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
                {t("value_title", "Make AI Work For Your Business")}
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                {t(
                  "value_subtitle",
                  "Many businesses struggle with AI adoption. Nectic helps you find practical applications and guides you through implementation.",
                )}
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
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{t("value_card_1_title", "Identify Opportunities")}</h3>
                <p className="text-gray-500">
                  {t("value_card_1_desc", "Find where AI can have the most impact in your specific business context.")}
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
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13 15v4"></path>
                    <path d="M11 15v4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{t("value_card_2_title", "Navigate Implementation")}</h3>
                <p className="text-gray-500">
                  {t("value_card_2_desc", "Get practical guides and vendor comparisons tailored to your needs.")}
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
                    <path d="M12 20v-6"></path>
                    <path d="M6 20V10"></path>
                    <path d="M18 20V4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{t("value_card_3_title", "Measure Results")}</h3>
                <p className="text-gray-500">
                  {t(
                    "value_card_3_desc",
                    "Track time and cost savings with our ROI calculator for each AI initiative.",
                  )}
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
                  {isLoading ? "How It Works" : t("how_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading ? "A simple process to help you find and implement AI solutions." : t("how_subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
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
                  <h3 className="text-xl font-bold mb-2">{isLoading ? "Analyze" : t("how_step_2_title")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {isLoading
                      ? "We identify inefficiencies and AI opportunities in your workflows."
                      : t("how_step_2_desc")}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    3
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
                    4
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
                  <span className="text-primary animate-pulse">
                    {isLoading ? "Limited Time Offer" : t("pricing_badge")}
                  </span>
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  {isLoading ? "Early Access Pricing" : t("pricing_title")}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {isLoading
                    ? "Secure your spot now. Your card will be charged immediately upon subscription."
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
                {isLoading ? "30-day money-back guarantee" : t("pricing_guarantee")}
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
                  {language === "id" ? "Pertanyaan Umum" : "Common Questions"}
                </h2>
              </div>
            </div>
            <div className="mx-auto max-w-3xl py-12">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id" ? "Kapan saya akan ditagih?" : "When will my card be charged?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Kartu Anda akan ditagih segera setelah berlangganan. Kami menawarkan jaminan uang kembali 30 hari jika Anda tidak puas dengan layanan kami."
                      : "Your card will be charged immediately upon subscription. We offer a 30-day money-back guarantee if you're not satisfied with our service."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id"
                      ? "Bagaimana Nectic mengidentifikasi peluang AI?"
                      : "How does Nectic identify AI opportunities?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Nectic terhubung ke sistem bisnis Anda melalui integrasi hanya-baca yang aman. Kami menganalisis alur kerja dan proses Anda untuk menemukan area di mana AI dapat meningkatkan efisiensi atau hasil."
                      : "Nectic connects to your business systems through secure, read-only integrations. We analyze your workflows and processes to find areas where AI can improve efficiency or outcomes."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id" ? "Apakah data bisnis saya aman?" : "Is my business data secure?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Ya. Semua koneksi ke sistem Anda aman dan hanya-baca. Kami menggunakan enkripsi standar industri untuk semua data dalam perjalanan dan saat istirahat."
                      : "Yes. All connections to your systems are secure and read-only. We use industry-standard encryption for all data in transit and at rest."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id"
                      ? "Bagaimana jika saya tidak memiliki keahlian teknis?"
                      : "What if I don't have technical expertise?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Nectic dirancang untuk bisnis tanpa keahlian teknis AI. Platform kami menangani analisis, dan panduan implementasi kami menggunakan bahasa yang sederhana dengan instruksi langkah demi langkah."
                      : "Nectic is designed for businesses without technical AI expertise. Our platform handles the analysis, and our implementation guides use plain language with step-by-step instructions."}
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
                {language === "id"
                  ? "Siap Mentransformasi Bisnis Anda dengan AI?"
                  : "Ready to Transform Your Business with AI?"}
              </h2>
              <p className="text-xl text-gray-600">
                {language === "id"
                  ? "Bergabunglah dengan program early adopter kami hari ini dan bantu membentuk masa depan implementasi AI."
                  : "Join our early adopter program today and help shape the future of AI implementation."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  {language === "id" ? "Amankan Early Access" : "Secure Early Access"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  {language === "id" ? "Pelajari Lebih Lanjut" : "Learn More"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {language === "id"
                  ? "Slot terbatas. Early adopter mendapatkan harga diskon seumur hidup."
                  : "Limited spots available. Early adopters get lifetime discounted pricing."}
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
              {language === "id"
                ? "© 2025 Nectic. Hak cipta dilindungi undang-undang."
                : "© 2025 Nectic. All rights reserved."}
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="mailto:helloegglabs@gmail.com?subject=Nectic%20Inquiry&body=I'm%20interested%20in%20learning%20more%20about%20Nectic."
              className="text-sm text-gray-500 underline-offset-4 hover:underline hover:text-primary transition-colors"
            >
              {language === "id" ? "Kontak" : "Contact"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
