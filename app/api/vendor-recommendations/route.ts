import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOpportunityById } from "@/lib/opportunities-service"
import { recommendVendorsForOpportunity } from "@/lib/ai-service"

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
    const opportunity = await getOpportunityById(opportunityId)

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }

    // Generate vendor recommendations
    const vendors = await recommendVendorsForOpportunity(opportunity)

    return NextResponse.json({
      success: true,
      vendors,
    })
  } catch (error) {
    console.error("Error generating vendor recommendations:", error)
    return NextResponse.json({ error: "Failed to generate vendor recommendations. Please try again." }, { status: 500 })
  }
}
