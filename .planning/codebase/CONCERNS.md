# Resumely — Technical Concerns

## 🔴 Critical Issues

### 1. Missing TypeScript Types for Core Data
- **`Resume` interface is never formally declared.** It's used as `Resume[]` in `home.tsx` and `resumeCard.tsx` but no interface definition exists. The code relies on implicit typing from `constants/index.ts` mock data, which won't work at runtime since those types are structural.
- **`Feedback` interface** is only defined inside a string template in `constants/index.ts` (the AI prompt). There's no actual TypeScript interface. Components use `any` (`useState<any>(null)` in `resume.tsx`).
- **Impact:** No type safety for the most critical data structures. AI response parsing could silently fail with wrong shapes.
- **Fix:** Create proper `Resume` and `Feedback` interfaces in `types/index.d.ts`.

### 2. AI Response Parsing Is Fragile
- In `upload.tsx` (line 89-93), the AI response is parsed with:
  ```tsx
  const feedbackText = typeof feedback.message.content === 'string'
      ? feedback.message.content
      : feedback.message.content[0].text;
  data.feedback = JSON.parse(feedbackText);
  ```
- **No try/catch around `JSON.parse`** — if the AI returns malformed JSON (which LLMs do regularly), the app crashes silently.
- **No schema validation** — even valid JSON might not match the expected structure.
- **Impact:** Users could lose their upload progress with no recovery.

### 3. No Error Recovery in Upload Pipeline
- The upload flow in `upload.tsx` has no retry logic.
- If any step fails (upload, convert, analyze), the user sees a status text error but:
  - Partially uploaded files are not cleaned up
  - KV entries may be partially written
  - No way to resume or retry
  - User must start over completely

### 4. Typo in Meta Title
- `resume.tsx` line 9: `title: 'Resumind | Review '` should be `'Resumely | Review'`

## 🟡 Moderate Issues

### 5. Puter.js Dependency & Coupling
- The entire app is **100% dependent on Puter.js**. If Puter.js:
  - Changes their API → app breaks
  - Goes down → app is completely non-functional
  - Removes free tier → app becomes unusable
- No abstraction layer between app logic and Puter APIs
- **Mitigation:** The Zustand store (`puter.ts`) does wrap the APIs, but it's tightly coupled to Puter's interface shape

### 6. SSR + Client-Only SDK Mismatch
- React Router has SSR enabled (`ssr: true`)
- But Puter.js only loads client-side via a CDN `<script>` tag
- During SSR, `window.puter` is undefined → all API calls fail
- Current workaround: `getPuter()` check returns `null` on server
- **Risk:** Hydration mismatches, flash of unauthenticated content

### 7. Package Manager Mismatch
- Project uses **pnpm** (has `pnpm-lock.yaml`)
- Dockerfile uses `npm ci` — this will use `package-lock.json` (which doesn't exist)
- **Impact:** Docker builds will fail or install different dependency versions

### 8. Monolithic Zustand Store
- `puter.ts` is 456 lines managing auth + filesystem + AI + KV
- Auth state updates are verbose — every state change recreates the full auth object:
  ```tsx
  set({
      auth: {
          user, isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user,
      }
  });
  ```
- This pattern is repeated 7+ times — very error-prone and duplicative

### 9. Memory Leaks with Object URLs
- `URL.createObjectURL()` is called in `resume.tsx` and `resumeCard.tsx`
- **`URL.revokeObjectURL()` is never called** — blob URLs accumulate in memory
- In `resumeCard.tsx`, every card creates its own blob URL — scrolling many resumes leaks significant memory

### 10. File Upload Uses `fs.upload()` Without User-Scoped Paths
- `puter.fs.upload()` is called with raw files → Puter places them in user's root directory
- Only the **filename** includes userId/uuid for uniqueness
- Over time, user's Puter filesystem gets cluttered with flat files

## 🟢 Minor Issues

### 11. Inconsistent Component Naming
- `ScoreGauge.tsx`, `ScoreBadge.tsx` (PascalCase) vs `scoreCircle.tsx`, `navbar.tsx`, `resumeCard.tsx` (camelCase)
- `resumeCard` component export starts with lowercase (should be PascalCase in React)

### 12. Unused Imports and Dead Code
- `React` imported in `navbar.tsx` and `ATS.tsx` but not needed in modern JSX transform
- `testData.ts` exports functions that are never imported anywhere in the app
- `constants/index.ts` exports `resumes` array that's never used in the live app

### 13. Security: Wipe Page Has No Confirmation
- `/wipe` route deletes ALL user data with a single click
- No confirmation dialog, no "are you sure?" prompt
- Accessible by direct URL navigation

### 14. Hardcoded AI Model
- `app/lib/puter.ts` line 353: `{ model: "claude-3-7-sonnet" }`
- If this model is deprecated or renamed, the AI analysis silently fails
- Should be configurable or use a fallback

### 15. PDF Worker File in Public Directory
- `public/pdf.worker.min.mjs` is 1MB — included in every deployment
- Could be loaded from CDN instead to reduce bundle size

### 16. Mixed Line Endings
- Some files use CRLF (`\r\n`), others use LF (`\n`)
- Not causing bugs but creates noisy diffs

## 🔧 Architectural Suggestions for New Features

### If adding a database/backend:
- Replace `puter.kv` with a proper database (Supabase, Firebase, PostgreSQL)
- Abstract data access into a `services/` or `data/` layer
- Add server-side API routes for data operations

### If adding user management:
- Replace Puter auth with Auth.js or Clerk
- Add role-based access control
- Add user profiles/settings page

### If making it production-ready:
- Add proper error handling with toast notifications
- Add loading skeleton states
- Add retry logic for network failures
- Add comprehensive TypeScript types
- Add automated testing (Vitest + RTL + Playwright)
- Fix Docker to use pnpm
- Add CI/CD pipeline
