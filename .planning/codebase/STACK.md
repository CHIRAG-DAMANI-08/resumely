# Resumely — Technology Stack

## Runtime & Language
- **Runtime:** Node.js 20 (Alpine-based Docker image)
- **Language:** TypeScript 5.8.3 (strict mode enabled)
- **Module System:** ESM (`"type": "module"` in package.json)
- **Target:** ES2022

## Framework
- **React Router v7.7.0** (full-stack framework, replaces Remix)
  - Uses `@react-router/dev` for dev tooling
  - Uses `@react-router/node` for Node.js server adapter
  - Uses `@react-router/serve` for production server
  - **SSR enabled** (`ssr: true` in `react-router.config.ts`)
  - File-based routing via `app/routes.ts` (manual route definitions, NOT filesystem convention)
  - Config file: `react-router.config.ts`

## UI Framework
- **React 19.1.0** (latest major version)
- **React DOM 19.1.0**

## Styling
- **TailwindCSS v4.1.4** (the new v4 architecture)
  - Via `@tailwindcss/vite` plugin (v4.1.4)
  - Uses `@theme` directive for custom design tokens
  - Uses `@layer components` for reusable component classes
  - Uses `@utility` directive for custom utilities
- **tw-animate-css v1.3.5** — animation utilities for Tailwind
- **clsx v2.1.1** + **tailwind-merge v3.3.1** — conditional class merging via `cn()` utility
- **Google Fonts:** Inter (via links), Mona Sans (via CSS import)

## Build Tool
- **Vite 6.3.3**
  - Plugins: `tailwindcss()`, `reactRouter()`, `tsconfigPaths()`
  - Path aliases: `~/` → `./app/*` (via tsconfig)
- **vite-tsconfig-paths v5.1.4** — TypeScript path resolution for Vite

## State Management
- **Zustand v5.0.6** — lightweight state management
  - Single store: `usePuterStore` in `app/lib/puter.ts`
  - Manages auth, filesystem, AI, and key-value operations

## Key Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| `pdfjs-dist` | 5.3.93 | PDF parsing & rendering (client-side) |
| `mammoth` | 1.11.0 | DOCX → HTML conversion |
| `html2canvas` | 1.4.1 | HTML → Canvas → PNG conversion |
| `react-dropzone` | 14.3.8 | Drag-and-drop file upload UI |
| `isbot` | 5.1.27 | Bot detection (for SSR) |

## External Platform — Puter.js
- Loaded via CDN: `https://js.puter.com/v2/`
- Provides **cloud-native backend services** (no custom backend needed):
  - `puter.auth` — Authentication (sign in/out, user management)
  - `puter.fs` — Cloud filesystem (upload, read, write, delete files)
  - `puter.ai` — AI chat (uses Claude 3.7 Sonnet for resume analysis)
  - `puter.kv` — Key-value storage (persists resume data, user preferences)

## Package Manager
- **pnpm** (lock file: `pnpm-lock.yaml`)
- Note: Dockerfile uses `npm ci` — mismatch with pnpm

## Containerization
- **Docker** — Multi-stage build
  - Stage 1: Install dev dependencies
  - Stage 2: Install prod dependencies
  - Stage 3: Build
  - Stage 4: Production image (node:20-alpine)
  - Serves via: `npm run start` → `react-router-serve ./build/server/index.js`

## TypeScript Configuration
- **Strict mode:** enabled
- **Path aliases:** `~/*` → `./app/*`
- **Root dirs:** `.` and `./.react-router/types`
- **JSX:** `react-jsx`
- **Module resolution:** `bundler`
- **Global type declarations:** `types/puter.d.ts` (FSItem, PuterUser, KVItem, ChatMessage, AIResponse, etc.)
