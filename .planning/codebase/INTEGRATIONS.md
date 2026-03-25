# Resumely — External Integrations

## 1. Puter.js (Primary Backend Platform)

**The entire backend is Puter.js** — this app has ZERO custom server-side logic. All data storage, authentication, AI, and file management are handled by Puter's cloud services.

### Loading Mechanism
- CDN script tag: `<script src="https://js.puter.com/v2/">` in `app/root.tsx`
- Accessed via `window.puter` global
- Wrapper store: `app/lib/puter.ts` (Zustand store with `usePuterStore` hook)
- Initialization: polls for `window.puter` every 100ms, timeout at 10s

### 1a. Puter Authentication (`puter.auth`)
- **Methods used:**
  - `puter.auth.isSignedIn()` — check if user is logged in
  - `puter.auth.getUser()` → returns `{ uuid: string, username: string }`
  - `puter.auth.signIn()` — triggers Puter's OAuth login flow
  - `puter.auth.signOut()` — signs out
- **Usage:** All pages require auth. Unauthenticated users are redirected to `/auth?next=<return_path>`
- **User identity:** `user.uuid` is used for scoping resume data

### 1b. Puter Cloud Filesystem (`puter.fs`)
- **Methods used:**
  - `puter.fs.upload(files)` — upload File/Blob arrays, returns `FSItem` with `path`
  - `puter.fs.read(path)` — returns Blob
  - `puter.fs.write(path, data)` — write string/File/Blob
  - `puter.fs.readdir(path)` — list directory
  - `puter.fs.delete(path)` — delete file
- **Usage patterns:**
  - Resume PDFs uploaded → gets a `path` back (e.g., the uploaded file's Puter path)
  - Resume images (PNG previews) also uploaded
  - Paths stored in KV store for later retrieval
  - Files read back with `fs.read()` → `URL.createObjectURL(blob)`

### 1c. Puter AI (`puter.ai`)
- **Methods used:**
  - `puter.ai.chat(messages, options)` — multi-modal AI chat
  - `puter.ai.img2txt(image)` — image to text (available but not currently used in main flow)
- **Model:** `claude-3-7-sonnet` (hardcoded in `app/lib/puter.ts` line 353)
- **Resume analysis flow:**
  1. Resume PDF uploaded to Puter filesystem
  2. AI receives message with: `{ type: "file", puter_path: <path> }` + `{ type: "text", text: <instructions> }`
  3. Instructions tell AI to analyze resume as ATS expert (defined in `constants/index.ts` `prepareInstructions()`)
  4. AI returns JSON response matching `Feedback` interface
  5. Response parsed and stored in KV
- **AI Prompt structure** (from `constants/index.ts`):
  - System role: ATS and resume analysis expert
  - Takes job title + job description as context
  - Returns structured JSON: `{ overallScore, ATS, toneAndStyle, content, structure, skills }`
  - Each category has `score` (0-100) and `tips[]` with `type: "good"|"improve"`, `tip`, `explanation`

### 1d. Puter Key-Value Store (`puter.kv`)
- **Methods used:**
  - `puter.kv.set(key, value)` — store string value
  - `puter.kv.get(key)` — retrieve value
  - `puter.kv.list(pattern, returnValues?)` — wildcard pattern search
  - `puter.kv.delete(key)` — delete key
  - `puter.kv.flush()` — delete ALL keys (used by wipe page)
- **Key patterns:**
  - `resume:<uuid>` → JSON-serialized resume data (id, resumePath, imagePath, companyName, jobTitle, jobDescription, feedback)
  - `user:<userId>:latest-resume` → UUID of most recent resume
- **Data format stored:**
  ```json
  {
    "id": "uuid",
    "resumePath": "/path/to/resume.pdf",
    "imagePath": "/path/to/image.png",
    "companyName": "Google",
    "jobTitle": "Frontend Developer",
    "jobDescription": "...",
    "feedback": { /* Feedback object */ }
  }
  ```

## 2. Google Fonts
- **Inter:** Loaded via `<link>` tag in `root.tsx` links function
- **Mona Sans:** Loaded via `@import url(...)` in `app.css`
- Both used as primary typefaces

## 3. PDF.js (Local, Client-Side)
- `pdfjs-dist v5.3.93`
- Worker file: `/pdf.worker.min.mjs` served from `public/` directory
- Dynamically imported: `import("pdfjs-dist/build/pdf.mjs")`
- Used in `app/lib/pdf2img.ts` to render PDF first page to canvas at 4x scale

## Summary of Data Flow

```
User uploads PDF
    → puter.fs.upload() stores raw PDF
    → pdf2img.ts converts PDF → PNG (client-side canvas render)
    → puter.fs.upload() stores PNG preview
    → puter.ai.chat() analyzes resume with Claude 3.7 Sonnet
    → puter.kv.set() stores all metadata + AI feedback
    → Navigate to /resume/<uuid>

User views resume
    → puter.kv.get() loads metadata
    → puter.fs.read() loads PDF blob → objectURL for download
    → puter.fs.read() loads PNG blob → objectURL for preview
    → Render feedback components
```
