# Firebase Auth Setup

## Required env var

`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` must be your Firebase auth domain, e.g. `your-project-id.firebaseapp.com`.

Find it in Firebase Console → Project Settings → Your apps → Firebase SDK snippet.

## Firebase Console

Add your app domain to **Authentication** → **Settings** → **Authorized domains**:
- `nectic.vercel.app` (or your production domain)
- `localhost` (for local dev)
