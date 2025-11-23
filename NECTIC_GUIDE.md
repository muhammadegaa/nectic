# Nectic - Complete Guide
## Building a 10X AI Company

**Version:** 1.0  
**Production URL:** `https://nectic.vercel.app`  
**Last Updated:** 2024-11-23

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Production Testing](#production-testing)
3. [Agent Capabilities & Testing](#agent-capabilities--testing)
4. [Architecture](#architecture)
5. [Troubleshooting](#troubleshooting)
6. [Launch Checklist](#launch-checklist)
7. [10X AI Company Standards](#10x-ai-company-standards)

---

## Quick Start

### Production URL
**Base:** `https://nectic.vercel.app`

### Critical Path (5 minutes)
1. **Signup:** `/auth/signup` → Create account → Dashboard
2. **Create Agent:** `/agents/new` → Configure → Create → Chat
3. **Chat:** Send message → Verify response
4. **Health Check:** `/api/health` → Should return `"healthy"`

### Environment Variables (Vercel)
```bash
# Required
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=
OPENAI_API_KEY=

# Optional
SENTRY_DSN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Production Testing

### Why Test in Production
- ✅ Real Firebase connection (no mocking)
- ✅ Real environment variables
- ✅ Catches production-specific issues
- ✅ Most reliable for MVP

### Test 1: User Signup
**URL:** `https://nectic.vercel.app/auth/signup`

**Steps:**
1. Navigate to signup page
2. Fill email, password, confirm password
3. Click "Sign Up"
4. **Expected:** Redirects to dashboard, user logged in

### Test 2: User Login
**URL:** `https://nectic.vercel.app/auth/login`

**Steps:**
1. Navigate to login page
2. Enter credentials → Submit
3. **Expected:** Redirects to dashboard, session persists

### Test 3: Create Agent
**URL:** `https://nectic.vercel.app/agents/new`

**Steps:**
1. Fill name: `Finance Assistant`
2. Select collection: `finance_transactions`
3. Click "Create Agent"
4. **Expected:** Redirects to chat page

### Test 4: Chat with Agent
**URL:** `https://nectic.vercel.app/agents/[agentId]/chat`

**Steps:**
1. Send message: `What are our recent transactions?`
2. **Expected:** Agent responds with data (no 500 errors)

**If 500 error:**
- Check Vercel logs for detailed error
- Verify `OPENAI_API_KEY` is set
- Check Firebase connection

### Test 5: Audit Logs
**URL:** `https://nectic.vercel.app/agents/[agentId]/audit`

**Steps:**
1. After sending chat message
2. Navigate to audit logs
3. **Expected:** Log entries appear

### Test 6: Security
**Steps:**
1. Try `/dashboard` without login → Should redirect
2. Try `/api/agents` without auth → Should return 401
3. Test rate limiting (10+ rapid requests) → Should return 429

### Test 7: Health Check
**URL:** `https://nectic.vercel.app/api/health`

**Expected:** `{"status": "healthy", "checks": {...}}`

---

## Agent Capabilities & Testing

### Using Preview Feature (No Agent Creation Required!)

**Key Feature:** Test all configurations using Preview tab before creating agents!

**URL:** `https://nectic.vercel.app/agents/new` → Click "Preview" tab

### Configuration Options

#### 1. Collections
- **Single:** One collection (e.g., `finance_transactions`)
- **Multiple:** Multiple collections (finance + sales + HR)
- **Combinations:** Test Finance+Sales, Sales+HR, Finance+HR, All

**Test:** Select collections → Preview → Test query → Verify access

#### 2. Model Configuration
- **Provider:** OpenAI, Anthropic, Google
- **Model:** gpt-4o, gpt-4, gpt-3.5-turbo, claude-3-5-sonnet, etc.
- **Temperature:** 0.1 (factual) to 0.9 (creative)
- **Max Tokens:** 500 (short) to 3000 (detailed)

**Test:** Change model → Preview → Note response differences

#### 3. Memory Configuration
- **Type:** Session, Persistent, Episodic
- **Max Turns:** 5-50 messages
- **Learning:** Enable/disable pattern learning

**Test:** Configure memory → Preview with multiple messages → Test context

#### 4. System Prompt
- **Default:** Auto-generated from collections
- **Custom:** Define agent personality
- **Templates:** Data Analyst, Business Advisor, etc.

**Test:** Enter custom prompt → Preview → Verify behavior changes

#### 5. Tools
- **Basic:** query_collection, analyze_data, search_data
- **Powerful:** Finance, Sales, HR, Cross-collection tools
- **Restrictions:** Allow/deny specific tools

**Test:** Select/deselect tools → Preview → Verify tool usage

#### 6. Agentic Configuration
- **Reasoning:** Enable multi-step thinking, show steps
- **Context Memory:** Conversation history, user preferences
- **Cost Optimization:** Smart Engage pre-screening
- **Response Style:** Professional, conversational, technical

**Test:** Enable reasoning → Preview → Verify reasoning steps appear

#### 7. Database Connection
- **External DB:** PostgreSQL, MySQL, MongoDB
- **Connection Test:** Validate before use
- **Table Selection:** Choose tables to access

**Test:** Enter connection → Test → Select tables → Preview

#### 8. OAuth Integrations
- **Slack:** Connect workspace
- **Google Workspace:** Connect services
- **Salesforce:** Connect CRM
- **Multiple:** Connect all needed services

**Test:** Connect service → Authorize → Preview with OAuth tools

#### 9. Workflow Builder
- **Visual Editor:** Drag-and-drop workflow
- **Node Types:** Query, Analyze, Action nodes
- **Connections:** Define execution flow

**Test:** Add nodes → Connect → Configure → Preview

### Complete Testing Workflow

**For each configuration:**
1. Navigate to `/agents/new`
2. Configure specific option
3. Click "Preview" tab
4. Test with relevant query
5. Verify behavior matches configuration
6. Adjust if needed
7. Test again (no agent creation needed!)
8. Create agent only when satisfied

---

## Architecture

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Firebase Firestore
- **AI:** OpenAI GPT-4o (configurable: Anthropic, Google)
- **Auth:** Firebase Authentication
- **Monitoring:** Sentry
- **Rate Limiting:** Upstash Redis (in-memory fallback)

### Security (Implemented)
✅ Server-side authentication (Firebase Admin)  
✅ Rate limiting (10 req/min per user)  
✅ Security headers (HSTS, CSP, X-Frame-Options)  
✅ Input validation  
✅ Error sanitization (no stack traces)  
✅ Field-level access control  
✅ Tool allowlisting  
✅ Audit logging

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── agents/           # Agent pages
│   └── auth/             # Authentication pages
├── components/            # React components
├── contexts/             # React contexts
├── domain/               # Domain layer
├── infrastructure/       # Infrastructure layer
└── lib/                  # Utilities and helpers
```

---

## Troubleshooting

### Chat Returns 500 Error

**Symptoms:**
- Error: "An error occurred while processing your request"
- Status: 500
- No agent response

**Debug Steps:**
1. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Logs
   - Look for "Chat API Error" entries
   - Check error message and stack trace

2. **Verify Environment Variables:**
   - `OPENAI_API_KEY` is set in Vercel
   - `FIREBASE_SERVICE_ACCOUNT_KEY` is set
   - All Firebase variables are set

3. **Check Agent Configuration:**
   - Agent exists in Firestore
   - Agent has collections configured
   - Agent model config is valid

4. **Common Causes:**
   - Missing `OPENAI_API_KEY` → Set in Vercel env vars
   - Invalid Firebase service account → Re-upload key
   - Agent not found → Check agent ID in URL
   - LLM API error → Check OpenAI API status

**Fix:**
- Check Vercel logs for specific error
- Fix based on error message
- Verify all env vars are set

### Audit Logs Show "Unknown" Status

**Issue:** Status column shows "Unknown" instead of ✓ or ✗

**Note:** This is expected for MVP. Logs appearing is what matters. Can be improved post-launch.

### Rate Limiting Not Working

**Issue:** Can send unlimited requests

**Cause:** Upstash Redis not configured, using in-memory fallback

**Fix:** Configure Upstash Redis in Vercel (optional for MVP, in-memory works)

---

## Launch Checklist

### Pre-Launch

**Environment Variables:**
- [ ] All Firebase variables set in Vercel
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` set (single-line JSON)
- [ ] `OPENAI_API_KEY` set
- [ ] `SENTRY_DSN` set (optional but recommended)

**Testing:**
- [ ] Health check returns "healthy"
- [ ] Signup works
- [ ] Login works
- [ ] Agent creation works
- [ ] Chat responds (no 500 errors)
- [ ] Audit logs appear
- [ ] Protected routes require auth

**Security:**
- [ ] Rate limiting working
- [ ] Security headers present
- [ ] API endpoints return 401 without auth

**Monitoring:**
- [ ] Sentry configured
- [ ] Error tracking working
- [ ] Health check monitored

### Launch Day

**Final Checks:**
- [ ] Production build successful
- [ ] All env vars verified
- [ ] Health check returns 200
- [ ] Full user flow tested in production

**Deploy:**
- [ ] Merge to main branch
- [ ] Vercel auto-deploys
- [ ] Verify deployment URL works
- [ ] Test full user flow

### Post-Launch (First Hour)

**Monitoring:**
- [ ] Check Sentry dashboard (no critical errors)
- [ ] Check Vercel logs (no 500 errors)
- [ ] Monitor rate limiting
- [ ] Test with real user account

**Success Metrics (First 24 Hours):**
- **Uptime:** > 99%
- **Error Rate:** < 5%
- **Response Time:** < 2s average
- **User Signups:** Track in Firebase
- **Agent Creation Success Rate:** > 90%

---

## 10X AI Company Standards

### What Makes Top AI Companies 10X Better

Based on industry analysis of OpenAI, Anthropic, Perplexity, and other top AI companies:

### 1. Model Performance & Quality (Critical for AI)

**What Top Companies Do:**
- Continuous model evaluation and benchmarking
- A/B testing for prompts and models
- Quality scoring systems (accuracy, relevance, safety)
- Human feedback loops (RLHF - Reinforcement Learning from Human Feedback)
- Model versioning and rollback capabilities
- Real-time quality monitoring

**Current State:**
✅ Multiple model support  
✅ Custom system prompts  
⏭️ Model performance tracking  
⏭️ Quality scoring  
⏭️ A/B testing infrastructure  
⏭️ Human feedback collection

**Implementation Priority:**
1. **Model Performance Tracking** (Week 1)
   - Track response quality per model
   - Monitor accuracy metrics
   - Compare model performance

2. **Quality Scoring** (Week 2)
   - User satisfaction ratings
   - Response relevance scoring
   - Accuracy tracking

3. **A/B Testing** (Month 1)
   - Test different prompts
   - Test different models
   - Measure conversion/engagement

4. **Human Feedback Loop** (Month 2)
   - Collect user ratings
   - Use feedback to improve prompts
   - Fine-tune based on feedback

### 2. Cost Optimization (Critical for AI)

**What Top Companies Do:**
- Real-time cost tracking per query
- Model selection based on query complexity
- Caching strategies for common queries
- Cost alerts and budgets
- Cost per user tracking
- ROI analysis

**Current State:**
✅ Smart Engage pre-screening  
✅ Cost optimization toggle  
⏭️ Real-time cost tracking  
⏭️ Cost alerts  
⏭️ Cost per user analytics

**Implementation Priority:**
1. **Cost Tracking** (Week 1)
   - Track cost per query
   - Track cost per user
   - Track cost per agent

2. **Cost Alerts** (Week 2)
   - Daily cost summaries
   - Budget alerts
   - Anomaly detection

3. **Cost Analytics** (Month 1)
   - Cost dashboards
   - Cost trends
   - ROI analysis

### 3. Reliability & Safety (Critical for AI)

**What Top Companies Do:**
- Redundancy and failover for AI services
- Circuit breakers for external services
- Content filtering and safety checks
- Audit trails for all AI decisions
- Rate limiting and abuse prevention
- Graceful degradation

**Current State:**
✅ Rate limiting  
✅ Audit logging  
✅ Error handling  
⏭️ Circuit breakers  
⏭️ Content filtering  
⏭️ Failover mechanisms

**Implementation Priority:**
1. **Circuit Breakers** (Week 1)
   - Prevent cascade failures
   - Automatic failover
   - Service health monitoring

2. **Content Filtering** (Week 2)
   - Safety checks
   - Inappropriate content detection
   - PII detection

3. **Failover** (Month 1)
   - Multiple model providers
   - Automatic switching
   - Redundancy

### 4. Monitoring & Observability (Critical for AI)

**What Top Companies Do:**
- Real-time latency monitoring
- Token usage tracking
- Error rate tracking by model
- User satisfaction metrics
- Model performance dashboards
- Query pattern analysis

**Current State:**
✅ Sentry error tracking  
✅ Health check endpoint  
✅ Audit logs  
⏭️ Latency monitoring  
⏭️ Token usage tracking  
⏭️ Performance dashboards

**Implementation Priority:**
1. **Latency Monitoring** (Week 1)
   - Track response times
   - P50, P95, P99 percentiles
   - Alert on slow responses

2. **Token Usage Tracking** (Week 1)
   - Track tokens per query
   - Track tokens per user
   - Cost correlation

3. **Performance Dashboards** (Week 2)
   - Real-time metrics
   - Historical trends
   - Model comparison

### 5. User Experience (Critical for AI)

**What Top Companies Do:**
- Streaming responses (SSE)
- Progressive loading
- Error recovery
- Context management
- Personalization
- Response quality indicators

**Current State:**
✅ Loading states  
✅ Error messages  
⏭️ Streaming responses  
⏭️ Progressive loading  
⏭️ Personalization

**Implementation Priority:**
1. **Streaming Responses** (Week 2)
   - Server-Sent Events (SSE)
   - Progressive text display
   - Better perceived performance

2. **Error Recovery** (Week 2)
   - Automatic retries
   - Fallback responses
   - User-friendly errors

3. **Personalization** (Month 1)
   - User preferences
   - Context learning
   - Customized responses

### 6. Data & Analytics (Critical for AI)

**What Top Companies Do:**
- Query pattern analysis
- User behavior tracking
- Feature usage analytics
- Conversion tracking
- Retention metrics
- Churn analysis

**Current State:**
✅ Basic analytics  
⏭️ Query pattern analysis  
⏭️ User behavior tracking  
⏭️ Feature usage analytics

**Implementation Priority:**
1. **Query Analytics** (Week 1)
   - Most common queries
   - Query patterns
   - Success rates

2. **User Analytics** (Week 2)
   - User journeys
   - Feature adoption
   - Retention tracking

3. **Business Metrics** (Month 1)
   - Conversion rates
   - Revenue per user
   - Lifetime value

### 7. Testing & Quality Assurance (Critical for AI)

**What Top Companies Do:**
- Comprehensive test suites
- Model evaluation benchmarks
- Regression testing
- Load testing
- Chaos engineering
- Continuous integration

**Current State:**
✅ Manual testing guide  
✅ Health check test  
⏭️ Automated test suite  
⏭️ Model evaluation  
⏭️ Load testing

**Implementation Priority:**
1. **Automated Tests** (Week 1-2)
   - Unit tests
   - Integration tests
   - E2E tests

2. **Model Evaluation** (Week 2)
   - Benchmark datasets
   - Quality metrics
   - Regression testing

3. **Load Testing** (Month 1)
   - Performance under load
   - Scalability testing
   - Stress testing

### 8. Documentation & Developer Experience

**What Top Companies Do:**
- Comprehensive API documentation
- SDKs for common languages
- Code examples
- Interactive demos
- Developer portals
- Video tutorials

**Current State:**
✅ This guide  
⏭️ API documentation  
⏭️ SDKs  
⏭️ Code examples

**Implementation Priority:**
1. **API Documentation** (Week 2)
   - OpenAPI/Swagger spec
   - Endpoint documentation
   - Request/response examples

2. **SDKs** (Month 1)
   - Python SDK
   - JavaScript SDK
   - TypeScript SDK

3. **Developer Portal** (Month 2)
   - Interactive docs
   - Code examples
   - Tutorials

### 9. Security & Compliance

**What Top Companies Do:**
- SOC 2 compliance
- GDPR compliance
- Data encryption at rest
- Regular security audits
- Penetration testing
- Bug bounty programs

**Current State:**
✅ Basic security  
✅ Rate limiting  
✅ Security headers  
⏭️ SOC 2 compliance  
⏭️ GDPR compliance  
⏭️ Security audits

**Implementation Priority:**
1. **Security Hardening** (Month 1)
   - Encryption at rest
   - Security audits
   - Penetration testing

2. **Compliance** (Month 2-3)
   - SOC 2 preparation
   - GDPR compliance
   - Data protection

### 10. Scale & Performance

**What Top Companies Do:**
- Auto-scaling infrastructure
- Database query optimization
- Caching strategies
- CDN for static assets
- Load balancing
- Performance budgets

**Current State:**
✅ Basic optimization  
⏭️ Auto-scaling  
⏭️ Query optimization  
⏭️ Caching

**Implementation Priority:**
1. **Performance Optimization** (Month 1)
   - Database indexing
   - Query optimization
   - Caching strategy

2. **Scaling** (Month 2)
   - Auto-scaling
   - Load balancing
   - CDN setup

---

## Roadmap to 10X

### Phase 1: MVP Launch (Current)
✅ Core functionality  
✅ Basic security  
✅ Manual testing  
✅ Error handling  
✅ Monitoring setup

### Phase 2: Foundation (Week 1-2)
- [ ] Fix chat 500 errors
- [ ] Model performance tracking
- [ ] Cost tracking and alerts
- [ ] Latency monitoring
- [ ] Token usage tracking
- [ ] Automated test suite

### Phase 3: Quality (Week 3-4)
- [ ] Quality scoring system
- [ ] A/B testing infrastructure
- [ ] Streaming responses
- [ ] Circuit breakers
- [ ] Content filtering
- [ ] Performance dashboards

### Phase 4: Scale (Month 2)
- [ ] Human feedback loop
- [ ] Query analytics
- [ ] User analytics
- [ ] API documentation
- [ ] SDKs
- [ ] Load testing

### Phase 5: Enterprise (Month 3)
- [ ] SOC 2 compliance
- [ ] Advanced security
- [ ] Enterprise features
- [ ] SLA guarantees
- [ ] Professional support

---

## Quick Reference

### URLs
- **Production:** `https://nectic.vercel.app`
- **Health Check:** `https://nectic.vercel.app/api/health`
- **Signup:** `https://nectic.vercel.app/auth/signup`
- **Login:** `https://nectic.vercel.app/auth/login`
- **Create Agent:** `https://nectic.vercel.app/agents/new`

### Commands
```bash
# Local development
npm run dev

# Production build
npm run build

# Run tests
npm test

# Health check
curl https://nectic.vercel.app/api/health
```

### Support
- **Vercel Logs:** Dashboard → Project → Logs
- **Sentry:** Dashboard → Errors
- **Firebase:** Console → Project

---

**Remember:** Top AI companies focus on model quality, cost efficiency, reliability, and user experience. These are the 10X differentiators.

**Last Updated:** 2024-11-23
