"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

// Import Firebase from our existing setup
import { useFirebase } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"

type SurveyProps = {
  email?: string // Make email optional
  subscriptionId?: string
  plan?: string // Make plan optional
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

export function EarlyAdopterSurvey({ email = "", subscriptionId = "", plan = "standard", onComplete }: SurveyProps) {
  // Add default values for email, subscriptionId, and plan
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({
    follow_up_email: email, // Pre-fill with user's email (if available)
    user_email: email || "", // Store user email separately
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [rankings, setRankings] = useState<Record<string, number>>({})
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward")
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error" | "partial">("idle")

  // Add state for email input if not provided
  const [userEmail, setUserEmail] = useState(email || "")
  const [showEmailInput] = useState(!email)

  // Reference to the survey container for scrolling
  const surveyContainerRef = useRef<HTMLDivElement>(null)

  // Calculate progress percentage
  const totalSections = surveyData.length
  const progress = ((currentSection + 1) / totalSections) * 100

  // Trigger confetti on completion
  const triggerConfetti = () => {
    if (typeof window !== "undefined" && window.confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
      })
    }
  }

  // Save to localStorage as a fallback
  const saveToLocalStorage = (data: any) => {
    try {
      localStorage.setItem(`survey_${Date.now()}`, JSON.stringify(data))
      console.log("Survey saved to localStorage")
      return true
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      return false
    }
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

    // If we're showing the email input and it's the first section, validate email
    if (showEmailInput && currentSection === 0) {
      if (!userEmail || !isValidEmail(userEmail)) {
        newErrors.user_email = "Please enter a valid email address"
      }
    }

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

        // Scroll to the survey container instead of the top of the page
        if (surveyContainerRef.current) {
          surveyContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentSection > 0) {
      setAnimationDirection("backward")
      setCurrentSection((prev) => prev - 1)

      // Scroll to the survey container instead of the top of the page
      if (surveyContainerRef.current) {
        surveyContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Get Firebase instance
  const firebase = useFirebase()

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // First try the API route method which is more reliable
      const response = await fetch("/api/submit-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail || email,
          subscriptionId,
          plan,
          responses,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setIsSubmitting(false)
        return
      }

      // If API route fails, try direct Firestore as fallback
      const { db } = firebase

      if (db) {
        const surveysCollection = collection(db, "surveys")
        const docRef = await addDoc(surveysCollection, {
          email: userEmail || email,
          subscriptionId,
          plan,
          responses,
          submittedAt: new Date().toISOString(),
        })

        console.log("Survey submitted with ID: ", docRef.id)
        setIsSubmitted(true)
        setSubmissionStatus("success")
      } else {
        throw new Error("Firestore not available")
      }
    } catch (error) {
      console.error("Error submitting survey:", error)
      setSubmitError("Failed to submit survey. Please try again later.")

      // Last resort: save to localStorage
      try {
        localStorage.setItem(
          "pendingSurvey",
          JSON.stringify({
            email: userEmail || email,
            subscriptionId,
            plan,
            responses,
            submittedAt: new Date().toISOString(),
          }),
        )
        console.log("Survey saved to localStorage for later submission")
        setIsSubmitted(true) // Still mark as submitted for UX purposes
        setSubmissionStatus("partial")
      } catch (localStorageError) {
        console.error("Failed to save to localStorage:", localStorageError)
        setSubmissionStatus("error")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initialize Firebase outside of conditional block
  const { db } = useFirebase()

  useEffect(() => {
    if (isSubmitted) {
      triggerConfetti()
      if (onComplete) {
        onComplete()
      }
    }
  }, [isSubmitted, onComplete])

  if (isCompleted || isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full overflow-hidden rounded-2xl shadow-xl border border-gray-100"
        >
          {/* Top gradient banner */}
          <div className="h-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          <div className="px-8 pt-10 pb-8 bg-white">
            {/* Success icon with animated ring */}
            <motion.div
              className="mx-auto relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-green-200"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </motion.div>

            {/* Success message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Onboarding Complete</h2>
              <p className="text-gray-600 text-center mb-8">
                Thank you for sharing your insights. We're tailoring Nectic to your specific needs.
              </p>
            </motion.div>

            {/* Status messages with appropriate styling */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {submissionStatus === "error" && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                  <p className="text-amber-800 text-sm flex items-start">
                    <svg
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>
                      We've stored your responses locally. Our team will follow up to ensure your information is
                      properly recorded.
                    </span>
                  </p>
                </div>
              )}

              {submissionStatus === "partial" && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                  <p className="text-amber-800 text-sm flex items-start">
                    <svg
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Your responses have been saved locally and will sync with our database when connectivity is
                      restored.
                    </span>
                  </p>
                </div>
              )}

              {submissionStatus === "success" && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm flex items-start">
                    <svg
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Your responses have been successfully saved. Thank you for completing the onboarding process.
                    </span>
                  </p>
                </div>
              )}
            </motion.div>

            {/* Next steps section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-sm font-medium text-gray-700 mb-3">What happens next?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-600 text-xs font-medium">1</span>
                  </div>
                  <p className="text-sm text-gray-600">We'll reach out to you with important updates</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-600 text-xs font-medium">2</span>
                  </div>
                  <p className="text-sm text-gray-600">Contact us if you have any questions or need assistance</p>
                </li>
              </ul>
            </motion.div>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-center"
            >
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 w-full"
              >
                Go to Dashboard
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Questions? Contact{" "}
                <a href="mailto:helloegglabs@gmail.com" className="text-amber-600 hover:underline">
                  helloegglabs@gmail.com
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentSectionData = surveyData[currentSection]

  return (
    <div ref={surveyContainerRef} className="w-full max-w-2xl mx-auto my-8">
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

      {/* Email input if not provided */}
      {showEmailInput && currentSection === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <label className="block text-base font-medium mb-2">Please enter your email address to continue</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value)
              setResponses((prev) => ({
                ...prev,
                user_email: e.target.value,
                follow_up_email: e.target.value,
              }))
            }}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
          {errors.user_email && <p className="mt-1 text-sm text-red-600">{errors.user_email}</p>}
        </motion.div>
      )}

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
