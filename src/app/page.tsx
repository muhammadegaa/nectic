import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import HowItWorks from "@/components/how-it-works"
import FeatureHighlights from "@/components/feature-highlights"
import EnterpriseTrust from "@/components/enterprise-trust"
import CtaSection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-background">
      <Navigation />
      <HeroSection />
      <HowItWorks />
      <FeatureHighlights />
      <EnterpriseTrust />
      <CtaSection />
      <Footer />
    </main>
  )
}
