# Quick Fixes Applied

## 1. ESLint Version Fix
- Changed `eslint-config-next` from `16.0.3` to `14.1.0` (compatible with eslint 8)

## 2. Build Timeout Fix
- Firebase Admin SDK now throws clear error during build phase
- All API routes already have `export const dynamic = 'force-dynamic'` which prevents static generation

## 3. To Complete Fix

Run these commands:

```bash
# Fix corrupted node_modules
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Test build
npm run build

# Test dev server
npm run dev
```

The build should now complete without timeouts because:
- API routes are marked as dynamic (no static generation)
- Firebase only initializes at runtime, not during build

