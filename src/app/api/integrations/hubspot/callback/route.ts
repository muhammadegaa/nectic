import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import { ensureNecticProperties } from "@/lib/hubspot"

export const maxDuration = 30

// GET /api/integrations/hubspot/callback?code=...&state=...
// Called by HubSpot after user grants permission.
// Exchanges code for tokens, saves to Firestore, redirects to workspace.
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.xyz"
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${baseUrl}/concept/workspace?hubspot_error=${encodeURIComponent(msg)}`)

  const code = req.nextUrl.searchParams.get("code")
  const stateRaw = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) return errorRedirect(error)
  if (!code || !stateRaw) return errorRedirect("missing_params")

  // Decode state to get uid
  let uid: string
  try {
    const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
    uid = decoded.uid
    if (!uid) throw new Error("no uid")
  } catch {
    return errorRedirect("invalid_state")
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET
  if (!clientId || !clientSecret) return errorRedirect("hubspot_not_configured")

  const redirectUri = `${baseUrl}/api/integrations/hubspot/callback`

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error("HubSpot token exchange failed:", body)
    return errorRedirect("token_exchange_failed")
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    hub_id: number
  }

  const adminDb = getAdminDb()

  // Store tokens securely in Firestore (server-side only field, not in workspace)
  await adminDb.collection("users").doc(uid).set(
    {
      hubspotIntegration: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        portalId: String(tokens.hub_id),
        connectedAt: new Date().toISOString(),
      },
      // Also mark in workspace so client can see connection status
      workspace: {
        hubspotConnected: true,
        hubspotPortalId: String(tokens.hub_id),
      },
    },
    { merge: true }
  )

  // Best-effort: ensure our custom properties exist in their HubSpot portal
  try {
    await ensureNecticProperties(tokens.access_token)
  } catch (e) {
    console.error("ensureNecticProperties failed (non-fatal):", e)
  }

  return NextResponse.redirect(`${baseUrl}/concept/workspace?hubspot_connected=1`)
}
