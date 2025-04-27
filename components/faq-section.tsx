"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"

export function FAQSection() {
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    setMounted(true)
    // Force update when language changes
    setCurrentLanguage(language)
  }, [language])

  // Define FAQs directly based on current language state
  const faqs = !mounted
    ? []
    : currentLanguage === "id"
      ? [
          {
            question: "Kapan kartu saya akan ditagih?",
            answer:
              "Kartu Anda akan ditagih segera setelah berlangganan. Kami menawarkan jaminan uang kembali 30 hari jika Anda tidak puas dengan layanan kami.",
          },
          {
            question: "Bagaimana Nectic mengidentifikasi peluang AI?",
            answer:
              "Nectic terhubung ke sistem bisnis Anda melalui integrasi hanya-baca yang aman. Kami menganalisis alur kerja dan proses Anda untuk menemukan area di mana AI dapat meningkatkan efisiensi atau hasil.",
          },
          {
            question: "Apakah data bisnis saya aman?",
            answer:
              "Ya. Semua koneksi ke sistem Anda aman dan hanya-baca. Kami menggunakan enkripsi standar industri untuk semua data dalam perjalanan dan saat istirahat.",
          },
          {
            question: "Bagaimana jika saya tidak memiliki keahlian teknis?",
            answer:
              "Nectic dirancang untuk bisnis tanpa keahlian teknis AI. Platform kami menangani analisis, dan panduan implementasi kami menggunakan bahasa yang sederhana dengan instruksi langkah demi langkah.",
          },
        ]
      : [
          {
            question: "When will my card be charged?",
            answer:
              "Your card will be charged immediately when you subscribe. We offer a 30-day money-back guarantee if you're not satisfied with our service.",
          },
          {
            question: "How does Nectic identify AI opportunities?",
            answer:
              "Nectic connects to your business systems through secure, read-only integrations. We analyze your workflows and processes to find areas where AI can improve efficiency or outcomes.",
          },
          {
            question: "Is my business data secure?",
            answer:
              "Yes. All connections to your systems are secure and read-only. We use industry-standard encryption for all data in transit and at rest.",
          },
          {
            question: "Do I need technical expertise to use Nectic?",
            answer:
              "Not at all. Nectic is designed for businesses without technical AI expertise. Our platform handles the analysis, and our implementation guides use plain language with step-by-step instructions.",
          },
        ]

  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {currentLanguage === "id" ? "Pertanyaan Umum" : "Common Questions"}
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full" key={`faq-${currentLanguage}`}>
            {faqs.map((faq, index) => (
              <AccordionItem key={`${currentLanguage}-item-${index}`} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
