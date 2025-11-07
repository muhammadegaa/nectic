# Production Testing Guide

## Enable Demo Mode in Production

To test the full checkout flow in production without processing real payments:

### Step 1: Set Environment Variable

In your production environment (Vercel, Netlify, etc.), add:

```
NEXT_PUBLIC_DEMO_MODE=true
```

### Step 2: Deploy

After setting the environment variable, redeploy your application.

### Step 3: Verify Demo Mode

1. **Visual Indicator**: You'll see a red warning banner at the top of every page: "⚠️ PRODUCTION: Demo Mode Active"
2. **Checkout Flow**: Go to `/checkout?plan=premium` - you'll see demo mode UI instead of Stripe form
3. **Console Logs**: Check browser console for `[DEMO MODE]` logs

### Step 4: Test Full Flow

1. Sign up → `/auth/signup`
2. Complete assessment → `/dashboard/assessment`
3. View opportunities → `/dashboard`
4. Go to checkout → `/checkout?plan=premium`
5. Click "Continue to Dashboard (Demo Mode)" → Should redirect to dashboard

### Step 5: Disable Demo Mode

**IMPORTANT**: After testing, disable demo mode by:

1. Remove or set `NEXT_PUBLIC_DEMO_MODE=false` in your production environment
2. Redeploy

## What Demo Mode Does

✅ **Enabled:**
- Bypasses Stripe payment processing
- Shows demo mode UI in checkout
- Allows full flow testing without payment
- Logs all demo mode actions

❌ **Disabled (Normal Production):**
- Real Stripe payment processing
- Real subscription creation
- Real webhook handling

## Safety Features

- **Visual Warning**: Red banner in production when demo mode is active
- **Console Warnings**: Server and client logs warn when demo mode is enabled in production
- **Easy Toggle**: Just change environment variable and redeploy

## Testing Checklist

- [ ] Sign up flow works
- [ ] Assessment can be completed
- [ ] Opportunities are generated
- [ ] Checkout page shows demo mode UI
- [ ] Demo mode redirects to dashboard
- [ ] Dashboard shows opportunities
- [ ] Free trial banner appears (if applicable)
- [ ] All features accessible without payment

## Troubleshooting

**Demo mode not working?**
1. Check environment variable is set: `NEXT_PUBLIC_DEMO_MODE=true`
2. Verify it's deployed (check Vercel/Netlify env vars)
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
4. Check browser console for `[DEMO MODE]` logs

**Want to test real payments?**
1. Set `NEXT_PUBLIC_DEMO_MODE=false` or remove it
2. Redeploy
3. Use Stripe test cards: `4242 4242 4242 4242`

