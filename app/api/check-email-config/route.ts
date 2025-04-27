import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
  try {
    // Check if email environment variables are set
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS_ALT

    if (!emailUser || !emailPass) {
      return NextResponse.json({
        configured: false,
        error: "Email environment variables are not set",
      })
    }

    // Try to create a transporter to verify credentials
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    // Verify connection configuration
    try {
      await transporter.verify()
      return NextResponse.json({
        configured: true,
        message: "Email configuration is valid",
      })
    } catch (error) {
      return NextResponse.json({
        configured: false,
        error: "Invalid email configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Error checking email configuration:", error)
    return NextResponse.json({
      configured: false,
      error: "Failed to check email configuration",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
