#!/bin/bash
# OAuth Connection Test Script
# Tests OAuth flow locally with curl

BASE_URL="${1:-http://localhost:3000}"
PROVIDER="${2:-slack}"

echo "========================================="
echo "OAuth Connection Test"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Provider: $PROVIDER"
echo ""

# Step 1: Test OAuth initiation endpoint (should require auth)
echo "Step 1: Testing OAuth initiation (without auth - should fail)"
echo "GET $BASE_URL/api/oauth/$PROVIDER"
echo ""
curl -X GET "$BASE_URL/api/oauth/$PROVIDER" \
  -v \
  -H "Accept: application/json" \
  2>&1 | grep -E "(< HTTP|error|Unauthorized)" || echo "Response received"
echo ""
echo ""

# Step 2: Test with mock token (should still fail but show different error)
echo "Step 2: Testing with invalid token"
echo "GET $BASE_URL/api/oauth/$PROVIDER"
echo ""
curl -X GET "$BASE_URL/api/oauth/$PROVIDER" \
  -v \
  -H "Accept: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  2>&1 | grep -E "(< HTTP|error|Unauthorized)" || echo "Response received"
echo ""
echo ""

echo "========================================="
echo "To test with real auth:"
echo "1. Get Firebase ID token from browser console:"
echo "   firebase.auth().currentUser.getIdToken().then(console.log)"
echo ""
echo "2. Run:"
echo "   curl -X GET \"$BASE_URL/api/oauth/$PROVIDER\" \\"
echo "     -H \"Authorization: Bearer YOUR_TOKEN_HERE\" \\"
echo "     -H \"Accept: application/json\""
echo ""
echo "Expected: JSON response with 'url' field containing OAuth URL"
echo "========================================="





