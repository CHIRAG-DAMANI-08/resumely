# Resumely — Testing

## Current State: NO Automated Tests

There are **zero test files** in the codebase. No testing framework is installed. No test scripts in `package.json`.

## Existing Manual Testing Infrastructure

### Test Data Generator
- **File:** `app/routes/testData.ts`
- **Purpose:** Provides 10 mock company/job data objects for manual upload testing
- **Functions:**
  - `getRandomTestData()` — returns random test company/job data
  - `getAllTestData()` — returns all 10 test datasets
- **Not imported anywhere** — appears to be for developer manual use only

### Mock Test Data Documentation
- **File:** `MOCK_TEST_DATA.md`
- **Purpose:** Instructions for manually testing the upload workflow
- **Contains:** Step-by-step instructions for testing multi-resume uploads
- **Checks:** UUID uniqueness, path uniqueness, console output verification

### Wipe Page
- **Route:** `/wipe`
- **Purpose:** Debug utility to clear all user data
- **Actions:** Lists all Puter.js files, deletes them all, flushes KV store

### Sample Data
- **File:** `constants/index.ts`
- **Contains:** 6 hardcoded `Resume` objects with mock data (used for development reference)
- **Note:** These are NOT used in the live app — they're legacy mock data

## What NEEDS Testing

### Critical Paths (High Priority)
1. **Upload Pipeline** (`upload.tsx` → `handleAnalyze`)
   - File upload to Puter.js filesystem
   - PDF → PNG conversion (client-side)
   - Image upload to Puter.js filesystem
   - AI analysis call and response parsing
   - KV store save/load cycle
   - Navigation to resume detail page

2. **Auth Flow** (`auth.tsx` + auth guards)
   - Puter.js sign-in/sign-out
   - Auth redirect chain (`?next=` parameter)
   - Auth state persistence across page navigation

3. **Resume Loading** (`resume.tsx`)
   - KV data retrieval
   - Blob → objectURL conversion
   - Feedback rendering correctness

### Component Testing (Medium Priority)
- `FileUploader` — file acceptance, size limits, drag-and-drop
- `Accordion` — open/close animation, single/multi mode
- `ScoreCircle` / `ScoreGauge` — SVG rendering at various scores
- `ScoreBadge` — correct color/text for score ranges
- `ATS` — correct icon/gradient based on score thresholds
- `Details` — accordion expansion, tip rendering

### Utility Testing (Low Priority)
- `cn()` — class merging
- `formatSize()` — byte formatting
- `generateUUID()` — UUID generation
- `convertPdfToImage()` — PDF to PNG conversion
- `convertDocToImage()` — DOCX to HTML to PNG conversion

## Recommended Testing Setup

If adding tests, consider:
- **Vitest** (best fit — already using Vite)
- **React Testing Library** (component tests)
- **MSW** (mock Puter.js API calls)
- **Playwright** (e2e tests for full upload → analyze → view flow)

## Environment Challenges for Testing
- Puter.js is loaded via CDN script tag — requires mocking `window.puter`
- PDF.js web worker needs browser/JSDOM environment
- `html2canvas` requires DOM — won't work in Node.js
- All data persists in Puter's cloud KV — no local database to seed/reset
