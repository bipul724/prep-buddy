#!/usr/bin/env bash
# T21: API smoke test (docs/API.md + docs/TESTING.md §3). Run after `npm run dev`.
# Needs jq (brew install jq). uuidgen ships with macOS.
set -euo pipefail
BASE="${BASE:-http://localhost:3000}"
pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "1. Health"
[ "$(status "$BASE/api/health")" = 200 ] && pass "GET /api/health → 200" || fail "health is not 200 (is Docker + Ollama up?)"

echo "2. Validation"
[ "$(status -X POST "$BASE/api/profiles" -H 'Content-Type: application/json' -d '{"name":"A","targetRole":"SDE","focusTopics":[]}')" = 400 ] \
  && pass "empty focusTopics → 400" || fail "empty focusTopics should be 400"
[ "$(status -X POST "$BASE/api/sessions" -H 'Content-Type: application/json' -d '{"profileId":"nope"}')" = 404 ] \
  && pass "unknown profileId → 404" || fail "unknown profileId should be 404"

echo "3. Happy path"
PROFILE=$(curl -s -X POST "$BASE/api/profiles" -H 'Content-Type: application/json' \
  -d '{"name":"Aman","targetRole":"SDE-1","focusTopics":["DBMS","OS"]}' | jq -r .profile.id)
[ -n "$PROFILE" ] && [ "$PROFILE" != null ] && pass "profile $PROFILE" || fail "profile not created"

SESSION=$(curl -s -X POST "$BASE/api/sessions" -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$PROFILE\",\"topic\":\"DBMS\"}" | jq -r .session.id)
pass "session $SESSION"

NEXT=$(curl -s -X POST "$BASE/api/sessions/$SESSION/questions/next")
Q=$(echo "$NEXT" | jq -r .question.id)
[ "$Q" != null ] && pass "next question: $(echo "$NEXT" | jq -r .spoken)" || fail "no question: $NEXT"

[ "$(status -X POST "$BASE/api/sessions/$SESSION/attempts" -H 'Content-Type: application/json' -d '{"answer":"x"}')" = 400 ] \
  && pass "attempt without questionId → 400" || fail "missing questionId should be 400"

KEY=$(uuidgen)
FIRST=$(curl -s -X POST "$BASE/api/sessions/$SESSION/attempts" -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" -d "{\"questionId\":\"$Q\",\"answer\":\"It reduces redundancy in tables.\"}")
SCORE=$(echo "$FIRST" | jq -r .feedback.score)
[ "$SCORE" != null ] && pass "graded: score $SCORE" || fail "grading failed: $FIRST"
SECOND=$(curl -s -X POST "$BASE/api/sessions/$SESSION/attempts" -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" -d "{\"questionId\":\"$Q\",\"answer\":\"It reduces redundancy in tables.\"}")
[ "$(echo "$SECOND" | jq -r .replayed)" = true ] && pass "same Idempotency-Key → replayed:true" || fail "not replayed: $SECOND"

SIMILAR=$(curl -s "$BASE/api/questions/$Q/similar")
echo "$SIMILAR" | jq -e '[.questions[].distance] as $d | $d == ($d | sort)' >/dev/null \
  && pass "similar: $(echo "$SIMILAR" | jq '.questions | length') results sorted by distance" || fail "similar not sorted: $SIMILAR"

DONE=$(curl -s -X POST "$BASE/api/sessions/$SESSION/complete")
[ "$(echo "$DONE" | jq '.summary.nextSteps | length')" = 3 ] && pass "complete: 3 next steps, overall $(echo "$DONE" | jq .summary.overallScore)" \
  || fail "summary wrong: $DONE"
[ "$(status -X POST "$BASE/api/sessions/$SESSION/attempts" -H 'Content-Type: application/json' -d "{\"questionId\":\"$Q\",\"answer\":\"x\"}")" = 409 ] \
  && pass "attempt after complete → 409" || fail "should be 409 SESSION_NOT_ACTIVE"

echo "4. Empty session"
EMPTY=$(curl -s -X POST "$BASE/api/sessions" -H 'Content-Type: application/json' -d "{\"profileId\":\"$PROFILE\"}" | jq -r .session.id)
[ "$(curl -s -X POST "$BASE/api/sessions/$EMPTY/complete" | jq -r .session.status)" = ABANDONED ] \
  && pass "0 attempts → ABANDONED" || fail "empty session should be ABANDONED"

echo "All smoke checks passed."
