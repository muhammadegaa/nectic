import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/infrastructure/firebase/firebase-server"
import { callAI } from "@/lib/ai-client"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const {
      accountName,
      accountId,
      riskLevel,
      signalCount,
      topSignalTitle,
      topSignalQuote,
      topSignalExplanation,
      draftResponse,
      competitorNames,
      isCompetitorAlert,
      renewalMonth,
      email,
      uid,
    } = await req.json() as {
      accountName: string
      accountId?: string
      riskLevel: string
      signalCount: number
      topSignalTitle?: string
      topSignalQuote?: string
      topSignalExplanation?: string
      draftResponse?: string
      competitorNames?: string[]
      isCompetitorAlert?: boolean
      renewalMonth?: string
      email: string
      uid?: string
    }

    if (!accountName || !email) {
      return NextResponse.json({ error: "accountName and email are required" }, { status: 400 })
    }

    if (!isCompetitorAlert && riskLevel !== "critical" && riskLevel !== "high") {
      return NextResponse.json({ skipped: true, reason: "riskLevel not critical or high" }, { status: 200 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" }, { status: 200 })
    }

    // Auto-generate draft inline if not provided and we have a quote
    let resolvedDraft = draftResponse ?? ""
    if (!resolvedDraft && topSignalQuote && topSignalTitle) {
      try {
        // Detect Bahasa from quote
        const isBahasa = /\b(tidak|iya|saya|kami|tolong|sudah|belum|bisa|mohon|terima kasih|pak|bu|mas|kak|gimana|banget|dong)\b/i.test(topSignalQuote)
        const competitorNote = competitorNames?.length
          ? `Customer mentioned competitor(s): ${competitorNames.join(", ")} — message must show concrete value or urgency.`
          : ""
        resolvedDraft = (await callAI({
          system: `You are a CS manager writing a WhatsApp reply in an ongoing thread — not a cold message, not a bot intro.

Rules: Never "Halo kami dari [company]". Use "saya" not "kami" for first-person. No sign-off. 2-3 sentences. No markdown. No placeholders. Show personal ownership: "Saya akan..." not "Tim kami akan...". Don't minimise the problem. Don't make promises you can't keep.
${competitorNote}
Write in ${isBahasa ? "Bahasa Indonesia" : "English"} — match the customer's register.`,
          user: `Account: ${accountName} (risk: ${riskLevel})
Signal: ${topSignalTitle}
${topSignalExplanation ? `Context: ${topSignalExplanation}` : ""}
What customer said: "${topSignalQuote}"

Write only the message.`,
          maxTokens: 300,
          temperature: 0.4,
        })).trim()
      } catch { /* non-fatal — draft is optional */ }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nectic.xyz"
    const accountUrl = accountId
      ? `${appUrl}/concept/action/${accountId}`
      : `${appUrl}/concept/board`

    let subject: string
    let htmlBody: string

    if (isCompetitorAlert && competitorNames?.length) {
      const competitorList = competitorNames.join(", ")
      subject = `[Nectic] ⚡ ${accountName} mentioned ${competitorList}`

      const renewalLine = renewalMonth
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:12px;color:#9a3412;font-weight:600;">Renewal: ${renewalMonth} — act before window closes</p></td></tr>`
        : ""

      const quoteLine = topSignalQuote
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:13px;color:#431407;font-style:italic;border-left:3px solid #fdba74;padding-left:12px;line-height:1.7;background:#fff7ed;border-radius:0 6px 6px 0;padding:10px 12px 10px 16px;">"${topSignalQuote}"</p></td></tr>`
        : ""

      const draftSection = resolvedDraft
        ? `<tr><td style="padding:0 24px 16px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">AI-drafted response</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#14532d;line-height:1.7;">${resolvedDraft}</p>
            </div>
            <p style="margin:8px 0 0;font-size:11px;color:#a3a3a3;">Review and edit in Nectic before sending.</p>
          </td></tr>`
        : ""

      htmlBody = buildEmailHtml({
        headerBg: "#ea580c",
        headerLabel: "Nectic · Competitive Threat",
        headerTitle: `⚡ ${competitorList} Mentioned`,
        accountName,
        renewalLine,
        quoteLine,
        draftSection,
        accountUrl,
        appUrl,
        ctaLabel: "Review &amp; send response →",
        ctaBg: "#ea580c",
        footerText: `A competitor was mentioned in your WhatsApp conversation with ${accountName}. Act before the evaluation goes further.`,
      })
    } else {
      const riskLabel = riskLevel === "critical" ? "CRITICAL" : "HIGH"
      subject = `[Nectic] ${riskLabel} signal detected — ${accountName}`

      const quoteLine = topSignalQuote
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:13px;color:#262626;font-style:italic;border-left:3px solid #d4d4d4;padding-left:12px;line-height:1.7;">"${topSignalQuote}"</p></td></tr>`
        : ""

      const draftSection = resolvedDraft
        ? `<tr><td style="padding:0 24px 16px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">AI-drafted WhatsApp response — ready to send</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#14532d;line-height:1.7;">${resolvedDraft}</p>
            </div>
            <p style="margin:8px 0 0;font-size:11px;color:#a3a3a3;">One-click approve and refine in Nectic →</p>
          </td></tr>`
        : ""

      htmlBody = buildEmailHtml({
        headerBg: riskLevel === "critical" ? "#ef4444" : "#f97316",
        headerLabel: "Nectic Alert",
        headerTitle: `${riskLabel} Risk — Action Required`,
        accountName,
        renewalLine: renewalMonth
          ? `<tr><td style="padding:0 24px 8px;"><p style="margin:0;font-size:12px;color:#dc2626;font-weight:600;">Renewal: ${renewalMonth}</p></td></tr>`
          : "",
        signalBlock: `<tr><td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;">
              <tr><td style="padding:14px 16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">${signalCount} signal${signalCount !== 1 ? "s" : ""} detected</p>
                ${topSignalTitle ? `<p style="margin:0;font-size:14px;color:#404040;line-height:1.5;">${topSignalTitle}</p>` : ""}
              </td></tr>
            </table>
          </td></tr>`,
        quoteLine,
        draftSection,
        accountUrl,
        appUrl,
        ctaLabel: "Send response →",
        ctaBg: "#171717",
        footerText: `${accountName} has a ${riskLevel} risk level. The draft above is AI-generated — review before sending.`,
      })
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nectic <alerts@nectic.xyz>",
        to: [email],
        subject,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend error:", err)
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
    }

    // Write lastAlertSentAt to account for the "Alert sent X ago" indicator in the Queue
    if (uid && accountId) {
      try {
        const adminDb = getAdminDb()
        await adminDb
          .collection("users").doc(uid)
          .collection("accounts").doc(accountId)
          .set({ lastAlertSentAt: new Date().toISOString() }, { merge: true })
      } catch { /* non-fatal */ }
    }

    // Push WhatsApp alert to CS lead's own phone via Baileys bridge (non-fatal)
    if (uid) {
      try {
        const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL
        const bridgeSecret = process.env.WHATSAPP_BRIDGE_SECRET
        if (bridgeUrl && bridgeSecret) {
          const adminDb = getAdminDb()
          const sessionSnap = await adminDb.collection("whatsappBridge").doc(uid).get()
          const session = sessionSnap.exists ? sessionSnap.data() : null
          const csPhone = session?.phoneNumber // e.g. "628123456789"

          if (csPhone && session?.status === "connected") {
            const csJid = `${csPhone}@s.whatsapp.net`
            const actionUrl = accountId
              ? `${appUrl}/concept/action/${accountId}`
              : `${appUrl}/concept/board`

            let waAlert: string
            if (isCompetitorAlert && competitorNames?.length) {
              waAlert = `⚡ *${accountName}* mentioned ${competitorNames.join(", ")}\n\n"${topSignalQuote ?? ""}"\n\n→ ${actionUrl}`
            } else {
              const riskLabel = riskLevel === "critical" ? "🔴 CRITICAL" : "🟠 HIGH"
              waAlert = `${riskLabel} · *${accountName}*\n${topSignalTitle ?? "Risk signal detected"}\n\n"${topSignalQuote ?? ""}"\n\n→ ${actionUrl}`
            }

            await fetch(`${bridgeUrl}/session/${uid}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-bridge-secret": bridgeSecret,
              },
              body: JSON.stringify({ jid: csJid, text: waAlert }),
            })
          }
        }
      } catch { /* non-fatal — email already sent */ }
    }

    return NextResponse.json({ sent: true }, { status: 200 })
  } catch (err: unknown) {
    console.error("Notify error:", err)
    return NextResponse.json({ skipped: true }, { status: 200 })
  }
}

function buildEmailHtml({
  headerBg,
  headerLabel,
  headerTitle,
  accountName,
  renewalLine = "",
  signalBlock = "",
  quoteLine = "",
  draftSection = "",
  accountUrl,
  appUrl,
  ctaLabel,
  ctaBg,
  footerText,
}: {
  headerBg: string
  headerLabel: string
  headerTitle: string
  accountName: string
  renewalLine?: string
  signalBlock?: string
  quoteLine?: string
  draftSection?: string
  accountUrl: string
  appUrl: string
  ctaLabel: string
  ctaBg: string
  footerText: string
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr>
          <td style="background:${headerBg};padding:20px 24px;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">${headerLabel}</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${headerTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 24px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">Account</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#171717;">${accountName}</p>
          </td>
        </tr>
        ${renewalLine}
        ${signalBlock}
        ${quoteLine}
        ${draftSection}
        <tr>
          <td style="padding:24px;">
            <a href="${accountUrl}" style="display:inline-block;background:${ctaBg};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">${ctaLabel}</a>
            <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;line-height:1.6;">${footerText}<br>Manage alerts in <a href="${appUrl}/concept/workspace" style="color:#404040;">workspace settings</a>.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
