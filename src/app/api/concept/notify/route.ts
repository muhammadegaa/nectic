import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 15

export async function POST(req: NextRequest) {
  try {
    const {
      accountName,
      riskLevel,
      signalCount,
      topSignalTitle,
      email,
    } = await req.json() as {
      accountName: string
      riskLevel: string
      signalCount: number
      topSignalTitle?: string
      email: string
    }

    if (!accountName || !riskLevel || !email) {
      return NextResponse.json({ error: "accountName, riskLevel, and email are required" }, { status: 400 })
    }

    if (riskLevel !== "critical" && riskLevel !== "high") {
      return NextResponse.json({ skipped: true, reason: "riskLevel not critical or high" }, { status: 200 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" }, { status: 200 })
    }

    const riskLabel = riskLevel === "critical" ? "CRITICAL" : "HIGH"
    const subject = `[Nectic] ${riskLabel} signal detected — ${accountName}`

    const htmlBody = `
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
        <!-- CTA -->
        <tr>
          <td style="padding:24px;">
            <a href="https://nectic.vercel.app/concept/board" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
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
