# Code Review — WhatGameNext (Day 4)

Review of the Day-3 game-search + backlog feature. Format: `file:line → issue → suggested fix`.
Severity: 🔴 correctness/security · 🟡 maintainability · 🟢 nit.

## Strengths
- Multi-user scoping is correct: every backlog query carries `WHERE "userId" = $1`
  (`db/backlog.ts:41,94,104`) and routes 401 **before** any DB access — the #1 invariant holds.
- `updateBacklogEntry` whitelists patch fields and keeps values parameterized — no SQL injection.
- RAWG key read server-side only; browser never sees it.

## Findings

1. 🟡 `lib/rawg/index.ts:29,61` → `toGame` (mapping) and the URL construction are
   inlined and unexported, so the core search logic has **no test seam**. The function
   also mixes 4 concerns (key read, URL build, fetch, map).
   → **Fix (this PR):** export `toGame` + `mapRawgResults`, extract `buildSearchUrl`.
   Behavior-preserving; enables unit tests. **← refactored in this PR.**

2. 🔴(low) `api/backlog/[id].ts:13` → `isDateOrNull` regex `^\d{4}-\d{2}-\d{2}$`
   accepts impossible calendar dates (`2024-13-45`, `2024-02-31`).
   → Suggest validating with `Date.parse` / range check. *Flagged, not changed
   (out of this refactor's behavior-preserving scope).*

3. 🟡 `api/backlog/index.ts:35` & `api/backlog/[id].ts:28` → the auth guard
   (`getSessionUserId` + 401 + `Number(userId)`) is duplicated across both routes.
   → Suggest a shared `requireUserId(req, res)` helper. *Flagged for a follow-up PR.*

4. 🟢 `api/backlog/index.ts:67` → `status: isBacklogStatus(status) ? status : undefined`
   re-runs the guard already validated at line 57. Minor redundancy; could pass
   `status` directly once validated. *Nit.*

5. 🟢 `lib/rawg/index.ts:52` → `key` interpolated into the URL without `encodeURIComponent`.
   RAWG keys are URL-safe so harmless today; encode for defensiveness. *Nit.*

## Decision
Refactor finding **#1** (testability + concern separation) — highest value, fully
behavior-preserving, unlocks the unit suite. Others logged for follow-up.
