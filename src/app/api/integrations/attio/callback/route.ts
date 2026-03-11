import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import { ensureAttioAttributes } from "@/lib/attio"

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.xyz"
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${baseUrl}/concept/workspace?attio_error=${encodeURIComponent(msg)}`)

  const code = req.nextUrl.searchParams.get("code")
  const stateRaw = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) return errorRedirect(error)
  if (!code || !stateRaw) return errorRedirect("missing_params")

  let uid: string
  try {
    const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
    uid = decoded.uid
    if (!uid) throw new Error("no uid")
  } catch {
    return errorRedirect("invalid_state")
  }

  const clientId = process.env.ATTIO_CLIENT_ID
  const clientSecret = process.env.ATTIO_CLIENT_SECRET
  if (!clientId || !clientSecret) return errorRedirect("attio_not_configured")

  const redirectUri = `${baseUrl}/api/integrations/attio/callback`

  const tokenRes = await fetch("https://app.attio.com/oauth/token", {
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
    console.error("Attio token exchange failed:", await tokenRes.text())
    return errorRedirect("token_exchange_failed")
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    token_type: string
    owner?: { id: string; slug: string }
  }

  const workspaceId = tokens.owner?.id ?? ""

  const adminDb = getAdminDb()
  await adminDb.collection("users").doc(uid).set(
    {
      attioIntegration: {
        accessToken: tokens.access_token,
        workspaceId,
        connectedAt: new Date().toISOString(),
      },
      workspace: {
        attioConnected: true,
        attioWorkspaceId: workspaceId,
      },
    },
    { merge: true }
  )

  try {
    await ensureAttioAttributes(tokens.access_token)
  } catch (e) {
    console.error("ensureAttioAttributes failed (non-fatal):", e)
  }

  return NextResponse.redirect(`${baseUrl}/concept/workspace?attio_connected=1`)
}
