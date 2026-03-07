import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import type { AnalysisResult } from "@/app/api/concept/analyze/route"
import type { StoredAccount } from "@/lib/concept-firestore"

export const maxDuration = 30

interface DigestAccount {
  id: string
  name: string
  riskLevel: string
  healthScore: number
  changesSince?: AnalysisResult["changesSince"]
  competitorMentions?: string[]
  topQuote?: string
  renewalMonth?: string
}

function categoriseAccounts(accounts: StoredAccount[]) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const deteriorated: DigestAccount[] = []
  const saved: DigestAccount[] = []
  const atRisk: DigestAccount[] = []
  const withCompetitors: DigestAccount[] = []

  for (const a of accounts) {
    const r = a.result
    const updatedRecently = new Date(a.updatedAt ?? a.analyzedAt).getTime() > thirtyDaysAgo
    const delta = r.changesSince?.healthDelta ?? 0
    const topQuote = r.riskSignals?.[0]?.quote ?? ""
    const item: DigestAccount = {
      id: a.id,
      name: r.accountName,
      riskLevel: r.riskLevel,
      healthScore: r.healthScore ?? 0,
      changesSince: r.changesSince,
      competitorMentions: r.competitorMentions,
      topQuote,
      renewalMonth: a.context?.renewalMonth,
    }

    if (r.competitorMentions?.length > 0) withCompetitors.push(item)
    if (updatedRecently && delta < -1) deteriorated.push(item)
    else if (updatedRecently && delta > 2 && (r.riskLevel === "low" || r.riskLevel === "medium")) saved.push(item)
    else if (r.riskLevel === "critical" || r.riskLevel === "high") atRisk.push(item)
  }

  return { deteriorated, saved, atRisk, withCompetitors }
}

