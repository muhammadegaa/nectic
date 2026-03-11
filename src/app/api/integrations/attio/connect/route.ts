import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-server"

export const maxDuration = 10

const SCOPES = [
  "read:objects:companies",
  "write:objects:companies",
  "read:attributes:companies",
  "write:attributes:companies",
].join(" ")

export async function GET(req: NextRequest) {
  const queryToken = req.nextUrl.searchParams.get("token")
  let uid: string | null = null

  if (queryToken) {
    const fakeReq = new Request(req.url, {
      headers: { authorization: `Bearer ${queryToken}` },
    }) as NextRequest
    uid = await getAuthenticatedUserId(fakeReq)
  } else {
    uid = await getAuthenticatedUserId(req)
  }

  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = process.env.ATTIO_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/concept/workspace?error=attio_not_configured`
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nectic.xyz"
  const redirectUri = `${baseUrl}/api/integrations/attio/callback`
  const state = Buffer.from(JSON.stringify({ uid })).toString("base64url")

  const authUrl = new URL("https://app.attio.com/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", SCOPES)
  authUrl.searchParams.set("state", state)

  return NextResponse.redirect(authUrl.toString())
}
