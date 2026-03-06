# Firebase Auth Setup (Required for Google Sign-In)

Auth is proxied through your app domain so redirect works when browsers block third-party storage. You must complete these steps or sign-in will fail with `redirect_uri_mismatch`.

## 1. Google Cloud Console — Add redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Open your **OAuth 2.0 Client ID** (the one used by Firebase — usually "Web client (auto created by Google Service)")
3. Under **Authorized redirect URIs**, add:
   - `https://nectic.vercel.app/__/auth/handler` (production)
   - `https://localhost:3000/__/auth/handler` (local dev)
4. Save

## 2. Firebase Console — Add authorized domain

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication** → **Settings** → **Authorized domains**
2. Add `nectic.vercel.app` (and `localhost` if not already there)

## 3. Deploy

Redeploy after making these changes. Auth should work on desktop and mobile.
