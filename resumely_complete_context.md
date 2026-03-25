# 🎯 Resumely — Complete Codebase Context Document

> **Purpose:** Everything you need to add new features to this codebase using AI. Copy-paste this into any AI assistant for full context.

---

## What Is Resumely?

**Resumely** is an AI-powered resume analyzer web app. Users upload a PDF/DOCX resume, provide a target job title and description, and the app uses **Claude 3.7 Sonnet** (via Puter.js) to analyze the resume and provide detailed ATS scoring and improvement feedback.

### Core User Flow
```
Sign In → Upload Resume PDF → Fill Job Details → AI Analyzes → View Scores & Tips
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│              React UI (Browser)          │
│  React 19 + React Router v7 + Zustand   │
│  TailwindCSS v4 + TypeScript 5.8        │
└──────────────────┬──────────────────────┘
                   │ All API calls client-side
                   ▼
┌─────────────────────────────────────────┐
│            Puter.js Cloud BaaS           │
│  Auth │ Filesystem │ AI │ KV Store       │
└─────────────────────────────────────────┘
```

**Key insight:** This app has **ZERO custom backend code**. Everything — auth, file storage, AI, and data persistence — goes through [Puter.js](https://puter.com), loaded via CDN script tag.

---

## 📁 Project Structure

```
resumely/
├── app/
│   ├── root.tsx              ← Root layout (loads Puter SDK, fonts)
│   ├── routes.ts             ← Route definitions
│   ├── app.css               ← Global styles & design tokens
│   ├── components/
│   │   ├── Accordion.tsx     ← Custom accordion (context-based)
│   │   ├── ATS.tsx           ← ATS score card
│   │   ├── Details.tsx       ← Feedback details (uses Accordion)
│   │   ├── FileUploader.tsx  ← Drag-and-drop upload (react-dropzone)
│   │   ├── navbar.tsx        ← Top nav
│   │   ├── resumeCard.tsx    ← Resume card for dashboard
│   │   ├── ScoreBadge.tsx    ← "Strong"/"Needs Work" badge
│   │   ├── ScoreCircle.tsx   ← SVG circular score
│   │   ├── ScoreGauge.tsx    ← SVG semicircle gauge
│   │   └── Summary.tsx       ← Score summary with categories
│   ├── lib/
│   │   ├── puter.ts          ← ⭐ CORE: Zustand store for ALL Puter APIs
│   │   ├── pdf2img.ts        ← PDF/DOCX → PNG converter (client-side)
│   │   └── utils.ts          ← cn(), formatSize(), generateUUID()
│   └── routes/
│       ├── home.tsx           ← Dashboard (lists resumes)
│       ├── auth.tsx           ← Login page
│       ├── upload.tsx         ← ⭐ Upload & analyze workflow
│       ├── resume.tsx         ← Resume detail + feedback view
│       ├── wipe.tsx           ← Debug: wipe all data
│       ├── testData.ts        ← Mock test data
│       └── 404.tsx            ← 404 page
├── constants/
│   └── index.ts              ← AI prompt template + mock data
├── types/
│   └── puter.d.ts            ← Global types (FSItem, PuterUser, AIResponse, etc.)
├── public/
│   ├── pdf.worker.min.mjs    ← PDF.js worker (1MB)
│   ├── icons/                ← SVG icons (check, warning, ats-good, etc.)
│   └── images/               ← Backgrounds, GIFs, sample images
├── package.json              ← Dependencies
├── vite.config.ts            ← Vite config
├── react-router.config.ts    ← SSR enabled
└── tsconfig.json             ← Strict mode, ~/app/ alias
```

---

## 🔧 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React Router v7.7.0 (SSR enabled) |
| **UI** | React 19.1.0 |
| **Styling** | TailwindCSS v4.1.4 |
| **State** | Zustand 5.0.6 |
| **Language** | TypeScript 5.8.3 (strict) |
| **Build** | Vite 6.3.3 |
| **Auth** | Puter.js Auth |
| **Storage** | Puter.js KV Store + Filesystem |
| **AI** | Puter.js AI (Claude 3.7 Sonnet) |
| **PDF** | pdfjs-dist 5.3.93 |
| **DOCX** | mammoth 1.11.0 |
| **HTML→Image** | html2canvas 1.4.1 |
| **File Upload** | react-dropzone 14.3.8 |
| **Package Mgr** | pnpm |

---

## 🔑 How The App Works (Detailed)

### Routes

| Path | Component | Auth Required | Purpose |
|------|-----------|:---:|---------|
| `/` | [home.tsx](file:///c:/Code/resumely/app/routes/home.tsx) | ✅ | Dashboard — lists all resumes from KV store |
| `/auth` | [auth.tsx](file:///c:/Code/resumely/app/routes/auth.tsx) | ❌ | Puter OAuth sign-in/out |
| `/upload` | [upload.tsx](file:///c:/Code/resumely/app/routes/upload.tsx) | ✅ | Upload resume + job info → AI analysis |
| `/resume/:id` | [resume.tsx](file:///c:/Code/resumely/app/routes/resume.tsx) | ✅ | View resume image + AI feedback |
| `/wipe` | [wipe.tsx](file:///c:/Code/resumely/app/routes/wipe.tsx) | ✅ | Delete all files + KV data |

### Upload & Analysis Pipeline ([upload.tsx](file:///c:/Code/resumely/app/routes/upload.tsx))

```
1. User fills form: companyName, jobTitle, jobDescription
2. User drops/selects PDF file
3. handleAnalyze():
   ├── refreshUser() → get userId
   ├── generateUUID() → resume UUID
   ├── puter.fs.upload([pdf]) → get resumePath
   ├── convertPdfToImage(pdf) → PNG blob (client-side, 4x scale)
   ├── puter.fs.upload([png]) → get imagePath
   ├── kv.set("resume:<uuid>", JSON.stringify({...}))
   ├── kv.set("user:<userId>:latest-resume", uuid)
   ├── puter.ai.feedback(resumePath, instructions)
   │   └── Sends PDF + prompt to Claude 3.7 Sonnet
   │   └── Prompt from constants/index.ts → prepareInstructions()
   ├── Parse AI JSON response
   ├── kv.set("resume:<uuid>", updated data with feedback)
   └── navigate("/resume/<uuid>")
```

### Data Storage (Puter KV)

```
Key Pattern                          Value
─────────────────────────────────    ─────────────
resume:<uuid>                        JSON: { id, resumePath, imagePath, companyName,
                                            jobTitle, jobDescription, feedback }
user:<userId>:latest-resume          UUID string of latest resume
```

### AI Prompt Structure ([constants/index.ts](file:///c:/Code/resumely/constants/index.ts))

The AI receives the resume file + this prompt:
- Role: "ATS and resume analysis expert"
- Input: job title + job description for context
- Output format: JSON matching `Feedback` interface:
  ```ts
  {
    overallScore: number,        // 0-100
    ATS: { score, tips[] },      // tips: { type: "good"|"improve", tip }
    toneAndStyle: { score, tips[] },  // tips: { type, tip, explanation }
    content: { score, tips[] },
    structure: { score, tips[] },
    skills: { score, tips[] },
  }
  ```

---

## 🧩 Key Components

### `usePuterStore` (app/lib/puter.ts) — THE Core Store
```tsx
const { auth, fs, ai, kv, isLoading, error, init } = usePuterStore();

// Auth
auth.isAuthenticated  // boolean
auth.user             // { uuid, username } | null
auth.signIn()         // Opens Puter OAuth popup
auth.signOut()

// Filesystem
fs.upload(files)      // Upload File[] → FSItem
fs.read(path)         // Read → Blob
fs.write(path, data)
fs.readDir(path)
fs.delete(path)

// AI
ai.chat(prompt, options)     // General AI chat
ai.feedback(path, message)   // Send file + message to Claude
ai.img2txt(image)            // Image → text

// Key-Value
kv.set(key, value)
kv.get(key)
kv.list(pattern, returnValues?)
kv.delete(key)
kv.flush()                   // Delete ALL keys
```

### Design System (app/app.css)
```css
/* Custom colors */
--color-dark-200: #475467;
--color-badge-green/red/yellow + text variants

/* Custom utilities */
@utility primary-gradient    /* Blue-purple gradient button */
@utility inset-shadow        /* Blue-tinted inner shadow */
@utility text-gradient       /* Pink-to-purple gradient text */

/* Component classes */
.primary-button, .auth-button, .navbar, .resume-card,
.gradient-border, .main-section, .page-heading
```

---

## ⚠️ Known Issues & Technical Debt

| Severity | Issue |
|----------|-------|
| 🔴 | [Resume](file:///c:/Code/resumely/app/routes/resume.tsx#13-104) and `Feedback` TypeScript interfaces are NOT declared — used as `any` |
| 🔴 | AI JSON response parsing has no try/catch — crashes on malformed output |
| 🔴 | No error recovery/retry in upload pipeline |
| 🟡 | 100% dependent on Puter.js — no abstraction layer |
| 🟡 | SSR enabled but Puter.js is client-only (SSR/hydration mismatch risk) |
| 🟡 | Dockerfile uses `npm ci` but project uses pnpm |
| 🟡 | Object URLs (createObjectURL) are never revoked → memory leaks |
| 🟡 | Monolithic Zustand store (456 lines, repetitive auth state updates) |
| 🟢 | Inconsistent file naming (PascalCase vs camelCase) |
| 🟢 | Typo: [resume.tsx](file:///c:/Code/resumely/app/routes/resume.tsx) meta title says "Resumind" instead of "Resumely" |
| 🟢 | `/wipe` page has no confirmation dialog |
| 🟢 | No automated tests exist |

---

## 📐 Patterns to Follow When Adding Features

### Adding a New Page
1. Create `app/routes/mypage.tsx`
2. Add route to [app/routes.ts](file:///c:/Code/resumely/app/routes.ts): `route('/mypage', 'routes/mypage.tsx')`
3. Add auth guard if needed:
   ```tsx
   useEffect(() => {
     if(!auth.isAuthenticated) navigate('/auth?next=/mypage');
   }, [auth.isAuthenticated]);
   ```
4. Export meta for SEO

### Adding a New Component
1. Create in `app/components/MyComponent.tsx` (PascalCase)
2. Use [cn()](file:///c:/Code/resumely/app/lib/utils.ts#4-7) for conditional classes
3. Use `usePuterStore()` hook for any data access
4. Export as default

### Adding New Data to KV Store
1. Define key pattern: `entity:<uuid>` or `user:<userId>:entity`
2. Always `JSON.stringify()` on save, `JSON.parse()` on load
3. Use `kv.list('entity:*', true)` for listing

### Styling
- Use TailwindCSS classes
- Define reusable classes in [app.css](file:///c:/Code/resumely/app/app.css) under `@layer components`
- Use `@utility` for custom utilities
- Import alias: `~` → `app/`

---

## 🚀 Running the Project

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev        # Starts at http://localhost:5173

# Production build
pnpm run build
pnpm run start      # Serves at port 3000

# Type check
pnpm run typecheck
```

---

## 📋 Feature Ideas (Ready to Implement)

1. **Resume comparison** — compare two resumes side-by-side
2. **Resume history** — track score improvements over time
3. **Export feedback** — download analysis as PDF
4. **Resume templates** — provide starter templates
5. **Job description parser** — paste URL to auto-extract job details
6. **Multi-page PDF** — currently only renders page 1
7. **Dark mode** — design system already has gradient tokens
8. **User profile/settings** — manage account, preferences
9. **Share resume** — generate shareable link
10. **Batch upload** — analyze multiple resumes at once

---

> **Full detailed docs:** See `.planning/codebase/` directory for 7 in-depth documents covering STACK, ARCHITECTURE, STRUCTURE, INTEGRATIONS, CONVENTIONS, TESTING, and CONCERNS.
