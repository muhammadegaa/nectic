"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

type SurveyProps = {
  email: string
  subscriptionId?: string
  plan: string
  onComplete?: () => void
}

// Define the survey sections and questions
const surveyData = [
  {
    id: "business",
    title: "About Your Business",
    description: "Help us understand your company better so we can tailor Nectic to your needs",
    icon: "👋",
    questions: [
      {
        id: "role",
        text: "What is your role in the company?",
        type: "radio",
        options: ["Director/Head of Innovation", "IT Manager", "Operations Manager", "Other"],
        allowOther: true,
      },
      {
        id: "company_size",
        text: "How many employees does your company have?",
        type: "radio",
        options: ["<50", "50–200", "201–500", "501–1000", ">1000"],
      },
      {
        id: "industry",
        text: "What industry are you in?",
        type: "radio",
        options: ["Finance", "Healthcare", "Retail", "Manufacturing", "Other"],
        allowOther: true,
      },
    ],
  },
  {
    id: "pain_points",
    title: "Current Challenges",
    description: "Tell us about your current AI implementation challenges",
    icon: "🔍",
    questions: [
      {
        id: "current_tools",
        text: "What business systems or tools do you currently use?",
        type: "checkbox",
        options: ["Salesforce", "Microsoft 365", "Google Workspace", "SAP", "Other"],
        allowOther: true,
        selectMultiple: true,
      },
      {
        id: "challenges",
        text: "What are your biggest challenges in identifying or implementing AI opportunities?",
        type: "checkbox",
        options: [
          "Lack of technical expertise",
          "Too many vendor options",
          "Unclear ROI",
          "Integration complexity",
          "Data security concerns",
          "Other",
        ],
        allowOther: true,
        selectMultiple: true,
        maxSelections: 3,
      },
      {
        id: "previous_experience",
        text: "Have you tried any AI solutions before? If yes, which ones and what was your experience?",
        type: "textarea",
      },
    ],
  },
  {
    id: "expectations",
    title: "Your Success Criteria",
    description: "Help us understand what success looks like for you",
    icon: "🎯",
    questions: [
      {
        id: "success_criteria",
        text: "What would make you feel this platform is a success for your business in the first 3 months?",
        type: "textarea",
      },
      {
        id: "important_features",
        text: "Which features are most important to you?",
        type: "ranking",
        options: [
          "One-click assessment",
          "Personalized AI opportunity dashboard",
          "Vendor comparison matrices",
          "Step-by-step implementation guides",
          "ROI visualizer",
          "AI readiness score",
          "Other",
        ],
        allowOther: true,
        maxSelections: 3,
      },
      {
        id: "insight_preferences",
        text: "How do you prefer to receive insights and recommendations?",
        type: "radio",
        options: ["Email reports", "In-app dashboard", "Downloadable PDFs", "Other"],
        allowOther: true,
      },
    ],
  },
  {
    id: "feedback",
    title: "Final Steps",
    description: "Share any concerns and let us know how to follow up",
    icon: "🚀",
    questions: [
      {
        id: "concerns",
        text: "What concerns do you have about using a platform like this?",
        type: "textarea",
      },
      {
        id: "follow_up",
        text: "Would you be open to a follow-up interview or beta test session?",
        type: "radio",
        options: ["Yes", "No"],
        conditionalField: {
          showWhen: "Yes",
          field: {
            id: "follow_up_email",
            text: "Please confirm your email for follow-up",
            type: "email",
          },
        },
      },
    ],
  },
]

