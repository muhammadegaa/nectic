# Nectic - AI Automation Opportunities Platform

Fresh start with v0. Ready for code generation.

## Current State

- ✅ Clean src/ structure created
- ✅ Firebase configuration preserved (`src/lib/firebase.ts`, `src/lib/firebase-client.ts`)
- ✅ All dependencies in package.json
- ✅ Next.js, TypeScript, Tailwind configured

## Next Steps

Use v0 to generate the MVP application with these 8 core pages:

1. `/` - Landing page
2. `/auth/login` - Login
3. `/auth/signup` - Signup  
4. `/dashboard` - Main dashboard
5. `/dashboard/assessment` - Assessment (5-7 questions)
6. `/dashboard/opportunities/[id]` - Opportunity detail
7. `/dashboard/settings` - Settings
8. `/checkout` - Stripe checkout

## Firebase Setup

Firebase is already configured. Environment variables needed:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Stripe Setup

Environment variables needed:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Run

```bash
npm install
npm run dev
```

