import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import GapSection from "@/components/gap-section"
import HowItWorks from "@/components/how-it-works"
import SignalPreview from "@/components/signal-preview"
import WeeklyBrief from "@/components/weekly-brief"
import CtaSection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-white">
      <Navigation />
      <HeroSection />
      <GapSection />
      <HowItWorks />
      <SignalPreview />
      <WeeklyBrief />
      <CtaSection />
      <Footer />
    </main>
  )
}
