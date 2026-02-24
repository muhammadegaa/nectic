"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const HOURS_PER_WEEK = 5
const HOURLY_RATE = 50

export default function RoiCalculator() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [teamSize, setTeamSize] = useState(3)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const hoursSaved = teamSize * HOURS_PER_WEEK
  const monthlySavings = hoursSaved * 4 * HOURLY_RATE

  return (
    <section id="roi" className="py-24 px-6 lg:px-8 bg-muted/30 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-light text-foreground mb-2">How much time do you lose on reports?</h2>
          <p className="text-foreground/60 mb-8 text-sm">
            Finance teams spend 5+ hours per person per week gathering data and recreating reports.
          </p>

          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <label htmlFor="team-size" className="text-sm font-medium text-foreground">
                Finance team size
              </label>
              <input
                id="team-size"
                type="range"
                min={1}
                max={20}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="flex-1 max-w-xs h-2 bg-muted rounded-lg cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-lg font-medium text-foreground w-8">{teamSize}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <div className="text-2xl font-light text-foreground">{hoursSaved} hrs</div>
                <div className="text-xs text-foreground/50">saved per week</div>
              </div>
              <div>
                <div className="text-2xl font-light text-foreground">
                  ${(monthlySavings / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-foreground/50">value per month</div>
              </div>
            </div>
          </div>

          <Button size="lg" asChild className="group bg-foreground text-background hover:bg-foreground/90">
            <Link href="/upload">
              Try it in 30 seconds
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
