# Resumely — Architecture

## High-Level Pattern

**Client-heavy SPA with cloud backend-as-a-service (BaaS)**

This is a React Router v7 SSR app, but nearly ALL business logic runs client-side. The server only handles initial HTML rendering and serves static assets. All data persistence, authentication, file storage, and AI processing are delegated to **Puter.js** cloud services.

```
┌────────────────────────────────────────────┐
│                  Browser                    │
│                                            │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │  React UI    │  │  Puter.js SDK      │  │
│  │  Components  │──│  (window.puter)    │  │
│  └──────────────┘  └────────┬───────────┘  │
│         │                   │              │
│  ┌──────┴───────┐          │              │
│  │  Zustand     │          │              │
│  │  Store       │──────────┘              │
│  │  (puter.ts)  │                         │
│  └──────────────┘                         │
└───────────────┬────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│              Puter Cloud                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │ Auth │ │  FS  │ │  AI  │ │ KV Store │  │
│  └──────┘ └──────┘ └──────┘ └──────────┘  │
└────────────────────────────────────────────┘
```

## Application Layers

### Layer 1: Entry Point & Configuration
| File | Purpose |
|------|---------|
| `vite.config.ts` | Build configuration (Vite + TailwindCSS + React Router) |
| `react-router.config.ts` | SSR enabled, default config |
| `app/root.tsx` | Root layout — loads Puter SDK, Google Fonts, initializes auth |
| `app/routes.ts` | Manual route definitions (not filesystem-based) |
| `app/app.css` | Global styles, design tokens, component classes, utility classes |

### Layer 2: State Management (Central Store)
| File | Purpose |
|------|---------|
| `app/lib/puter.ts` | **The core of the app** — Zustand store wrapping ALL Puter.js APIs |

The `usePuterStore` hook is the single source of truth for:
- `auth` — Authentication state + methods (signIn, signOut, refreshUser, checkAuthStatus)
- `fs` — File system operations (write, read, readDir, upload, delete)
- `ai` — AI operations (chat, feedback, img2txt)
- `kv` — Key-value storage operations (get, set, delete, list, flush)
- `isLoading`, `error`, `puterReady` — Global loading/error states

### Layer 3: Routes (Pages)
| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/routes/home.tsx` | Dashboard — lists all uploaded resumes from KV store |
| `/auth` | `app/routes/auth.tsx` | Login/logout page using Puter auth |
| `/upload` | `app/routes/upload.tsx` | **Core workflow** — upload resume, convert to image, analyze with AI |
| `/resume/:id` | `app/routes/resume.tsx` | View resume + AI feedback (split-screen layout) |
| `/compare` | `app/routes/compare.tsx` | Side-by-side comparison of 2 resumes with dynamic cross-JD gap analysis |
| `/wipe` | `app/routes/wipe.tsx` | Admin/debug — wipes all user data (files + KV) |
| `*` | `app/routes/404.tsx` | 404 catch-all |

### Layer 4: Reusable Components
| Component | File | Used By |
|-----------|------|---------|
| `Navbar` | `app/components/navbar.tsx` | home, upload |
| `FileUploader` | `app/components/FileUploader.tsx` | upload |
| `ResumeCard` | `app/components/resumeCard.tsx` | home |
| `ScoreCircle` | `app/components/scoreCircle.tsx` | resumeCard |
| `ScoreGauge` | `app/components/ScoreGauge.tsx` | Summary |
| `ScoreBadge` | `app/components/ScoreBadge.tsx` | Summary |
| `Summary` | `app/components/Summary.tsx` | resume |
| `ATS` | `app/components/ATS.tsx` | resume |
| `Details` | `app/components/Details.tsx` | resume |
| `Accordion` | `app/components/Accordion.tsx` | Details |
| `KeywordGap` | `app/components/KeywordGap.tsx` | resume, compare |
| `BulletRewriter` | `app/components/BulletRewriter.tsx` | resume |

### Layer 5: Utilities & Helpers
| File | Purpose |
|------|---------|
| `app/lib/utils.ts` | `cn()` class merger, `formatSize()`, `generateUUID()` |
| `app/lib/pdf2img.ts` | PDF→PNG and DOCX→PNG conversion (client-side) |
| `constants/index.ts` | Mock resume data, AI prompt template, `prepareInstructions()` |
| `app/routes/testData.ts` | Random test data generator (company/job data for manual testing) |

## Core User Flow (Data Flow)

```
1. User lands on /auth
   └→ Puter.auth.signIn() → OAuth popup → auth state set in Zustand

2. User navigates to /upload
   └→ Fills form: companyName, jobTitle, jobDescription
   └→ Drops/selects PDF file (react-dropzone)
   └→ Clicks "Analyze Resume"

3. Upload Pipeline (app/routes/upload.tsx → handleAnalyze):
   ├→ Refresh user info → get userId
   ├→ Generate UUID for this resume
   ├→ puter.fs.upload([pdfFile]) → get resumePath
   ├→ convertPdfToImage(file) → client-side PNG capture
   ├→ puter.fs.upload([pngFile]) → get imagePath
   ├→ Save initial metadata: kv.set("resume:<uuid>", JSON.stringify({...}))
   ├→ Save user pointer: kv.set("user:<userId>:latest-resume", uuid)
   ├→ puter.ai.feedback(resumePath, instructions) → Claude 3.7 Sonnet analysis
   ├→ Parse AI JSON response → update kv entry with feedback
   └→ Navigate to /resume/<uuid>

4. User views /resume/<uuid>
   ├→ kv.get("resume:<uuid>") → load metadata
   ├→ fs.read(resumePath) → create Blob URL → render link
   ├→ fs.read(imagePath) → create Blob URL → render preview image
   └→ Render feedback: Summary → ATS → Details (accordion)

5. User returns to / (home)
   └→ kv.list("resume:*", true) → load all resumes → render cards

6. User compares resumes (home → /compare)
   ├→ Toggles Compare Mode and selects two resumes
   ├→ Navigate to /compare?r1=<id>&r2=<id>
   ├→ Dynamically fetch metadata + images from KV/FS
   ├→ Target shared JD + Run real-time client OCR (put.ai.img2txt) if gap analysis missing
   └→ Render side-by-side AI textual reviews and visual PDF canvases
```

## Authentication Pattern
- **Guard pattern:** Each protected route checks `auth.isAuthenticated` in a `useEffect`
- **Redirect:** If not authenticated → navigate to `/auth?next=<current_route>`
- **Auth page:** After successful login → navigate to `?next` param value
- **No server-side auth check** — all client-side

## Key Design Decisions

1. **No custom backend** — 100% Puter BaaS removes need for API routes, database, server logic
2. **Client-side PDF rendering** — PDFs are converted to images in the browser, not on a server
3. **Flat KV data model** — No relational database; resumes stored as serialized JSON in KV store
4. **User-scoped file naming** — Files include `userId` and `uuid` in names to avoid collisions
5. **Dynamic Client AI via OCR** — Features like `/compare` cross-pollination and Bullet Rewriter avoid attachment errors by running `ai.img2txt()` locally and piping the text inline to `ai.chat()`.
6. **SSR enabled but minimal** — React Router SSR is on, but Puter.js works purely client-side
7. **Single Zustand store** — One monolithic store handles ALL state (auth + fs + ai + kv)
