# MVP Launch Checklist

## Pre-Launch (Day 2 Morning)

### Testing ✅
- [ ] Run `npm test` - all critical tests pass
- [ ] Test signup flow manually
- [ ] Test login flow manually
- [ ] Test agent creation manually
- [ ] Test chat functionality manually
- [ ] Test OAuth connection (Slack) manually

### Environment Variables
- [ ] All Firebase variables set in Vercel
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` set in Vercel
- [ ] `OPENAI_API_KEY` set in Vercel
- [ ] `SENTRY_DSN` set in Vercel (if using Sentry)
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set (optional, for rate limiting)

### Build & Deploy
- [ ] Run `npm run build` locally - succeeds without errors
- [ ] Run `npm run start` locally - production build works
- [ ] Deploy to Vercel staging/preview
- [ ] Verify production build succeeds on Vercel

### Monitoring
- [ ] Sentry project created and DSN configured
- [ ] Test error reporting in Sentry (trigger a test error)
- [ ] Sentry alerts configured (email notifications)

### Security
- [ ] Security headers verified (check Network tab)
- [ ] Rate limiting working (test with multiple rapid requests)
- [ ] Authentication required on all protected routes

---

## Launch (Day 2 Afternoon)

### Final Checks
- [ ] Production build successful
- [ ] All environment variables verified
- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Signup works in production
- [ ] Login works in production
- [ ] Agent creation works in production
- [ ] Chat works in production

### Deploy
- [ ] Merge to main branch
- [ ] Vercel auto-deploys
- [ ] Verify deployment URL works
- [ ] Test full user flow in production

---

## Post-Launch (First Hour)

### Monitoring
- [ ] Check Sentry dashboard - no critical errors
- [ ] Check Vercel logs - no 500 errors
- [ ] Monitor rate limiting - check for abuse
- [ ] Test with real user account

### Quick Fixes
- [ ] Be ready to hotfix if critical issues found
- [ ] Monitor error rate (should be < 5%)
- [ ] Check response times (should be < 2s)

---

## Success Metrics (First 24 Hours)

- **Uptime:** > 99%
- **Error Rate:** < 5%
- **Response Time:** < 2s average
- **User Signups:** Track in Firebase
- **Agent Creation Success Rate:** > 90%

---

## Rollback Plan

If critical issues found:
1. Revert last commit in Git
2. Vercel will auto-deploy previous version
3. Or manually redeploy previous deployment in Vercel dashboard

---

## Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Firebase Support:** https://firebase.google.com/support
- **Sentry Support:** https://sentry.io/support

---

## Notes

- Rate limiting falls back to in-memory if Upstash not configured (OK for MVP)
- Sentry is optional but recommended
- Focus on core flow: signup → create agent → chat
- Everything else can be fixed post-launch

