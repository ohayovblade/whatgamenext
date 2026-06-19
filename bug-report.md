# Bug Reports — WhatGameNext Authentication

- **Bug #1** — `passwordHash` leaked in the sign-up response (Day-3 planted bug, fixed)
- **Bug #2** — bcrypt 72-byte truncation → credential-collision auth bypass (Day-4 QA find, fixed)

---

# Bug #1 — `passwordHash` leaked in the sign-up response

**Feature:** User Authentication (WhatGameNext)
**Severity:** 🔴 Critical (security — credential hash disclosure)
**Spec ACs violated:** AC-2 (`passwordHash` never in any response), AC-7 (signup returns the *safe* user shape only)
**Endpoint:** `POST /api/auth/register`
**Found during:** Day 3 manual verification of the sign-up happy path.

---

## 1. Reproduce

**Steps**

```bash
curl -s -X POST http://localhost:3137/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"rian@example.com","password":"supersecret1","name":"Rian"}'
```

**Observed (buggy) — HTTP 201**

```json
{
  "id": 1,
  "email": "rian@example.com",
  "name": "Rian",
  "passwordHash": "$2a$10$kh0e8XDDpRcNwHwiQOLQQuaYkNuEceej2KC/Fx7qZHYGHh/7NKRDW",
  "createdAt": "2026-06-17 02:55:32"
}
```

**Expected**

```json
{ "id": 1, "email": "rian@example.com", "name": "Rian" }
```

The bcrypt hash is sent to the client on every successful registration. It is also
visible in browser devtools / network logs — exactly what AC-2 forbids.

## 2. Diagnose

- **Hypothesis:** the route returns the value it gets back from the data layer
  rather than an explicitly-shaped DTO.
