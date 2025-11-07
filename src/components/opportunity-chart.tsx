"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { Opportunity } from "@/lib/opportunities-data"

interface OpportunityChartProps {
  opportunities: Opportunity[]
}

export function OpportunityChart({ opportunities }: OpportunityChartProps) {
  // Check if opportunities data is valid
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No opportunity data available</p>
      </div>
    )
  }

  // Sort opportunities by impact score in descending order
  const sortedOpportunities = [...opportunities]
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10) // Show top 10 opportunities
    .map((opp) => ({
      name: opp.title || (opp as any).name || opp.id,
      impact: opp.impactScore,
      difficulty: opp.implementationEffort,
    }))

  // Function to determine bar color based on implementation difficulty
  const getBarColor = (difficulty: number) => {
    if (difficulty <= 2) return "#22c55e" // green for easy
    if (difficulty <= 4) return "#f59e0b" // amber for medium
    return "#ef4444" // red for hard
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedOpportunities} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => (value.length > 20 ? `${value.substring(0, 20)}...` : value)}
          />
          <Tooltip formatter={(value) => [`${value}%`, "Impact"]} labelStyle={{ fontWeight: "bold" }} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {sortedOpportunities.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.difficulty)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
