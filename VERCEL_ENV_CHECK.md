# Vercel Environment Variables Checklist

## Required Environment Variables for Nectic

### Firebase Client (Public - for frontend)
These should be set in Vercel with `NEXT_PUBLIC_` prefix:

1. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Get from: Firebase Console → Project Settings → General → Your apps → Web app config
   - Format: `AIza...` (long string)

2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Format: `your-project.firebaseapp.com`
   - Usually: `{project-id}.firebaseapp.com`

3. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Format: Your Firebase project ID (e.g., `my-project-12345`)
   - This is critical for both client and server

4. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Format: `{project-id}.appspot.com`

5. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Format: Numeric ID (e.g., `123456789012`)

6. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Format: `1:123456789012:web:abcdef123456`

### Firebase Admin SDK (Server-side only - NO NEXT_PUBLIC_ prefix)

7. **FIREBASE_SERVICE_ACCOUNT_KEY** (Recommended for Vercel)
   - Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Format: JSON string (entire service account JSON as a single-line string)
   - **Important**: In Vercel, paste the entire JSON object as a single string
   - Example format in Vercel:
     ```
     {"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
     ```

### OpenAI (Server-side only)

8. **OPENAI_API_KEY**
   - Get from: https://platform.openai.com/api-keys
   - Format: `sk-...` (starts with sk-)

### Optional (for future features)

9. **TINKER_API_KEY** (for Tinker training)
   - Only needed if using Tinker integration

## How to Check in Vercel

1. Go to your Vercel project dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Verify all variables above are set
4. Make sure:
   - Variables with `NEXT_PUBLIC_` prefix are available to both client and server
   - Variables WITHOUT `NEXT_PUBLIC_` are server-only (more secure)
   - `FIREBASE_SERVICE_ACCOUNT_KEY` contains the FULL JSON as a single string

## Common Issues

### Issue 1: "Unable to detect a Project Id"
- **Cause**: `FIREBASE_SERVICE_ACCOUNT_KEY` not set or malformed
- **Fix**: 
  - Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is set in Vercel
  - Make sure it's the complete JSON as a single-line string
  - Or ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set

### Issue 2: Firebase Admin SDK not initializing
- **Cause**: Service account key format issue
- **Fix**: 
  - Download service account JSON from Firebase Console
  - Convert to single-line string (remove all newlines)
  - Paste into Vercel environment variable

### Issue 3: Client-side Firebase not working
- **Cause**: Missing `NEXT_PUBLIC_` prefixed variables
- **Fix**: Ensure all 6 `NEXT_PUBLIC_FIREBASE_*` variables are set

## Testing Locally

For local development, you can either:
1. Use `firebase-service-account.json` file in project root (gitignored)
2. Set `FIREBASE_SERVICE_ACCOUNT_KEY` in your local `.env.local` file

## Quick Verification Script

You can add this to verify env vars are loaded (temporarily):

```typescript
// In any API route
console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
console.log('Has Service Account Key:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
console.log('Has OpenAI Key:', !!process.env.OPENAI_API_KEY)
```

