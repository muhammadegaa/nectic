import { NextResponse } from "next/server"
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { getApp } from "firebase/app"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Get Firestore instance
    const firestore = getFirestore(getApp())

    if (!firestore) {
      throw new Error("Firestore not initialized")
    }

    // Add timestamp
    const surveyData = {
      ...data,
      createdAt: new Date(),
      status: "completed",
    }

    // Save to Firestore
    const surveysCollection = collection(firestore, "surveys")
    const docRef = await addDoc(surveysCollection, surveyData)

    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
      id: docRef.id,
    })
  } catch (error) {
    console.error("Error saving survey:", error)

    // Ensure we return a valid JSON response even on error
    return NextResponse.json(
      {
        error: "Failed to save survey to database",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
