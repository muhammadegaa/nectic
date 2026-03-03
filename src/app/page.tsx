import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import HowItWorks from "@/components/how-it-works"
import SignalPreview from "@/components/signal-preview"
import CtaSection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-white">
      <Navigation />
      <HeroSection />
      <HowItWorks />
      <SignalPreview />
      <CtaSection />
      <Footer />
    </main>
  )
}
