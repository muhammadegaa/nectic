import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return NextResponse.json({ clientId: null }, { status: 500 })

  try {
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const googleIdp = (data.idpConfig ?? []).find(
      (c: { provider: string }) => c.provider === 'google.com'
    )
    return NextResponse.json({ clientId: googleIdp?.clientId ?? null })
  } catch {
    return NextResponse.json({ clientId: null }, { status: 500 })
  }
}
