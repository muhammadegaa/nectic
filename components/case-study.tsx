"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, User } from "lucide-react"

interface CaseStudyProps {
  title: string
  company: string
  industry: string
  challenge: string
  solution: string
  results: string
}

export function CaseStudy({ title, company, industry, challenge, solution, results }: CaseStudyProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-4">
      <Button variant="outline" className="flex items-center gap-2 mb-2" onClick={() => setIsOpen(!isOpen)}>
        <FileText className="h-4 w-4" />
        {isOpen ? "Hide Case Study" : "View Case Study"}
      </Button>

      {isOpen && (
        <Card className="mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                <span>
                  {company} · {industry}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Challenge</h4>
              <p className="text-sm mt-1">{challenge}</p>
            </div>
            <div>
              <h4 className="font-medium">Solution</h4>
              <p className="text-sm mt-1">{solution}</p>
            </div>
            <div>
              <h4 className="font-medium">Results</h4>
              <p className="text-sm mt-1">{results}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
