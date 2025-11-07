"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ROUTES } from '@/lib/routes'

import { Button } from "@/components/ui/button"
import { MissionControl } from "@/components/dashboard/mission-control"
import { Card, CardContent } from "@/components/ui/card"

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/30 flex flex-col">
      <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
              <Droplet className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="inline-block font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">
              Nectic
            </span>
          </Link>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto flex-1 space-y-8 py-12 px-4">
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-100/70 p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Enterprise onboarding</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Welcome to your AI command center</h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            We built Nectic for operations, finance, and transformation leaders who need to prove AI value in weeks—not
            quarters. Let’s get your first executive briefing live.
          </p>
        </div>

        <MissionControl
          hasCompletedAssessment={Boolean(user?.hasCompletedAssessment)}
          hasOpportunities={Boolean(user?.hasCompletedAssessment)}
          hasActiveSubscription={Boolean((user as any)?.subscription && ((user as any).subscription.tier ?? "free") !== "free")}
        />

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="grid gap-6 md:grid-cols-3">
            {[
              {
                id: 1,
                title: "Ops & Transformation",
                description: "Surface automation gaps across onboarding, underwriting, finance, and service desks.",
              },
              {
                id: 2,
                title: "Regulated & complex environments",
                description: "Map compliance checkpoints and data lineage so AI recommendations clear audits.",
              },
              {
                id: 3,
                title: "Executive stakeholders",
                description: "Package ROI scenarios and pilot roadmaps for your COO, CFO, and IT leadership teams.",
              },
            ].map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  0{item.id}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">First milestone: readiness diagnostic</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
            Answer 20 enterprise readiness questions so we can benchmark processes, quantify potential ROI, and line up
            pilot candidates for the next steering committee.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => router.push("/dashboard/assessment")} size="lg" className="group">
              Launch diagnostic
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>Skip for now</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