export function EarlyAdopterSurvey({ email, subscriptionId, plan, onComplete }: SurveyProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({
    follow_up_email: email, // Pre-fill with user's email
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [rankings, setRankings] = useState<Record<string, number>>({})
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward")

  // Calculate progress percentage
  const totalSections = surveyData.length
  const progress = ((currentSection + 1) / totalSections) * 100

  // Trigger confetti on completion
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
    })
  }

  const handleTextChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleRadioChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
    setResponses((prev) => {
      const currentValues = prev[questionId] || []

      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, value],
        }
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter((v: string) => v !== value),
        }
      }
    })

    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleRankingChange = (questionId: string, option: string, selected: boolean) => {
    if (selected) {
      // Add to rankings if not already at max
      const currentRankings = Object.values(rankings).filter((rank) => rank !== undefined && rank !== null).length

      const question = surveyData.flatMap((section) => section.questions).find((q) => q.id === questionId)

      const maxSelections = question?.maxSelections || 3

      if (currentRankings < maxSelections) {
        setRankings((prev) => ({
          ...prev,
          [option]: currentRankings + 1,
        }))

        // Update responses
        setResponses((prev) => {
          const currentSelections = prev[questionId] || []
          return {
            ...prev,
            [questionId]: [...currentSelections, option],
          }
        })
      }
    } else {
      // Remove from rankings and reorder
      const removedRank = rankings[option]

      if (removedRank) {
        const newRankings: Record<string, number> = {}

        // Reorder all rankings
        Object.entries(rankings).forEach(([key, rank]) => {
          if (key !== option) {
            if (rank > removedRank) {
              newRankings[key] = rank - 1
            } else {
              newRankings[key] = rank
            }
          }
        })

        setRankings(newRankings)

        // Update responses
        setResponses((prev) => {
          const currentSelections = prev[questionId] || []
          return {
            ...prev,
            [questionId]: currentSelections.filter((item: string) => item !== option),
          }
        })
      }
    }

    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const validateSection = () => {
    const currentSectionData = surveyData[currentSection]
    const newErrors: Record<string, string> = {}

    currentSectionData.questions.forEach((question) => {
      const response = responses[question.id]

      // Check if question is answered
      if (!response || (Array.isArray(response) && response.length === 0)) {
        newErrors[question.id] = "Please answer this question"
      }

      // Check conditional fields
      if (question.conditionalField && response === "Yes") {
        const conditionalResponse = responses[question.conditionalField.field.id]
        if (!conditionalResponse) {
          newErrors[question.conditionalField.field.id] = "Please provide this information"
        } else if (question.conditionalField.field.type === "email" && !isValidEmail(conditionalResponse)) {
          newErrors[question.conditionalField.field.id] = "Please enter a valid email address"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleNext = () => {
    if (validateSection()) {
      if (currentSection < surveyData.length - 1) {
        setAnimationDirection("forward")
        setCurrentSection((prev) => prev + 1)
        window.scrollTo(0, 0)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentSection > 0) {
      setAnimationDirection("backward")
      setCurrentSection((prev) => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Log the survey submission attempt
      console.log("Submitting survey for:", email)

      // Submit the survey data
      const response = await fetch("/api/submit-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          responses,
          subscriptionId,
          plan,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to submit survey: ${errorData.message || response.statusText}`)
      }

      setIsCompleted(true)
      triggerConfetti()

      // Log that we're about to call onComplete
      console.log("Survey completed, calling onComplete callback")

      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 2000) // Give time for the completion animation
      }
    } catch (err) {
      console.error("Survey submission error:", err)
      setErrors({
        submit: `There was an error submitting your responses: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12 px-4"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold mb-4">You're All Set!</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Thank you for completing your onboarding. We'll use this information to tailor Nectic to your specific needs.
        </p>
        <p className="text-sm text-gray-500">Our team will reach out shortly with next steps.</p>
      </motion.div>
    )
  }

  const currentSectionData = surveyData[currentSection]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar and section indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-3xl mr-3">{currentSectionData.icon}</span>
              <h3 className="text-xl font-bold">{currentSectionData.title}</h3>
            </div>
            <p className="text-gray-500">{currentSectionData.description}</p>
          </div>
        </div>

        <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-400"
            initial={{ width: `${(currentSection / totalSections) * 100}%` }}
            animate={{ width: `${((currentSection + 1) / totalSections) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between mt-2">
          {surveyData.map((section, index) => (
            <div
              key={section.id}
              className={cn("flex flex-col items-center", index <= currentSection ? "text-amber-600" : "text-gray-300")}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full mb-1",
                  index < currentSection
                    ? "bg-amber-500"
                    : index === currentSection
                      ? "bg-amber-500 ring-4 ring-amber-100"
                      : "bg-gray-200",
                )}
              />
              <span className="text-xs hidden md:inline">{section.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{
            opacity: 0,
            x: animationDirection === "forward" ? 50 : -50,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: animationDirection === "forward" ? -50 : 50,
          }}
          transition={{ duration: 0.3 }}
          className="space-y-8 mb-8"
        >
          {currentSectionData.questions.map((question) => (
            <motion.div
              key={question.id}
              className="space-y-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <label className="text-base font-medium block">
                {question.text}
                {question.maxSelections && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    (Select up to {question.maxSelections})
                  </span>
                )}
              </label>

              {question.type === "radio" && (
                <div className="space-y-2 pt-2">
                  {question.options.map((option) => (
                    <div
                      key={option}
                      onClick={() => handleRadioChange(question.id, option)}
                      className={cn(
                        "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                        responses[question.id] === option
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-100 hover:border-gray-200",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                          responses[question.id] === option ? "border-amber-500" : "border-gray-300",
                        )}
                      >
                        {responses[question.id] === option && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                      <label className="flex-1 cursor-pointer">{option}</label>
                    </div>
                  ))}

                  {question.allowOther && responses[question.id] === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 pl-8"
                    >
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={responses[`${question.id}_other`] || ""}
                        onChange={(e) => handleTextChange(`${question.id}_other`, e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </motion.div>
                  )}

                  {/* Conditional field */}
                  {question.conditionalField && responses[question.id] === question.conditionalField.showWhen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pl-8"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {question.conditionalField.field.text}
                      </label>
                      <input
                        type={question.conditionalField.field.type}
                        value={responses[question.conditionalField.field.id] || ""}
                        onChange={(e) => handleTextChange(question.conditionalField!.field.id, e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      {errors[question.conditionalField.field.id] && (
                        <p className="mt-1 text-sm text-red-600">{errors[question.conditionalField.field.id]}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {question.type === "checkbox" && (
                <div className="space-y-2 pt-2">
                  {question.options.map((option) => (
                    <div
                      key={option}
                      onClick={() =>
                        handleCheckboxChange(question.id, option, !(responses[question.id] || []).includes(option))
                      }
                      className={cn(
                        "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                        (responses[question.id] || []).includes(option)
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-100 hover:border-gray-200",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center",
                          (responses[question.id] || []).includes(option)
                            ? "border-amber-500 bg-amber-500"
                            : "border-gray-300",
                        )}
                      >
                        {(responses[question.id] || []).includes(option) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">{option}</label>
                    </div>
                  ))}

                  {question.allowOther && (responses[question.id] || []).includes("Other") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 pl-8"
                    >
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={responses[`${question.id}_other`] || ""}
                        onChange={(e) => handleTextChange(`${question.id}_other`, e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {question.type === "textarea" && (
                <div className="pt-2">
                  <textarea
                    id={question.id}
                    name={question.id}
                    rows={4}
                    value={responses[question.id] || ""}
                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your answer..."
                  />
                </div>
              )}

              {question.type === "ranking" && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-gray-500">
                    Select your top {question.maxSelections || 3} choices in order of importance
                  </p>
                  {question.options.map((option) => {
                    const isSelected = rankings[option] !== undefined
                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                          isSelected ? "border-amber-500 bg-amber-50" : "border-gray-100",
                        )}
                      >
                        <div className="flex items-center">
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white mr-3 font-medium">
                              {rankings[option]}
                            </span>
                          )}
                          <span>{option}</span>
                        </div>
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRankingChange(question.id, option, !isSelected)}
                          disabled={!isSelected && Object.keys(rankings).length >= (question.maxSelections || 3)}
                          className={isSelected ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                          {isSelected ? "Remove" : "Select"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {errors[question.id] && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors[question.id]}
                </motion.p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-600">{errors.submit}</p>
        </motion.div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentSection === 0 || isSubmitting}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className={cn(
            "min-w-[120px] transition-all",
            currentSection === surveyData.length - 1
              ? "bg-green-600 hover:bg-green-700"
              : "bg-amber-500 hover:bg-amber-600",
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Submitting...
            </span>
          ) : currentSection === surveyData.length - 1 ? (
            <span className="flex items-center">
              Complete
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </span>
          ) : (
            <span className="flex items-center">
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
