import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateOpportunitiesFromAssessment, getAssessmentResults } from "@/lib/assessment-service"

export async function POST(request: Request) {
  try {
    // Get user ID from session or cookie
    const userId = cookies().get("auth_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
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
      message: "Analysis started successfully. This may take a few minutes to complete.",
    })
  } catch (error) {
    console.error("Error starting analysis:", error)
    return NextResponse.json({ error: "Failed to start analysis. Please try again." }, { status: 500 })
  }
}
