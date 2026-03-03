# Nectic

**Product intelligence from your sales conversations.**

Nectic is a background agent that reads your WhatsApp sales conversations and delivers a weekly brief to your PM — what customers actually said, clustered by theme, ranked by frequency, without the sales filter.

Built for B2B SaaS product teams in Southeast Asia.

---

## What it does

1. **Connect** — Share your WhatsApp Business number. Nectic connects via the official API.
2. **Monitor** — Nectic reads every customer conversation your sales team has. Automatically.
3. **Brief** — Every Monday, your PM receives a brief: top signals, exact quotes, ranked by frequency and business impact.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** Firebase Authentication
- **Database:** Firestore
- **WhatsApp:** WhatsApp Business Cloud API (Meta)
- **AI:** OpenAI GPT-4o
- **Email:** Resend
- **Styling:** Tailwind CSS

---

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# OpenAI
OPENAI_API_KEY=

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Resend (email)
RESEND_API_KEY=
```

---

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    dashboard/            # PM dashboard (brief viewer)
    auth/                 # Login / Signup
    api/
      whatsapp/webhook/   # WhatsApp Business API webhook
      health/             # Health check
  components/
    ui/                   # shadcn/ui base components
    navigation.tsx
    hero-section.tsx
    how-it-works.tsx
    signal-preview.tsx
    cta-section.tsx
    footer.tsx
  infrastructure/
    firebase/             # Firebase client + server
  contexts/
    auth-context.tsx

_archive/                 # Previous version of Nectic (v1 — finance AI)
docs/strategy/            # Research, competitive analysis, product decisions
```

---

## Roadmap

- [ ] WhatsApp Business API integration (message ingestion)
- [ ] Insight extraction pipeline (GPT-4o)
- [ ] Weekly brief generation + email delivery
- [ ] PM dashboard (brief viewer + signal history)
- [ ] CRM integration (HubSpot, Salesforce)
- [ ] Call recording analysis (Gong, Fireflies)
