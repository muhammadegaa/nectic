import { NextResponse } from "next/server"
import { generateOpportunitiesFromAssessment, getAssessmentResults } from "@/lib/assessment-service"

export async function POST(request: Request) {
  try {
    // Get user ID from request body (client sends it)
    const body = await request.json().catch(() => ({}))
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required. Please log in." }, { status: 401 })
    }

    // Verify that the user has completed the assessment
    const assessment = await getAssessmentResults(userId)

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found. Please complete the assessment first." },
        { status: 400 },
      )
    }

    // Start the analysis process
    await generateOpportunitiesFromAssessment(userId)

    return NextResponse.json({
      success: true,
      message: "Analysis completed successfully. Opportunities have been generated.",
    })
  } catch (error) {
    console.error("Error starting analysis:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to start analysis. Please try again."
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
