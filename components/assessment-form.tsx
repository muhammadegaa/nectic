"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { assessmentQuestions, type AssessmentAnswer, saveAssessmentResults } from "@/lib/assessment-service"

export function AssessmentForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current question
  const currentQuestion = assessmentQuestions[currentStep]

  // Handle answer change
  const handleAnswerChange = (value: string | number | boolean) => {
    setAnswers((prev) => {
      // Find if we already have an answer for this question
      const existingIndex = prev.findIndex((a) => a.questionId === currentQuestion.id)

      if (existingIndex >= 0) {
        // Update existing answer
        const newAnswers = [...prev]
        newAnswers[existingIndex] = {
          questionId: currentQuestion.id,
          value,
        }
        return newAnswers
      } else {
        // Add new answer
        return [
          ...prev,
          {
            questionId: currentQuestion.id,
            value,
          },
        ]
      }
    })
  }

  // Get current answer
  const getCurrentAnswer = () => {
    return answers.find((a) => a.questionId === currentQuestion.id)?.value
  }

  // Handle next step
  const handleNext = () => {
    // Check if we have an answer for the current question
    const hasAnswer = answers.some((a) => a.questionId === currentQuestion.id)

    if (!hasAnswer) {
      toast({
        title: "Please answer the question",
        description: "You need to provide an answer before proceeding.",
        variant: "destructive",
      })
      return
    }

    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit your assessment.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Save assessment results
      await saveAssessmentResults(user.uid, answers)

      toast({
        title: "Assessment completed",
        description: "Your assessment has been submitted successfully.",
      })

      // Redirect to scanning page
      router.push("/scanning")
    } catch (error) {
      console.error("Error submitting assessment:", error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your assessment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null

    const currentAnswer = getCurrentAnswer()

    switch (currentQuestion.type) {
      case "multiple-choice":
        return (
          <RadioGroup value={currentAnswer as string} onValueChange={handleAnswerChange} className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "scale":
        return (
          <div className="space-y-4">
            <Slider
              min={currentQuestion.min || 1}
              max={currentQuestion.max || 5}
              step={1}
              value={[(currentAnswer as number) || currentQuestion.min || 1]}
              onValueChange={(value) => handleAnswerChange(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {currentQuestion.options?.map((option, index) => (
                <span key={index}>{option}</span>
              ))}
            </div>
          </div>
        )

      case "numeric":
        return (
          <div className="space-y-2">
            <Input
              type="number"
              min={currentQuestion.min}
              max={currentQuestion.max}
              value={(currentAnswer as number) || ""}
              onChange={(e) => handleAnswerChange(Number(e.target.value))}
              placeholder="Enter a number"
            />
            {(currentQuestion.min !== undefined || currentQuestion.max !== undefined) && (
              <p className="text-xs text-muted-foreground">
                {currentQuestion.min !== undefined && `Min: ${currentQuestion.min}`}
                {currentQuestion.min !== undefined && currentQuestion.max !== undefined && " | "}
                {currentQuestion.max !== undefined && `Max: ${currentQuestion.max}`}
              </p>
            )}
          </div>
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch checked={(currentAnswer as boolean) || false} onCheckedChange={handleAnswerChange} />
            <Label>Yes</Label>
          </div>
        )

      default:
        return null
    }
  }

  // Calculate progress
  const progress = Math.round((currentStep / (assessmentQuestions.length - 1)) * 100)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Business Process Assessment</CardTitle>
        <CardDescription>
          Answer the following questions to help us identify AI opportunities for your business.
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div
            className="bg-amber-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-right text-muted-foreground mt-1">
          Question {currentStep + 1} of {assessmentQuestions.length}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">{currentQuestion?.text}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentQuestion?.category === "document-processing" && "Document Processing"}
              {currentQuestion?.category === "customer-service" && "Customer Service"}
              {currentQuestion?.category === "data-entry" && "Data Entry"}
              {currentQuestion?.category === "general" && "General"}
            </p>
          </div>
          <div className="pt-2">{renderQuestion()}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isSubmitting}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={isSubmitting}>
          {currentStep < assessmentQuestions.length - 1 ? "Next" : "Submit"}
          {isSubmitting && (
            <svg
              className="animate-spin ml-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
