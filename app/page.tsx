"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useBypassAuth } from "@/lib/bypass-auth"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PricingCard } from "@/components/pricing-card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle2, Clock, Droplet } from "lucide-react"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function LandingPage() {
  const { language, t, isLoading } = useLanguage()
  const { doubleClicked, secretCode, handleDoubleClick, handleKeyDown } = useBypassAuth()
  const [annualBilling, setAnnualBilling] = useState(false)

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
                  {language === "id" ? "Berhenti Menulis Ulang Pesan yang Sama" : "Stop Rewriting the Same Messages."}
                </h1>
                <p className="text-gray-500 md:text-xl max-w-[700px] mx-auto animate-slide-up [animation-delay:200ms]">
                  {language === "id"
                    ? "Nectic membantu tim Anda menghemat waktu dengan mengubah pesan Slack yang berulang menjadi playbook AI yang cerdas. Tanpa integrasi. Tanpa setup. Hanya kecepatan."
                    : "Nectic helps your team save hours by turning repetitive Slack messages into smart, AI-powered playbooks. No integrations. No setup. Just speed."}
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
                        ? "Menyarankan respons sempurna, disesuaikan dengan nada dan konteks"
                        : "Suggests the perfect response, tailored to tone and context"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {language === "id"
                        ? "Bekerja di dalam Slack dengan satu klik"
                        : "Works inside Slack with one click"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-shrink-0 rounded-full p-1 bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {language === "id" ? "Menghemat 5+ jam/minggu per anggota tim" : "Saves 5+ hours/week per rep"}
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
                      {language === "id" ? "Dapatkan 3 Playbook AI Gratis" : "Get 3 Free AI Playbooks"}
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
                {language === "id" ? "Mengapa Nectic?" : "Why Nectic?"}
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                {language === "id"
                  ? "Tim Anda mengulang dirinya sendiri. Banyak. Baik itu tindak lanjut, jawaban harga, atau bantuan onboarding—sebagian besar pesan di Slack hanyalah versi yang sedikit diedit dari yang terakhir."
                  : "Your team repeats itself. A lot. Whether it's follow-ups, pricing answers, or onboarding help—most messages in Slack are just slightly edited versions of the last."}
              </p>
              <p className="max-w-[700px] text-gray-700 font-medium md:text-xl/relaxed">
                {language === "id" ? "Nectic mengotomatisasi itu." : "Nectic automates that."}
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "id" ? "Respons Sempurna" : "Perfect Responses"}
                </h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Menyarankan respons yang sempurna, disesuaikan dengan nada dan konteks percakapan Anda."
                    : "Suggests the perfect response, tailored to tone and context of your conversation."}
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
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{language === "id" ? "Bekerja di Slack" : "Works in Slack"}</h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Bekerja langsung di dalam Slack dengan satu klik. Tidak perlu beralih antar aplikasi."
                    : "Works directly inside Slack with one click. No need to switch between apps."}
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
                <h3 className="text-xl font-bold mb-2">{language === "id" ? "Hemat Waktu" : "Save Time"}</h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Menghemat 5+ jam/minggu per anggota tim dengan mengotomatisasi pesan yang berulang."
                    : "Saves 5+ hours/week per team member by automating repetitive messaging."}
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
                  {language === "id" ? "Cara Kerjanya" : "How It Works"}
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {language === "id"
                    ? "Proses sederhana untuk menghemat waktu tim Anda dengan playbook AI."
                    : "A simple process to save your team time with AI playbooks."}
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
                  <h3 className="text-xl font-bold mb-2">{language === "id" ? "Hubungkan Slack" : "Connect Slack"}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {language === "id"
                      ? "Kami membaca pesan terbaru (hanya-baca). Tidak perlu CRM atau setup."
                      : "We read recent messages (read-only). No CRM or setup needed."}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-2">{language === "id" ? "Analisis Pola" : "Analyze Patterns"}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {language === "id"
                      ? "Kami menemukan 3 pesan berulang teratas dalam perilaku Slack tim Anda."
                      : "We find the top 3 repetitive messages in your team's Slack behavior."}
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
                    {language === "id" ? "Playbook AI Lahir" : "AI Playbooks Born"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {language === "id"
                      ? "Buat template respons otomatis—sadar konteks, selaras dengan brand, dan cepat."
                      : "Auto-generate response templates—context-aware, brand-aligned, and fast."}
                  </p>
                </div>
              </div>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 opacity-30 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur"></div>
                <div className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    4
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === "id" ? "Gunakan dengan Sekali Klik" : "Use with One Click"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {language === "id"
                      ? "Masukkan balasan ke Slack dalam hitungan detik. Tim Anda langsung menghemat waktu."
                      : "Drop replies into Slack in seconds. Your team saves hours immediately."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {language === "id" ? "Untuk Siapa Ini" : "Who It's For"}
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                {language === "id"
                  ? "Nectic dirancang untuk tim yang menghabiskan banyak waktu di Slack."
                  : "Nectic is designed for teams that spend a lot of time in Slack."}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 px-6 text-left font-bold">{language === "id" ? "Peran" : "Role"}</th>
                    <th className="py-4 px-6 text-left font-bold">
                      {language === "id" ? "Kasus Penggunaan Umum" : "Common Use Case"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{language === "id" ? "Tim Penjualan" : "Sales Teams"}</td>
                    <td className="py-4 px-6">
                      {language === "id"
                        ? "Tindak lanjut demo, outreach dingin, pengingat proposal"
                        : "Demo follow-ups, cold outreach, proposal reminders"}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{language === "id" ? "Tim Dukungan" : "Support Teams"}</td>
                    <td className="py-4 px-6">
                      {language === "id"
                        ? "Balasan onboarding, FAQ, pembaruan status"
                        : "Onboarding replies, FAQs, status updates"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{language === "id" ? "Tim Ops/CS" : "Ops/CS Teams"}</td>
                    <td className="py-4 px-6">
                      {language === "id"
                        ? "Pembaruan internal, dorongan klien, konfirmasi SOP"
                        : "Internal updates, client nudges, SOP confirmations"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* The ROI section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-amber-50/30 to-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {language === "id" ? "ROI" : "The ROI"}
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                {language === "id" ? "Nilai nyata untuk tim Anda." : "Real value for your team."}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="text-4xl font-bold text-primary mb-2">5–10</div>
                <p className="text-gray-700">
                  {language === "id" ? "jam/minggu dihemat per anggota tim" : "hours/week saved per team member"}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="text-4xl font-bold text-primary mb-2">30%</div>
                <p className="text-gray-700">
                  {language === "id"
                    ? "waktu respons lebih cepat untuk alur kerja utama"
                    : "faster response time for key workflows"}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="text-4xl font-bold text-primary mb-2">$29</div>
                <p className="text-gray-700">
                  {language === "id"
                    ? "/bulan/pengguna – membayar dirinya sendiri dalam 1 jam"
                    : "/mo/user – pays for itself in 1 hour"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Safety section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {language === "id" ? "Data Anda Tetap Aman" : "Your Data Stays Safe"}
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed">
                {language === "id" ? "Keamanan adalah prioritas utama kami." : "Security is our top priority."}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "id" ? "Akses Hanya-Baca" : "Read-only Access"}
                </h3>
                <p className="text-gray-500">
                  {language === "id" ? "Akses Slack hanya-baca yang aman." : "Secure, read-only Slack access."}
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "id" ? "Tidak Ada Panggilan API" : "No API Calls"}
                </h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Tidak ada panggilan API eksternal kecuali disetujui."
                    : "No external API calls unless approved."}
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
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{language === "id" ? "Kontrol Penuh" : "Full Control"}</h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Anda mengontrol apa yang disertakan dalam konteks pelatihan."
                    : "You control what's included in training context."}
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
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "id" ? "Protokol Konteks Model" : "Model Context Protocol"}
                </h3>
                <p className="text-gray-500">
                  {language === "id"
                    ? "Dibangun dengan Protokol Konteks Model untuk memori persisten tanpa biaya tinggi."
                    : "Built with Model Context Protocol for persistent memory without high costs."}
                </p>
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

            {/* Billing period toggle */}
            <div className="flex items-center justify-center my-8 space-x-4">
              <span className={`text-sm font-medium ${!annualBilling ? "text-primary" : "text-gray-500"}`}>
                {language === "id" ? "6 Bulan" : "6 Months"}
              </span>
              <div className="flex items-center space-x-2">
                <Switch id="billing-toggle" checked={annualBilling} onCheckedChange={setAnnualBilling} />
                <Label htmlFor="billing-toggle" className="sr-only">
                  Toggle billing period
                </Label>
              </div>
              <span className={`text-sm font-medium ${annualBilling ? "text-primary" : "text-gray-500"}`}>
                {language === "id" ? "12 Bulan" : "12 Months"}
              </span>
              {annualBilling && (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  {language === "id" ? "Hemat 20%" : "Save 20%"}
                </Badge>
              )}
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
                billingPeriod={annualBilling ? "12month" : "6month"}
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
                billingPeriod={annualBilling ? "12month" : "6month"}
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
                    {language === "id" ? "Bagaimana Nectic bekerja dengan Slack?" : "How does Nectic work with Slack?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Nectic terhubung ke Slack Anda melalui integrasi hanya-baca yang aman. Kami menganalisis pesan untuk menemukan pola berulang dan membuat playbook AI yang dapat Anda gunakan dengan satu klik."
                      : "Nectic connects to your Slack through a secure, read-only integration. We analyze messages to find repetitive patterns and create AI playbooks that you can use with one click."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id"
                      ? "Apakah saya perlu mengintegrasikan CRM atau alat lain?"
                      : "Do I need to integrate my CRM or other tools?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Tidak. Nectic bekerja langsung dengan Slack Anda. Tidak diperlukan integrasi tambahan atau pengaturan yang rumit."
                      : "No. Nectic works directly with your Slack. No additional integrations or complicated setup required."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id" ? "Apakah data Slack saya aman?" : "Is my Slack data secure?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Ya. Semua koneksi ke Slack Anda aman dan hanya-baca. Kami menggunakan enkripsi standar industri dan Anda mengontrol data mana yang digunakan untuk pelatihan."
                      : "Yes. All connections to your Slack are secure and read-only. We use industry-standard encryption and you control which data is used for training."}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border rounded-lg px-6 mb-4 shadow-sm">
                  <AccordionTrigger className="text-lg font-medium">
                    {language === "id" ? "Berapa banyak waktu yang bisa saya hemat?" : "How much time can I save?"}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {language === "id"
                      ? "Tim biasanya menghemat 5-10 jam per minggu per anggota tim. Untuk tim penjualan dan dukungan yang aktif di Slack, penghematan bisa lebih tinggi."
                      : "Teams typically save 5-10 hours per week per team member. For sales and support teams active in Slack, savings can be even higher."}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Early Access Bonus section */}
        <section className="w-full py-12 md:py-24 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                {language === "id" ? "Bonus Akses Awal" : "Early Access Bonus"}
              </h2>
              <p className="text-xl text-gray-600">
                {language === "id" ? "Bergabunglah sekarang dan dapatkan:" : "Join now and get:"}
              </p>

              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">
                    {language === "id" ? "3 Playbook AI kustom (gratis)" : "3 custom AI Playbooks (free)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">
                    {language === "id" ? "Input fitur prioritas" : "Priority feature input"}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">
                    {language === "id" ? "Harga diskon seumur hidup" : "Lifetime discount pricing"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  {language === "id" ? "Gabung Akses Awal" : "Join Early Access"}
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
                  ? "Jaminan uang kembali 30 hari. Tanpa risiko, hanya alur kerja yang lebih cepat."
                  : "30-day money-back guarantee. No risk, just faster workflows."}
              </p>
              <p className="text-sm text-gray-500">
                {language === "id" ? "Hanya 25 kursi tersedia." : "Only 25 seats available."}
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