- **Confirmed root cause:** `src/lib/db/users.ts#createUser` returns the full
  `UserRow` (which includes `passwordHash` and `createdAt`), and the route handed
  that object straight to `res.json()`:

  ```ts
  // src/pages/api/auth/register.ts (before)
  const user = createUser({ email, passwordHash, name: displayName });
  res.status(201).json(user); // <-- leaks the whole row
  ```

  The response was *typed* `SafeUser`, but a `UserRow` is structurally assignable
  to `SafeUser` (it has all of `SafeUser`'s fields plus extras), so TypeScript did
  **not** catch the leak — it only shows up at runtime. A typed boundary is not the
  same as a serialized boundary.

## 3. Fix

Minimal, root-cause fix: project the row through the existing `toSafeUser()`
mapper before serializing — never serialize a raw DB row.

```ts
// src/pages/api/auth/register.ts (after)
import { toSafeUser, type SafeUser } from '@/types/user';
...
const user = createUser({ email, passwordHash, name: displayName });
res.status(201).json(toSafeUser(user)); // {id, email, name} only
```

`toSafeUser()` already existed in `src/types/user.ts` (`{ id, email, name }`); the
defect was simply not using it at this boundary. No other layer changed.

**Files modified:** `src/pages/api/auth/register.ts` (2 lines).

## 4. Verify

Re-ran the exact repro against a fresh email:

```bash
curl -s -X POST http://localhost:3137/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify@example.com","password":"supersecret1","name":"Verify"}'
# HTTP 201
# {"id":2,"email":"verify@example.com","name":"Verify"}
```

- ✅ No `passwordHash` (or `createdAt`) in the response — `grep passwordHash` on the
  body returns nothing.
- ✅ Regression check: duplicate email still returns **409**; short password still
  **400**; login + session-scoped backlog still work.
- ✅ `npm run type-check` clean; `npm run build` compiles all routes.

**The `fix:` commit you would create (not committed per request):**

```
[PROJ-#48]fix(auth): stop leaking passwordHash in sign-up response

POST /api/auth/register serialized the raw users row, exposing the
bcrypt hash (AC-2/AC-7). Project the row through toSafeUser() so only
{id, email, name} is returned.
```

---

# Bug #2 — bcrypt 72-byte truncation → credential-collision auth bypass

**Feature:** User Authentication (WhatGameNext)
**Severity:** 🔴 Critical (security — authentication bypass)
**Spec ACs violated:** AC-4 (password rules) + the guarantee that only the registered password authenticates an account
**Endpoints:** `POST /api/auth/register`, login (`authorize` in `src/lib/auth/options.ts`)
**Found during:** Day-4 QA — probing password boundary edge cases. The existing tests covered the *lower* bound (8 / 7 chars) but never the *upper* bound near bcrypt's limit.

---

## 1. Reproduce

bcrypt hashes only the first **72 bytes** of its input and silently discards the
rest. `src/lib/auth/validation.ts` enforced only a *minimum* length (≥ 8), no
maximum — so two passwords sharing the same first 72 bytes hash identically and
authenticate interchangeably.

**Demonstration (`tests/password.test.ts`) — bcrypt ignores everything past 72 bytes:**

```ts
const prefix72 = 'A'.repeat(72);
const hash = await hashPassword(prefix72);
await verifyPassword(prefix72 + 'DIFFERENT_TAIL', hash); // → true  (different password verifies!)
```

**Observed (before fix):**
- A 73-byte password is accepted at signup (`isValidPassword` returns `true`) — no max-length check.
- A login attempt with a *different* password sharing the stored password's 72-byte prefix succeeds.

**Expected:** passwords longer than 72 bytes are rejected at both signup and login, so input is never silently truncated and distinct passwords never collide.

## 2. Diagnose

- **Hypothesis:** login of a *wrong* long password succeeds → the wrong password must hash to the stored hash.
- bcrypt is known to operate on at most **72 bytes** of input and ignore the rest.
- `isValidPassword()` checked `length >= 8` with **no upper bound**, so any length was accepted and handed to bcrypt as-is at signup and login.
- **Root cause:** missing maximum-length validation, combined with bcrypt's 72-byte truncation, collapses many distinct passwords into one effective secret → credential collision → auth bypass for accounts whose password is ≥ 72 bytes.
- **Why not caught earlier:** `validation.test.ts` covered the lower boundary (8 and 7 chars) but never the upper boundary near bcrypt's limit.

## 3. Fix

Reject passwords longer than bcrypt's 72-byte limit at the validation boundary —
applied at **both** signup and login so input is never silently truncated. Minimal
change; no rework of hashing or routes.

```ts
// src/lib/auth/validation.ts (after)
export const MAX_PASSWORD_BYTES = 72;
export function isValidPassword(password: unknown): password is string {
  if (typeof password !== 'string') return false;
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  return Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES; // bytes, not chars
}
```

```ts
// src/lib/auth/options.ts — authorize() (login): reject before bcrypt.compare
if (!isValidPassword(password)) return null;
```

`register.ts` returns a precise `400 "Password must be at most 72 bytes."` for the
over-limit case (the short-password message is unchanged).

**Files modified:** `src/lib/auth/validation.ts`, `src/lib/auth/options.ts`, `src/pages/api/auth/register.ts`.

## 4. Verify

Added Vitest coverage for the boundary that was missing:

```
tests/validation.test.ts
  ✓ accepts a password at exactly the 72-byte maximum
  ✓ rejects a password one byte over the 72-byte maximum
  ✓ measures the limit in bytes, not characters (multi-byte aware)
tests/password.test.ts
  ✓ treats inputs sharing a 72-byte prefix as identical (truncation, hence the cap)
```

- ✅ `npm test` — **32 passed** (4 files); `npm run type-check` clean.
- ✅ Over-limit passwords are now rejected at signup (`400`) and login (no session).

**The `fix:` commit:**

```
fix(auth): reject passwords over bcrypt's 72-byte limit

Passwords sharing a 72-byte prefix collided to one hash (bcrypt
truncation) → auth bypass. Add MAX_PASSWORD_BYTES guard in validation,
enforced at signup and login.
```
