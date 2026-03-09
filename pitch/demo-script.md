# Nectic — Demo Script
**Target audience:** Olivia / Antler Indonesia panel
**Total time:** 5 minutes
**Format:** Live product demo on nectic.vercel.app, then Q&A

---

## 0. Before you start (setup)
- [ ] Log in to nectic.vercel.app in a clean browser tab
- [ ] Have the WhatsApp export file ready on desktop (`demo-chat.txt` — real or sanitized)
- [ ] Make sure at least 2 accounts are already analyzed and show **Critical / High** risk
- [ ] Turn off notifications on screen
- [ ] Have the account detail page for one of those accounts pre-loaded in a second tab

---

## 1. Opening hook (30 seconds)

> "I'm going to show you something in 5 minutes that would take a CS team 3 hours to do manually — and they'd still miss half of it."

> "This is a real WhatsApp chat export from a B2B SaaS customer relationship in Indonesia. I'm going to drop it in, and Nectic is going to tell us exactly which account is at risk, why, and what to say — in 60 seconds."

**[Do not touch product yet. Let the tension build.]**

---

## 2. Upload a new account (60 seconds)

> "Let me add a fresh account so you can see the full flow from zero."

1. Click **Upload chat** from the dashboard
2. Drag in the WhatsApp `.txt` export file
3. Fill in account name: **"PT Mitra Digital"**
4. Click **Analyze**

> "While this runs — Nectic is reading every message in this conversation. It's looking for three things: risk signals like complaints or budget hesitation, product signals like repeated feature requests, and relationship signals like response time decay or tone shifts."

> "It does this in Bahasa, Malay, and English. In one pass."

**[Wait for analysis — should take 10–30 seconds]**

5. Result loads — walk through the output:
   - Risk level badge: **Critical / High**
   - Top signal: read it aloud
   - Quote from the actual conversation: **"This is pulled from the real chat. This is not generated."**
   - Recommended action: read the `what` field

> "In 60 seconds, I know this account is at risk, I know exactly which message triggered it, and I know what the right next move is."

---

## 3. The inbox — ready to send (60 seconds)

> "Now here's where it gets operational."

1. Navigate to **Action inbox** (board page)
2. Point to the **Ready to send** section

> "These are accounts where Nectic has already drafted a response — in this team's actual voice. The CS lead doesn't have to write anything. They just review and approve."

3. Open one draft — read the first 2 lines aloud
4. Point to the WATI send button

> "One tap. This sends directly to the customer on WhatsApp via the business API. Not email. Not a separate tool. The customer gets a WhatsApp message from the account manager's number, written in their style, addressing the exact signal that triggered the risk flag."

5. Click **Send** (or simulate if WATI not connected — say "in production this goes directly")

> "Signal resolved. Health score updated. ARR protected — logged."

---

## 4. ARR impact — the closing number (30 seconds)

1. Navigate back to **Dashboard**
2. Point to the **Saved this month** KPI tile

> "This is not a vanity metric. This is calculated from the accounts where all signals were actioned and resolved in the last 30 days, using their actual contract value. For a team managing $2M in ARR across 50 accounts, this number is the only thing that answers the question the VP of Sales asks every Monday: 'What did CS actually save this quarter?'"

---

## 5. Close (30 seconds)

> "That's the full loop: WhatsApp export, AI detection, auto-draft, one-tap send, ARR protected — tracked."

> "If Nectic disappears tomorrow, this team goes back to reading WhatsApp manually, writing responses in Notes, and hoping they remembered to follow up. That is the current state for 90% of B2B SaaS CS teams in Indonesia and Malaysia."

> "We built the system they don't have. And we built it for how they actually work."

**[Stop. Let them respond.]**

---

## Anticipated questions & answers

### "Why would a CS team trust AI-generated responses?"
> "The draft is a starting point, not an autonomous send. The CS lead reads it, edits if needed, and approves before it goes out. We're removing the blank page problem, not the human judgment. The goal is to make the 'do I need to act on this?' decision take 5 seconds instead of 30 minutes."

### "What's your moat? Can Gainsight just add WhatsApp support?"
> "Gainsight's product is built on CRM data structures — Salesforce fields, health score formulas, lifecycle stages. Their model requires a CS ops team to configure it. Our model works from a raw WhatsApp export with zero configuration. Different architecture, different motion, different buyer. And Gainsight's minimum contract is $40K/yr — that's more than the annual ARR of some of our target accounts."

### "What's your unfair advantage in SEA specifically?"
> "WhatsApp Business API in SEA is dominated by BSPs like WATI. We've integrated directly. Our prompt layer understands code-switching in Bahasa + English, which is how Indonesian CS teams actually write. And we're willing to do the unsexy work — parsing messy export files, handling edge cases in conversation structure — that no funded tool wants to deal with."

### "What happens when the customer starts using WhatsApp Business features that change the export format?"
> "We normalize multiple export formats already. Our parser handles iOS and Android exports, group chats, and media-stripped logs. This is exactly the unsexy problem we chose to own."

### "How do you get to 10 pilots?"
> "Direct outreach to CS leads at B2B SaaS companies in Antler's portfolio and network — they're exactly our buyer. We're also targeting companies who've expressed CS pain at SEA startup events. The ask is 30 minutes: upload one account's chat, see a real analysis. No integration required."

### "What's the biggest risk to the thesis?"
> "The honest answer: churn root causes may not be in WhatsApp communication at all — they might be in product quality, pricing mismatch, or sales overpromising. If that's true, our signal detection is accurate but not sufficient to change behavior. The counter is: even if we can't fix the root cause, we can dramatically reduce the lag between 'signal appears' and 'team responds' — and that lag is where most preventable churn happens."

---

## Timing guide

| Section | Time |
|---|---|
| Opening hook | 0:00 – 0:30 |
| Upload + analyze | 0:30 – 1:30 |
| Inbox + send | 1:30 – 2:30 |
| ARR impact | 2:30 – 3:00 |
| Close | 3:00 – 3:30 |
| Q&A | 3:30 – 5:00 |

---

## What NOT to say

- ❌ "It's like Gainsight but for WhatsApp" — don't anchor on a $40K enterprise tool
- ❌ "We use AI to..." — say what it *does*, not that it uses AI
- ❌ "Eventually we'll integrate with CRMs" — don't surface the roadmap gap unprompted
- ❌ "Our TAM is $X billion" — Olivia will pressure-test it; lead with the beachhead instead
- ❌ "We're still building" — everything you demo is live and working

## What to make them feel

- The problem is real and frustrating (they've seen it or know someone who has)
- The loop is complete — nothing is missing, nothing is "coming soon"
- You are the person willing to do the hard, unsexy work in this corner of the market
- The window is open now and closing
