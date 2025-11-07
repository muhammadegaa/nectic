"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getAssessmentResults, assessmentQuestions } from "@/lib/assessment-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AssessmentResultsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAssessment() {
      if (!user?.uid) {
        router.push("/dashboard/assessment")
        return
      }

      try {
        const results = await getAssessmentResults(user.uid)
        if (!results) {
          router.push("/dashboard/assessment")
          return
        }
        setAssessment(results)
      } catch (error) {
        console.error("Failed to load assessment:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAssessment()
  }, [user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">No Assessment Found</h2>
        <p className="text-gray-600 mb-4">Please complete the assessment first.</p>
        <Link href="/dashboard/assessment" className="text-amber-600 hover:text-amber-700">
          Start Assessment →
        </Link>
      </div>
    )
  }

  const getAnswerDisplay = (answer: any) => {
    const question = assessmentQuestions.find(q => q.id === answer.questionId)
    if (!question) return "N/A"

    if (question.type === "boolean") {
      return answer.value ? "Yes" : "No"
    }
    if (question.type === "scale" && question.options) {
      const index = Number(answer.value) - 1
      return question.options[index] || answer.value
    }
    return String(answer.value)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800"
    if (score >= 50) return "bg-amber-100 text-amber-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Your Assessment Results</h1>
          <p className="text-gray-600 mt-1">
            Completed on {new Date(assessment.completedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Scores Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Document Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getScoreColor(assessment.scores.documentAutomation)}>
                {assessment.scores.documentAutomation}/100
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Service AI</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getScoreColor(assessment.scores.customerServiceAI)}>
              {assessment.scores.customerServiceAI}/100
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getScoreColor(assessment.scores.dataProcessing)}>
              {assessment.scores.dataProcessing}/100
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Workflow Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getScoreColor(assessment.scores.workflowAutomation)}>
              {assessment.scores.workflowAutomation}/100
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getScoreColor(assessment.scores.overallReadiness)}>
              {assessment.scores.overallReadiness}/100
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Your Answers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessment.answers.map((answer: any, index: number) => {
            const question = assessmentQuestions.find(q => q.id === answer.questionId)
            if (!question) return null

            return (
              <div key={answer.questionId} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 mb-1">
                      {index + 1}. {question.text}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Your answer:</span> {getAnswerDisplay(answer)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {question.category.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/dashboard">
          <button className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
            View Opportunities
          </button>
        </Link>
      </div>
    </div>
  )
}

