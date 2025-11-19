/**
 * Health Check API Route
 * GET /api/health - Check environment configuration
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    firebase: {
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    },
    openai: {
      hasApiKey: !!process.env.OPENAI_API_KEY,
    },
    environment: process.env.NODE_ENV,
  }

  // Don't expose actual values, just check if they exist
  const allGood = 
    checks.firebase.projectId &&
    checks.firebase.hasServiceAccountKey &&
    checks.firebase.apiKey &&
    checks.firebase.authDomain &&
    checks.openai.hasApiKey

  return NextResponse.json({
    status: allGood ? 'healthy' : 'missing_config',
    checks,
    message: allGood 
      ? 'All required environment variables are set'
      : 'Some environment variables are missing. Check Vercel settings.',
  })
}

