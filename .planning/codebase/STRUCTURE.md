# Resumely — Directory Structure

## Full Tree

```
resumely/
├── .dockerignore                    # Docker build exclusions
├── .gitignore                       # Git exclusions (node_modules, .react-router, build)
├── Dockerfile                       # Multi-stage production Docker build
├── MOCK_TEST_DATA.md                # Manual testing instructions & mock data
├── README.md                        # React Router boilerplate readme
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                   # pnpm lockfile
├── react-router.config.ts           # SSR enabled, framework config
├── tsconfig.json                    # TypeScript strict mode, path aliases
├── vite.config.ts                   # Vite + TailwindCSS + React Router plugins
│
├── app/                             # 📦 Main application code
│   ├── app.css                      # Global styles, design tokens, component classes
│   ├── root.tsx                     # Root layout (Puter SDK load, fonts, error boundary)
│   ├── routes.ts                    # Route definitions (manual, not filesystem)
│   │
│   ├── components/                  # 🧩 Reusable UI components
│   │   ├── Accordion.tsx            # Generic accordion (context-based, single/multi)
│   │   ├── ATS.tsx                  # ATS score card with suggestions list
│   │   ├── BulletRewriter.tsx       # AI-driven bullet point enhancer
│   │   ├── Details.tsx              # Expandable category details (uses Accordion)
│   │   ├── FileUploader.tsx         # Drag-and-drop file upload (react-dropzone)
│   │   ├── JobUrlInput.tsx          # Fast job description parsing via URL
│   │   ├── KeywordGap.tsx           # Missing keyword visualizer against JD
│   │   ├── navbar.tsx               # Top navigation bar with logo + upload link
│   │   ├── resumeCard.tsx           # Resume preview card for dashboard
│   │   ├── ScoreBadge.tsx           # Colored badge ("Strong"/"Good Start"/"Needs Work")
│   │   ├── ScoreCircle.tsx          # SVG circular progress indicator
│   │   ├── ScoreGauge.tsx           # SVG semicircular gauge indicator
│   │   └── Summary.tsx              # Overall score summary with category breakdown
│   │
│   ├── lib/                         # 🔧 Utilities and services
│   │   ├── pdf2img.ts               # PDF→PNG and DOCX→PNG converters (client-side)
│   │   ├── puter.ts                 # 🔑 CORE: Zustand store wrapping Puter.js APIs
│   │   └── utils.ts                 # cn() class merger, formatSize(), generateUUID()
│   │
│   └── routes/                      # 📄 Page components (route modules)
│       ├── 404.tsx                   # Catch-all 404 page
│       ├── auth.tsx                  # Login/logout page
│       ├── compare.tsx               # Side-by-side resume comparison & cross-analysis
│       ├── home.tsx                  # Dashboard — lists all resumes
│       ├── resume.tsx                # Resume detail view with AI feedback
│       ├── testData.ts              # Random test data generator
│       ├── upload.tsx                # 🔑 Upload & analyze workflow
│       └── wipe.tsx                  # Debug: wipe all app data
│
├── constants/                       # 📋 Application constants
│   └── index.ts                     # Mock resumes, AI prompt template, prepareInstructions()
│
├── types/                           # 📝 TypeScript type declarations
│   ├── index.d.ts                   # Empty (unused)
│   └── puter.d.ts                   # Global interfaces: FSItem, PuterUser, KVItem,
│                                    #   ChatMessage, PuterChatOptions, AIResponse
│
├── public/                          # 🌐 Static assets (served as-is)
│   ├── favicon.ico                  # App favicon
│   ├── pdf.worker.min.mjs           # PDF.js web worker (1MB, critical for PDF parsing)
│   │
│   ├── icons/                       # SVG icons
│   │   ├── ats-good.svg             # Green checkmark for ATS
│   │   ├── ats-warning.svg          # Yellow warning for ATS
│   │   ├── ats-bad.svg              # Red X for ATS
│   │   ├── back.svg                 # Back arrow
│   │   ├── check.svg                # Green checkmark
│   │   ├── cross.svg                # Close/remove icon
│   │   ├── info.svg                 # Upload area info icon
│   │   ├── pin.svg                  # Pin icon
│   │   └── warning.svg              # Yellow warning icon
│   │
│   └── images/                      # Raster images and backgrounds
│       ├── bg-auth.svg              # Auth page background
│       ├── bg-main.svg              # Main pages background
│       ├── bg-small.svg             # Resume page sidebar background
│       ├── pdf.png                  # PDF file type icon
│       ├── resume-scan.gif          # Upload scanning animation (large, 1.3MB)
│       ├── resume-scan-2.gif        # Loading animation (smaller, 600KB)
│       ├── resume_01.png            # Sample resume image 1
│       ├── resume_02.png            # Sample resume image 2
│       └── resume_03.png            # Sample resume image 3
│
└── .react-router/                   # 🤖 Auto-generated (React Router type generation)
    └── types/                       # Generated route types
```

## Key File Locations

### Most Important Files (read these first)
1. `app/lib/puter.ts` — The app's "backend wrapper" — ALL Puter.js API calls
2. `app/routes/upload.tsx` — The core workflow (upload → convert → analyze → store)
3. `constants/index.ts` — AI prompt engineering (how the AI analyzes resumes)
4. `app/routes/resume.tsx` — How analysis results are fetched and displayed
5. `types/puter.d.ts` — All global TypeScript interfaces

### Where to add new features
- **New pages:** Create in `app/routes/`, add route to `app/routes.ts`
- **New components:** Create in `app/components/`
- **New utilities:** Add to `app/lib/`
- **New types:** Add to `types/puter.d.ts` or create new `.d.ts` file in `types/`
- **New constants:** Add to `constants/index.ts` or create new module
- **New static assets:** Add to `public/icons/` or `public/images/`

### Naming Conventions
- **Components:** PascalCase filenames (`ScoreGauge.tsx`, `FileUploader.tsx`)
  - Exception: `navbar.tsx`, `resumeCard.tsx`, `scoreCircle.tsx` use camelCase (inconsistent)
- **Routes:** lowercase (`home.tsx`, `upload.tsx`, `resume.tsx`)
- **Utilities:** camelCase (`pdf2img.ts`, `puter.ts`, `utils.ts`)
- **Types:** PascalCase interfaces (`FSItem`, `PuterUser`, `AIResponse`)
