# Test Plan — WhatGameNext (Day 4 Quality Loop)

**Feature under test:** Game search + backlog domain logic (Day-3 feature code).
**Scope:** Pure/server-only logic in `src/lib/**`. UI components and Next.js route
handlers (which need next-auth + a live Postgres) are out of scope for this unit pass.

**Coverage target:** ≥ 90% statements/branches on the tested `src/lib` modules
(RAWG mapping, auth-boundary validation, backlog status guard).

---

## What we test (tied to acceptance criteria)

| Area | AC ref | Cases | Type |
|------|--------|-------|------|
| RAWG result mapping (`toGame` / `mapRawgResults`) | Game Search | happy path map; year from ISO date; `released = null` → `year = null`; missing genre → `"Unknown"`; null `background_image`; empty/absent `results` → `[]` | happy + edge |
| RAWG search (`searchGames`) | Game Search | missing `RAWG_API_KEY` → throws; empty/whitespace query → `[]` (no fetch); non-OK response → throws with status; OK response → mapped games; correct URL built (search encoded, `page_size=20`) | happy + edge + error |
| Email validation (`isValidEmail`) | AC-4 | valid email; missing `@`; missing domain dot; spaces; non-string; trims surrounding space | happy + edge |
| Password validation (`isValidPassword`) | AC-5 | length ≥ 8 passes; 7 chars fails; non-string fails; boundary at exactly 8 | happy + edge |
| Password hashing (`hashPassword`/`verifyPassword`) | AC-11 | hashes to bcrypt string (not plaintext); verifies a match; rejects a wrong password | happy + error |
| Backlog status guard (`isBacklogStatus`) | Backlog | each of the 4 valid statuses passes; unknown string fails; non-string fails | happy + edge |

## Out of scope (documented, not silently skipped)

- **API route handlers** (`/api/backlog/*`, `/api/games/search`) — require next-auth
  session mocking + a Postgres pool; covered by integration tests, not this unit pass.
- **React components** — visual/interaction layer; no behavior logic worth unit-isolating yet.
- **DB query functions** (`src/lib/db/*`) — thin SQL wrappers; need a live/poolable
  Postgres to test meaningfully. The critical `userId` scoping is asserted by code review here.

## Regression guard

Before declaring green, temporarily break one branch (e.g. flip `year` slice, or
remove the `!key` guard) and confirm the relevant test fails — proves the tests bite.

## Unresolved questions

- Should calendar-invalid dates (`2024-13-45`) be rejected by `isDateOrNull` in
  `api/backlog/[id].ts`? Currently accepted by the regex (flagged in review-notes).
