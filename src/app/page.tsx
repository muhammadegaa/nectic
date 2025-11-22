"use client"

import { lazy, Suspense } from "react"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load below-the-fold components for better performance
const HowItWorks = lazy(() => import("@/components/how-it-works"))
const FeatureHighlights = lazy(() => import("@/components/feature-highlights"))
const EnterpriseTrust = lazy(() => import("@/components/enterprise-trust"))
const HowToSection = lazy(() => import("@/components/how-to-section"))
const UseCasesSection = lazy(() => import("@/components/use-cases-section"))
const TestimonialsSection = lazy(() => import("@/components/testimonials-section"))
const CustomerLogosSection = lazy(() => import("@/components/customer-logos-section"))
const CtaSection = lazy(() => import("@/components/cta-section"))
const Footer = lazy(() => import("@/components/footer"))

function SectionSkeleton() {
  return (
    <div className="py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-background">
      <Navigation />
      <HeroSection />
      <Suspense fallback={<SectionSkeleton />}>
      <HowItWorks />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <HowToSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <UseCasesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <FeatureHighlights />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <EnterpriseTrust />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CustomerLogosSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <CtaSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <Footer />
      </Suspense>
    </main>
  )
}
