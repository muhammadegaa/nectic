"use client"

import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"

const rows = [
  { feature: "Answer in 30 seconds", nectic: true, excel: false, bi: false },
  { feature: "No SQL or dashboards", nectic: true, excel: true, bi: false },
  { feature: "Upload Excel, start asking", nectic: true, excel: true, bi: false },
  { feature: "No implementation", nectic: true, excel: true, bi: false },
]

export default function CompetitiveComparison() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="py-24 px-6 lg:px-8 bg-background border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-light text-foreground mb-2">Built for finance, not IT</h2>
          <p className="text-foreground/60 mb-8 text-sm">
            BI tools need implementation. Excel needs manual work. Nectic gives you answers.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-medium text-foreground/80"></th>
                  <th className="text-center py-3 font-medium text-foreground">Nectic</th>
                  <th className="text-center py-3 font-medium text-foreground/60">Excel</th>
                  <th className="text-center py-3 font-medium text-foreground/60">BI tools</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 text-foreground/80">{row.feature}</td>
                    <td className="py-3 text-center">
                      {row.nectic ? (
                        <Check className="w-4 h-4 text-foreground mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.excel ? (
                        <Check className="w-4 h-4 text-foreground/40 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {row.bi ? (
                        <Check className="w-4 h-4 text-foreground/40 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
