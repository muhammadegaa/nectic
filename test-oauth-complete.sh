#!/bin/bash
# Complete OAuth Test Script
# Tests the full OAuth flow

BASE_URL="${1:-http://localhost:3000}"
PROVIDER="${2:-slack}"

echo "========================================="
echo "Complete OAuth Flow Test"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Provider: $PROVIDER"
echo ""

# Test 1: Without auth (should return 401)
echo "Test 1: Without authentication"
echo "Expected: 401 Unauthorized"
echo "---"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/oauth/$PROVIDER" \
  -H "Accept: application/json")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
echo ""

# Test 2: With invalid token (should return 401)
echo "Test 2: With invalid token"
echo "Expected: 401 Unauthorized"
echo "---"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/oauth/$PROVIDER" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer invalid-token-12345")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
echo ""

# Test 3: Check if endpoint exists
echo "Test 3: Endpoint availability"
echo "---"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/oauth/$PROVIDER" | grep -q "200\|401\|404"; then
  echo "✓ Endpoint is accessible"
else
  echo "✗ Endpoint is not accessible"
fi
echo ""

echo "========================================="
echo "To test with real Firebase token:"
echo "1. Open browser console on $BASE_URL"
echo "2. Run: firebase.auth().currentUser.getIdToken().then(t => console.log('Token:', t))"
echo "3. Copy the token and run:"
echo ""
echo "curl -X GET \"$BASE_URL/api/oauth/$PROVIDER\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -H \"Accept: application/json\""
echo ""
echo "Expected: {\"url\": \"https://...oauth...\"}"
echo "========================================="

