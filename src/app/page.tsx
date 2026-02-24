"use client"

import { lazy, Suspense } from "react"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import { Skeleton } from "@/components/ui/skeleton"

const HowItWorks = lazy(() => import("@/components/how-it-works"))
const RoiCalculator = lazy(() => import("@/components/roi-calculator"))
const CompetitiveComparison = lazy(() => import("@/components/competitive-comparison"))
const UseCasesSection = lazy(() => import("@/components/use-cases-section"))
const EnterpriseTrust = lazy(() => import("@/components/enterprise-trust"))
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
      <RoiCalculator />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <CompetitiveComparison />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <UseCasesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
      <EnterpriseTrust />
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
