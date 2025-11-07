"use client"

import { useState } from "react"
import { Calendar, CalendarPlus, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface ImplementationStep {
  id: string
  title: string
  description: string
  durationWeeks: number
}

interface ImplementationTrackerProps {
  steps: ImplementationStep[]
}

export function ImplementationTracker({ steps }: ImplementationTrackerProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [implementationDates, setImplementationDates] = useState<Record<string, Date | undefined>>({})

  // Calculate progress
  const totalSteps = steps.length
  const completedCount = Object.values(completedSteps).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / totalSteps) * 100)

  const toggleStepCompletion = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const setStepDate = (stepId: string, date?: Date) => {
    setImplementationDates((prev) => ({
      ...prev,
      [stepId]: date,
    }))
  }

  // Export to calendar
  const exportToCalendar = () => {
    // In a real implementation, this would generate calendar events
    alert("Exporting to calendar...")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Implementation Progress</h3>
          <span className="text-sm font-medium">{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3 p-4 bg-muted/30 rounded-md">
            <button
              onClick={() => toggleStepCompletion(step.id)}
              className="flex-shrink-0 mt-0.5 text-primary hover:text-primary/80 transition-colors"
              aria-label={completedSteps[step.id] ? "Mark as incomplete" : "Mark as complete"}
            >
              {completedSteps[step.id] ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${completedSteps[step.id] ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </h4>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      {implementationDates[step.id] ? (
                        <span className="text-xs mr-2">{format(implementationDates[step.id]!, "MMM d, yyyy")}</span>
                      ) : null}
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={implementationDates[step.id]}
                      onSelect={(date: Date | undefined) => setStepDate(step.id, date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Estimated duration: {step.durationWeeks} weeks</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={exportToCalendar} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Export to Calendar
        </Button>
      </div>
    </div>
  )
}
