# Testing Checklist

**Purpose:** Measure assessment completion rate and opportunity relevance

---

## Assessment Completion Rate Testing

### Metrics to Track
- ✅ `assessment_started` - User begins assessment
- ✅ `assessment_question_completed` - Each question answered
- ✅ `assessment_completed` - Assessment finished successfully
- ✅ `assessment_abandoned` - User leaves without completing

### Calculation
```
Completion Rate = (assessment_completed / assessment_started) * 100
Target: >80%
```

### Test Scenarios
1. **Happy Path:** User completes all questions
   - Expected: `assessment_started` → multiple `assessment_question_completed` → `assessment_completed`
   
2. **Abandonment:** User starts but doesn't finish
   - Expected: `assessment_started` → some `assessment_question_completed` → no `assessment_completed`
   
3. **Skip Logic:** User selects pain point, sees conditional questions
   - Expected: Only relevant questions shown, correct question count tracked

### Analytics Queries (PostHog)
```sql
-- Completion Rate
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'assessment_completed' THEN distinct_id END) * 100.0 / 
  COUNT(DISTINCT CASE WHEN event = 'assessment_started' THEN distinct_id END) as completion_rate
FROM events
WHERE event IN ('assessment_started', 'assessment_completed')

-- Average Completion Time
SELECT AVG(properties.completionTimeSeconds) as avg_completion_time
FROM events
WHERE event = 'assessment_completed'

-- Drop-off Points
SELECT 
  properties.step,
  COUNT(*) as drop_offs
FROM events
WHERE event = 'assessment_question_completed'
GROUP BY properties.step
ORDER BY drop_offs DESC
```

---

## Opportunity Relevance Testing

### Metrics to Track
- ✅ `opportunity_viewed` - User views opportunity detail
- ✅ `opportunity_clicked` - User clicks on opportunity
- ✅ `opportunity_relevant` - User marks as relevant (future feature)
- ✅ `opportunity_irrelevant` - User marks as irrelevant (future feature)

### Calculation
```
Relevance Rate = (opportunity_viewed AND user_engaged) / total_opportunities_shown
Target: >60% engagement
```

### Test Scenarios
1. **Relevant Opportunity:** User views detail, spends time reading
   - Expected: `opportunity_viewed` → high time on page
   
2. **Irrelevant Opportunity:** User views but quickly leaves
   - Expected: `opportunity_viewed` → low time on page
   
3. **Pain Point Match:** Opportunity matches user's selected pain point
   - Expected: Higher engagement for matched opportunities

### Analytics Queries (PostHog)
```sql
-- Opportunity Engagement Rate
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'opportunity_viewed' THEN distinct_id END) * 100.0 / 
  COUNT(DISTINCT CASE WHEN event = 'opportunities_shown' THEN distinct_id END) as engagement_rate
FROM events

-- Pain Point Match Rate
SELECT 
  properties.painPoint,
  AVG(CASE WHEN properties.painPointMatches THEN 1 ELSE 0 END) * 100 as match_rate
FROM events
WHERE event = 'opportunity_viewed'
GROUP BY properties.painPoint
```

---

## Manual Testing Checklist

### Assessment Flow
- [ ] User can start assessment
- [ ] Questions render correctly
- [ ] Skip logic works (only relevant questions shown)
- [ ] Progress bar updates correctly
- [ ] User can navigate back/forward
- [ ] Assessment saves on completion
- [ ] Opportunities generate after completion
- [ ] Dashboard shows opportunities

### Opportunity Relevance
- [ ] Opportunities match selected pain point
- [ ] Opportunities use actual assessment answers
- [ ] Savings/time calculations are reasonable
- [ ] Descriptions are personalized
- [ ] User can view opportunity details
- [ ] User can navigate to implementation guide

---

## Automated Testing (Future)

### Unit Tests
- [ ] Score calculation works with multiple-choice answers
- [ ] Skip logic filters questions correctly
- [ ] Opportunity generation uses correct answers

### Integration Tests
- [ ] Assessment → Opportunities flow works
- [ ] Analytics events fire correctly
- [ ] Data saves to Firestore correctly

---

## Success Criteria

### Assessment Completion Rate
- **Target:** >80%
- **Current:** TBD (needs measurement)
- **Action:** Monitor PostHog dashboard

### Opportunity Relevance
- **Target:** >60% engagement
- **Current:** TBD (needs measurement)
- **Action:** Track opportunity views and engagement

### Completion Time
- **Target:** <3 minutes
- **Current:** TBD (needs measurement)
- **Action:** Track completionTimeSeconds in analytics

---

**Status:** Testing infrastructure ready, metrics tracking implemented

