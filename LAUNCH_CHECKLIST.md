# 24-Hour Launch Checklist

## ✅ COMPLETED
- [x] Remove mock data fallbacks - connect to real Firestore
- [x] Fix opportunities service to use Firestore
- [x] Update dashboard to use real data
- [x] Fix assessment service to save opportunities properly

## 🔥 CRITICAL (Must do before launch)

### 1. Environment Variables
- [ ] Set up `.env.local` with all required variables:
  - Firebase config (all 6 variables)
  - Stripe keys (publishable, secret, webhook secret, price IDs)
  - Perplexity API key (optional but recommended)
  - NEXT_PUBLIC_BASE_URL (production URL)

### 2. Firestore Indexes
Create these composite indexes in Firebase Console:
- [ ] `opportunities` collection:
  - Index: `userId` (Ascending) + `createdAt` (Descending)
  - Index: `userId` (Ascending) + `recommended` (Ascending) + `impactScore` (Descending)
  - Index: `userId` (Ascending) + `quickWin` (Ascending) + `impactScore` (Descending)

### 3. Stripe Configuration
- [ ] Create products in Stripe Dashboard:
  - Standard Plan: $249/month (or $199 early access)
  - Premium Plan: $499/month (or $399 early access)
- [ ] Copy Price IDs to `.env.local`
- [ ] Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Add webhook secret to `.env.local`
- [ ] Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 4. Firebase Security Rules
- [ ] Set up Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /assessments/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /opportunities/{opportunityId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5. Error Handling
- [ ] Add try-catch blocks to all API routes
- [ ] Add error boundaries to React components
- [ ] Test error scenarios (network failures, invalid data)

### 6. Testing Critical Flows
- [ ] Sign up flow (email + Google)
- [ ] Complete assessment
- [ ] View opportunities
- [ ] Checkout flow (test mode)
- [ ] Webhook handling (subscription updates)

## 🚀 NICE TO HAVE (Can do post-launch)

- [ ] Add email notifications (Resend/SendGrid)
- [ ] Add analytics (PostHog/Mixpanel)
- [ ] Add error tracking (Sentry)
- [ ] Add loading skeletons
- [ ] Optimize images
- [ ] Add SEO meta tags
- [ ] Create sitemap.xml

## 📋 PRE-LAUNCH CHECKLIST

### Deployment
- [ ] Deploy to Vercel/Production
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production URL
- [ ] Update Stripe webhook URL to production
- [ ] Test production deployment

### Testing
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test payment flow with Stripe test cards
- [ ] Test error scenarios

### Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Create user guide (optional)

## 🎯 POST-LAUNCH

- [ ] Monitor error logs
- [ ] Track user signups
- [ ] Monitor Stripe webhooks
- [ ] Check Firestore usage
- [ ] Monitor API costs (Perplexity)

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Build for production
npm run build

# Test production build locally
npm start
```

## Critical Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STANDARD_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=

# Optional
PERPLEXITY_API_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
