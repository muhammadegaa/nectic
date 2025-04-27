import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, responses, subscriptionId, plan } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Here you would typically save the survey data to your database
    console.log("Survey submitted:", { email, responses, subscriptionId, plan })

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting survey:", error)
    return NextResponse.json(
      {
        error: "Failed to submit survey",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