function buildDigestEmail({
  deteriorated,
  saved,
  atRisk,
  withCompetitors,
  totalAccounts,
  arrAtRisk,
  arrProtected,
}: {
  deteriorated: DigestAccount[]
  saved: DigestAccount[]
  atRisk: DigestAccount[]
  withCompetitors: DigestAccount[]
  totalAccounts: number
  arrAtRisk: number
  arrProtected: number
}): string {
  const baseUrl = "https://nectic.vercel.app"

  const urgentItems = [...deteriorated, ...withCompetitors.filter((a) => !deteriorated.find((d) => d.id === a.id))]
  const hasUrgent = urgentItems.length > 0

  const urgentSection = hasUrgent ? `
        <!-- URGENT section -->
        <tr>
          <td style="padding:24px 24px 0;">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#dc2626;letter-spacing:1px;text-transform:uppercase;">Needs attention this week</p>
              ${urgentItems.map((a) => `
              <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #fecaca;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <a href="${baseUrl}/concept/account/${a.id}" style="font-size:14px;font-weight:700;color:#171717;text-decoration:none;">${a.name}</a>
                  <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;background:${a.riskLevel === "critical" ? "#fee2e2" : "#ffedd5"};color:${a.riskLevel === "critical" ? "#dc2626" : "#ea580c"};">${a.riskLevel}</span>
                  ${a.competitorMentions?.length ? `<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;background:#fff7ed;color:#ea580c;">⚡ ${a.competitorMentions[0]}</span>` : ""}
                </div>
                ${a.changesSince ? `<p style="margin:0 0 6px;font-size:12px;color:#737373;">${a.changesSince.healthDelta < 0 ? "↓" : ""} ${a.changesSince.summary}</p>` : ""}
                ${a.topQuote ? `<p style="margin:0 0 8px;font-size:12px;color:#404040;font-style:italic;border-left:3px solid #d4d4d4;padding-left:10px;">&ldquo;${a.topQuote.length > 120 ? a.topQuote.slice(0, 117) + "…" : a.topQuote}&rdquo;</p>` : ""}
                ${a.renewalMonth ? `<p style="margin:0;font-size:11px;color:#dc2626;font-weight:600;">Renewal: ${a.renewalMonth}</p>` : ""}
                <a href="${baseUrl}/concept/account/${a.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#171717;text-decoration:none;border:1px solid #d4d4d4;padding:5px 12px;border-radius:6px;">Review →</a>
              </div>`).join("")}
            </div>
          </td>
        </tr>` : ""

  const portfolioSection = `
        <!-- Portfolio summary -->
        <tr>
          <td style="padding:24px 24px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#a3a3a3;letter-spacing:1px;text-transform:uppercase;">Portfolio</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:12px;background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;">
                  <p style="margin:0;font-size:24px;font-weight:300;color:#171717;">${totalAccounts}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#a3a3a3;">accounts</p>
                </td>
                <td style="width:8px;"></td>
                <td style="text-align:center;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                  <p style="margin:0;font-size:24px;font-weight:300;color:#dc2626;">${atRisk.length}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#dc2626;">at risk</p>
                </td>
                <td style="width:8px;"></td>
                <td style="text-align:center;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
                  <p style="margin:0;font-size:24px;font-weight:300;color:#16a34a;">${saved.length}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#16a34a;">saved</p>
                </td>
              </tr>
            </table>
            ${arrAtRisk > 0 ? `
            <div style="margin-top:12px;padding:12px 16px;background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;display:flex;justify-content:space-between;">
              <div>
                <p style="margin:0;font-size:11px;color:#a3a3a3;">ARR at risk</p>
                <p style="margin:2px 0 0;font-size:16px;font-weight:600;color:#dc2626;">$${arrAtRisk.toLocaleString()}</p>
              </div>
              ${arrProtected > 0 ? `<div style="text-align:right;">
                <p style="margin:0;font-size:11px;color:#a3a3a3;">ARR protected</p>
                <p style="margin:2px 0 0;font-size:16px;font-weight:600;color:#16a34a;">$${arrProtected.toLocaleString()}</p>
              </div>` : ""}
            </div>` : ""}
          </td>
        </tr>`

  const savedSection = saved.length > 0 ? `
        <!-- Saved accounts — first section, this is the win to celebrate -->
        <tr>
          <td style="padding:24px 24px 0;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#16a34a;letter-spacing:1px;text-transform:uppercase;">Accounts saved this week</p>
                ${arrProtected > 0 ? `<p style="margin:0;font-size:13px;font-weight:700;color:#16a34a;">$${arrProtected.toLocaleString()} ARR protected</p>` : ""}
              </div>
              ${saved.map((a) => `
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #d1fae5;">
                <a href="${baseUrl}/concept/account/${a.id}" style="font-size:13px;font-weight:600;color:#171717;text-decoration:none;">${a.name}</a>
                <span style="font-size:12px;color:#16a34a;font-weight:600;">↑ ${a.changesSince?.healthDelta ?? 0} health · signal actioned</span>
              </div>`).join("")}
              <p style="margin:8px 0 0;font-size:11px;color:#16a34a;">Early action prevented churn. Nectic flagged ${saved.length} account${saved.length !== 1 ? "s" : ""} before they became critical.</p>
            </div>
          </td>
        </tr>` : ""

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <!-- Header -->
        <tr>
          <td style="background:#171717;padding:20px 24px;">
            <p style="margin:0;color:#a3a3a3;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Nectic · Weekly Digest</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:600;">Your account health this week</p>
          </td>
        </tr>

        ${savedSection}
        ${urgentSection}
        ${portfolioSection}

        <!-- CTA -->
        <tr>
          <td style="padding:24px;">
            <a href="${baseUrl}/concept" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Open portfolio →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;line-height:1.6;">
              Manage your notification settings in <a href="${baseUrl}/concept/workspace" style="color:#404040;">workspace settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json() as { uid?: string; email?: string }

    if (!uid || !email) {
      return NextResponse.json({ error: "uid and email are required" }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" }, { status: 200 })
    }

    const adminDb = getAdminDb()
    const accountsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("accounts")
      .orderBy("analyzedAt", "desc")
      .get()

    const accounts: StoredAccount[] = accountsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StoredAccount[]

    if (accounts.length === 0) {
      return NextResponse.json({ skipped: true, reason: "No accounts to digest" }, { status: 200 })
    }

    const { deteriorated, saved, atRisk, withCompetitors } = categoriseAccounts(accounts)

    const defaultAcv = 10000
    const arrAtRisk = atRisk.length * defaultAcv
    const arrProtected = saved.length * defaultAcv

    const html = buildDigestEmail({
      deteriorated,
      saved,
      atRisk,
      withCompetitors,
      totalAccounts: accounts.length,
      arrAtRisk,
      arrProtected,
    })

    const subject = (() => {
      const urgentCount = deteriorated.length + withCompetitors.filter((a) => !deteriorated.find((d) => d.id === a.id)).length
      if (urgentCount > 0) return `[Nectic] ${urgentCount} account${urgentCount !== 1 ? "s" : ""} need attention this week`
      if (saved.length > 0) return `[Nectic] ${saved.length} account${saved.length !== 1 ? "s" : ""} recovered — weekly digest`
      return `[Nectic] Weekly account health digest`
    })()

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nectic <digest@nectic.app>",
        to: [email],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend weekly digest error:", err)
      return NextResponse.json({ error: "Failed to send digest" }, { status: 502 })
    }

    return NextResponse.json({ sent: true, accountCount: accounts.length }, { status: 200 })
  } catch (err: unknown) {
    console.error("Weekly digest error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
