#!/bin/bash
# Full project smoke test
set -e
BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
COOKIE="/tmp/mindease-test-cookies.txt"
EMAIL="test$(date +%s)@example.com"
PASS_WORD="TestPass1"

ok() { echo "✅ $1"; PASS=$((PASS+1)); }
fail() { echo "❌ $1 — $2"; FAIL=$((FAIL+1)); }

echo "=== MindEase Full Test @ $BASE ==="
echo ""

# --- Pages ---
for path in "/" "/auth/login" "/auth/signup" "/dashboard" "/chat" "/mood" "/analytics" "/recommendations" "/profile" "/privacy"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  if [ "$code" = "200" ] || [ "$code" = "307" ]; then ok "Page $path ($code)"; else fail "Page $path" "HTTP $code"; fi
done

# --- Health ---
HEALTH=$(curl -s "$BASE/api/health")
if echo "$HEALTH" | grep -q '"status"'; then ok "API /api/health"; else fail "API /api/health" "$HEALTH"; fi

# --- Signup ---
SIGNUP=$(curl -s -X POST "$BASE/api/auth/signup" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$EMAIL\",\"password\":\"$PASS_WORD\"}")
if echo "$SIGNUP" | grep -q '"success":true'; then ok "API /api/auth/signup"; else fail "API /api/auth/signup" "$SIGNUP"; fi

# --- Login (NextAuth) ---
rm -f "$COOKIE"
CSRF=$(curl -s -c "$COOKIE" "$BASE/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null || echo "")
if [ -n "$CSRF" ]; then
  LOGIN=$(curl -s -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASS_WORD" \
    --data-urlencode "redirect=false" \
    --data-urlencode "json=true")
  SESSION=$(curl -s -b "$COOKIE" "$BASE/api/auth/session")
  if echo "$SESSION" | grep -q '"user"'; then ok "Auth login + session"; else fail "Auth login" "session=$SESSION login=$LOGIN"; fi
else
  fail "Auth CSRF" "no token"
fi

# --- Chat (authenticated) ---
CHAT=$(curl -s -b "$COOKIE" -X POST "$BASE/api/chat" -H "Content-Type: application/json" \
  -d '{"message":"Hello, I feel a bit anxious today","sessionId":"test","conversationHistory":[]}')
if echo "$CHAT" | grep -q '"success":true'; then ok "API /api/chat (AI response)"; else fail "API /api/chat" "$CHAT"; fi

# --- Crisis detection ---
CRISIS=$(curl -s -b "$COOKIE" -X POST "$BASE/api/chat" -H "Content-Type: application/json" \
  -d '{"message":"I want to hurt myself","sessionId":"test2","conversationHistory":[]}')
if echo "$CRISIS" | grep -q 'isCrisis":true\|988'; then ok "API /api/chat crisis detection"; else fail "Crisis detection" "$CRISIS"; fi

# --- Mood GET (needs DB - may fail) ---
MOOD_GET=$(curl -s -b "$COOKIE" -w "\n%{http_code}" "$BASE/api/mood")
MOOD_CODE=$(echo "$MOOD_GET" | tail -1)
if [ "$MOOD_CODE" = "200" ]; then ok "API GET /api/mood"; elif [ "$MOOD_CODE" = "500" ]; then echo "⚠️  GET /api/mood — needs PostgreSQL (DATABASE_URL)"; else fail "GET /api/mood" "HTTP $MOOD_CODE"; fi

# --- Mood POST ---
MOOD_POST=$(curl -s -b "$COOKIE" -w "\n%{http_code}" -X POST "$BASE/api/mood" -H "Content-Type: application/json" \
  -d '{"mood":"happy","intensity":7,"note":"Good day"}')
MOOD_PCODE=$(echo "$MOOD_POST" | tail -1)
if [ "$MOOD_PCODE" = "200" ] || [ "$MOOD_PCODE" = "201" ]; then ok "API POST /api/mood"; elif [ "$MOOD_PCODE" = "500" ]; then echo "⚠️  POST /api/mood — needs PostgreSQL"; else fail "POST /api/mood" "HTTP $MOOD_PCODE $(echo "$MOOD_POST" | head -1)"; fi

# --- Recommendations ---
REC=$(curl -s -b "$COOKIE" -w "\n%{http_code}" -X POST "$BASE/api/recommendations" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)\",\"limit\":3}")
REC_CODE=$(echo "$REC" | tail -1)
if [ "$REC_CODE" = "200" ]; then ok "API /api/recommendations"; else fail "API /api/recommendations" "HTTP $REC_CODE"; fi

# --- Analytics ---
ANALYTICS=$(curl -s -b "$COOKIE" -w "\n%{http_code}" -X POST "$BASE/api/analytics" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)\",\"period\":\"week\"}")
AN_CODE=$(echo "$ANALYTICS" | tail -1)
if [ "$AN_CODE" = "200" ]; then ok "API /api/analytics"; elif [ "$AN_CODE" = "500" ]; then echo "⚠️  /api/analytics — may need mood data in DB"; else fail "API /api/analytics" "HTTP $AN_CODE"; fi

# --- User profile ---
PROFILE=$(curl -s -b "$COOKIE" -w "\n%{http_code}" "$BASE/api/user/profile")
PROF_CODE=$(echo "$PROFILE" | tail -1)
if [ "$PROF_CODE" = "200" ]; then ok "API /api/user/profile"; else fail "API /api/user/profile" "HTTP $PROF_CODE"; fi

# --- Unauthorized chat ---
UNAUTH=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d '{"message":"hi"}')
if [ "$UNAUTH" = "401" ]; then ok "API auth protection (401 without login)"; else fail "Auth protection" "expected 401 got $UNAUTH"; fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
