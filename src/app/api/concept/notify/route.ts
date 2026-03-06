import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 15

export async function POST(req: NextRequest) {
  try {
    const {
      accountName,
      accountId,
      riskLevel,
      signalCount,
      topSignalTitle,
      topSignalQuote,
      competitorNames,
      isCompetitorAlert,
      renewalMonth,
      email,
    } = await req.json() as {
      accountName: string
      accountId?: string
      riskLevel: string
      signalCount: number
      topSignalTitle?: string
      topSignalQuote?: string
      competitorNames?: string[]
      isCompetitorAlert?: boolean
      renewalMonth?: string
      email: string
    }

    if (!accountName || !email) {
      return NextResponse.json({ error: "accountName and email are required" }, { status: 400 })
    }

    // Competitor alerts bypass the riskLevel check
    if (!isCompetitorAlert && riskLevel !== "critical" && riskLevel !== "high") {
      return NextResponse.json({ skipped: true, reason: "riskLevel not critical or high" }, { status: 200 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" }, { status: 200 })
    }

    const accountUrl = accountId
      ? `https://nectic.vercel.app/concept/account/${accountId}`
      : "https://nectic.vercel.app/concept/board"

    let subject: string
    let htmlBody: string

    if (isCompetitorAlert && competitorNames?.length) {
      // ─── Competitor alert template ───────────────────────────────────────────
      const competitorList = competitorNames.join(", ")
      subject = `[Nectic] ⚡ ${accountName} mentioned ${competitorList}`

      const renewalLine = renewalMonth
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:12px;color:#9a3412;font-weight:600;">Renewal: ${renewalMonth} — act before window closes</p></td></tr>`
        : ""

      const quoteLine = topSignalQuote
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:13px;color:#431407;font-style:italic;border-left:3px solid #fdba74;padding-left:12px;line-height:1.7;background:#fff7ed;border-radius:0 6px 6px 0;padding:10px 12px 10px 16px;">"${topSignalQuote}"</p></td></tr>`
        : ""

      htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <!-- Header -->
        <tr>
          <td style="background:#ea580c;padding:20px 24px;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Nectic · Competitive Threat</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">⚡ ${competitorList} Mentioned</p>
          </td>
        </tr>
        <!-- Account -->
        <tr>
          <td style="padding:24px 24px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">Account</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#171717;">${accountName}</p>
          </td>
        </tr>
        ${renewalLine}
        <!-- Quote -->
        ${quoteLine}
        <!-- CTA -->
        <tr>
          <td style="padding:24px;">
            <a href="${accountUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Draft retention response →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;line-height:1.6;">
              A competitor was mentioned in your WhatsApp conversation with ${accountName}. Act before the evaluation goes further.
              <br>Manage alerts in <a href="https://nectic.vercel.app/concept/workspace" style="color:#404040;">workspace settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    } else {
      // ─── Standard risk alert template ────────────────────────────────────────
      const riskLabel = riskLevel === "critical" ? "CRITICAL" : "HIGH"
      subject = `[Nectic] ${riskLabel} signal detected — ${accountName}`

      const quoteLine = topSignalQuote
        ? `<tr><td style="padding:0 24px 16px;"><p style="margin:0;font-size:13px;color:#262626;font-style:italic;border-left:3px solid #d4d4d4;padding-left:12px;line-height:1.7;">"${topSignalQuote}"</p></td></tr>`
        : ""

      htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <!-- Header -->
        <tr>
          <td style="background:${riskLevel === "critical" ? "#ef4444" : "#f97316"};padding:20px 24px;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Nectic Alert</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${riskLabel} Risk Detected</p>
          </td>
        </tr>
        <!-- Account -->
        <tr>
          <td style="padding:24px 24px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">Account</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#171717;">${accountName}</p>
          </td>
        </tr>
        <!-- Signal info -->
        <tr>
          <td style="padding:16px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a3a3a3;letter-spacing:0.5px;text-transform:uppercase;">${signalCount} signal${signalCount !== 1 ? "s" : ""} detected</p>
                  ${topSignalTitle ? `<p style="margin:0;font-size:14px;color:#404040;line-height:1.5;">${topSignalTitle}</p>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Customer quote -->
        ${quoteLine}
        <!-- CTA -->
        <tr>
          <td style="padding:24px;">
            <a href="${accountUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
              Review in Action Queue →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;line-height:1.6;">
              This alert was triggered because ${accountName} has a ${riskLevel} risk level.
              You can manage notification preferences in your <a href="https://nectic.vercel.app/concept/workspace" style="color:#404040;">workspace settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nectic <alerts@nectic.app>",
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

    return NextResponse.json({ sent: true }, { status: 200 })
  } catch (err: unknown) {
    console.error("Notify error:", err)
    return NextResponse.json({ skipped: true }, { status: 200 })
  }
}
