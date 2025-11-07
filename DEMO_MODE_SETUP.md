# Demo Mode Setup

## How to Enable Demo Mode

1. **Add to `.env.local` file** (create it if it doesn't exist):
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   ```
   
   OR set it to "development":
   ```
   NEXT_PUBLIC_DEMO_MODE=development
   ```

2. **Restart your dev server** after adding the env variable:
   ```bash
   npm run dev
   ```

3. **Verify it's working**:
   - Go to `/checkout?plan=premium` or `/checkout?plan=standard`
   - You should see "🎯 Demo Mode Active" banner
   - Check browser console for `[DEMO MODE]` logs
   - Payment form should be replaced with "Continue to Dashboard (Demo Mode)" button

## What Demo Mode Does

- ✅ Bypasses Stripe payment processing
- ✅ Skips API call to create payment intent
- ✅ Shows demo mode UI instead of payment form
- ✅ Redirects directly to dashboard when clicking "Continue"

## Troubleshooting

If demo mode isn't working:

1. **Check `.env.local` exists** and has `NEXT_PUBLIC_DEMO_MODE=true`
2. **Restart dev server** - env vars are only loaded on startup
3. **Check browser console** - you should see `[DEMO MODE] Client check:` logs
4. **Check server logs** - you should see `[DEMO MODE] Server:` logs

## Alternative: Auto-enable in Development

Demo mode automatically enables when `NODE_ENV=development` (which is the default for `npm run dev`), so you don't need to set `NEXT_PUBLIC_DEMO_MODE` if you're running locally.

