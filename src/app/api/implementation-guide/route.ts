import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOpportunityById } from "@/lib/opportunities-service"
import { generateImplementationGuide } from "@/lib/ai-service"

export async function POST(request: Request) {
  try {
    // Get user ID from session or cookie
    const userId = cookies().get("auth_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { opportunityId } = body

    if (!opportunityId) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 })
    }

    // Get the opportunity
    const opportunity = await getOpportunityById(opportunityId, userId)

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }

    // Generate the implementation guide
    const guide = await generateImplementationGuide(opportunity)

    return NextResponse.json({
      success: true,
      guide,
    })
  } catch (error) {
    console.error("Error generating implementation guide:", error)
    return NextResponse.json({ error: "Failed to generate implementation guide. Please try again." }, { status: 500 })
  }
}
