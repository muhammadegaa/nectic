import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"

export const maxDuration = 10

const SCOPES = [
  "crm.objects.companies.read",
  "crm.objects.companies.write",
  "crm.schemas.companies.read",
  "crm.schemas.companies.write",
].join(" ")

// GET /api/integrations/hubspot/connect?token=<firebase_id_token>
// Verifies the user, then redirects to HubSpot OAuth
export async function GET(req: NextRequest) {
  // Support both Bearer header and ?token= query param (OAuth redirects can't set headers)
  const queryToken = req.nextUrl.searchParams.get("token")
  let uid: string | null = null

  if (queryToken) {
    // Temporarily set a fake header to reuse getAuthenticatedUserId
    const fakeReq = new Request(req.url, {
      headers: { authorization: `Bearer ${queryToken}` },
    }) as NextRequest
    uid = await getAuthenticatedUserId(fakeReq)
  } else {
    uid = await getAuthenticatedUserId(req)
  }

  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = process.env.HUBSPOT_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/concept/workspace?error=hubspot_not_configured`
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.xyz"
  const redirectUri = `${baseUrl}/api/integrations/hubspot/callback`

  // State encodes uid — callback uses this to save tokens to the right user
  const state = Buffer.from(JSON.stringify({ uid })).toString("base64url")

  const authUrl = new URL("https://app.hubspot.com/oauth/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", SCOPES)
  authUrl.searchParams.set("state", state)

  return NextResponse.redirect(authUrl.toString())
}
