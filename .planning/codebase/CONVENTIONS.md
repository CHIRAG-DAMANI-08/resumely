# Resumely — Code Conventions

## Component Patterns

### Function Components (Arrow Functions)
Most components use arrow function syntax with `const`:
```tsx
const Upload = () => {
    // ...
    return (<main>...</main>);
}
export default Upload;
```

Exception: `Home` and `NotFound` use named function declarations:
```tsx
export default function Home() { ... }
```

### Component Props
Props are destructured inline, often with inline type annotations:
```tsx
const ScoreCircle = ({ score = 75 }: { score: number }) => { ... }
const Summary = ({ feedback }: { feedback: Feedback }) => { ... }
```

For more complex props, interfaces are defined above the component:
```tsx
interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}
const FileUploader = ({ onFileSelect }: FileUploaderProps) => { ... }
```

### Component Exports
Components use `export default` (NOT named exports):
```tsx
export default Upload;
export default ScoreCircle;
```

Exception: `Accordion.tsx` exports multiple named components:
```tsx
export const Accordion = ...
export const AccordionItem = ...
export const AccordionHeader = ...
export const AccordionContent = ...
```

## State Management

### Zustand Store Pattern
Single monolithic store with namespaced sections:
```tsx
const { auth, fs, ai, kv } = usePuterStore();
```

Each namespace mirrors Puter.js API structure:
- `auth.signIn()`, `auth.signOut()`, `auth.isAuthenticated`
- `fs.upload()`, `fs.read()`, `fs.write()`
- `ai.chat()`, `ai.feedback()`, `ai.img2txt()`
- `kv.get()`, `kv.set()`, `kv.list()`, `kv.flush()`

### Local State
Uses React `useState` for page-specific state:
```tsx
const [file, setFile] = useState<File | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [statusText, setStatusText] = useState('');
```

### Side Effects
`useEffect` is used extensively for:
- Auth guards (redirect if not authenticated)
- Data loading on mount
- File URL creation from blob data

## Styling Conventions

### TailwindCSS v4
Uses the new v4 `@theme`, `@layer components`, and `@utility` directives:
```css
@theme {
    --font-sans: "Mona Sans", ui-sans-serif, ...;
    --color-dark-200: #475467;
}

@layer components {
    .primary-button { @apply primary-gradient text-white rounded-full ...; }
}

@utility primary-gradient {
    background: linear-gradient(to bottom, #8e98ff, #606beb);
}
```

### Class Merging
Uses `cn()` utility from `app/lib/utils.ts`:
```tsx
import { cn } from "~/lib/utils";
<div className={cn("base-class", condition && "active-class")} />
```

### Inline Styles
Rarely used — only in `pdf2img.ts` for off-screen DOM elements.

## Import Conventions

### Path Alias
`~` → `./app/` (configured in tsconfig):
```tsx
import { usePuterStore } from "~/lib/puter";
import Navbar from "~/components/navbar";
import { cn } from "~/lib/utils";
```

### Relative Imports
Used for `constants/` (outside `app/`):
```tsx
import { prepareInstructions } from "../../constants";
```

### Route Type Imports
React Router v7 generated types:
```tsx
import type { Route } from "./+types/home";
```

## Error Handling

### Puter API Calls
Wrapped in Zustand store with centralized error handler:
```tsx
const setError = (msg: string) => {
    set({ error: msg, isLoading: false, auth: { ... } });
};
```

Every Puter API call first checks if SDK is available:
```tsx
const puter = getPuter();
if (!puter) {
    setError("Puter.js not available");
    return;
}
```

### Upload Flow
Uses status text for user feedback (no toast/notification system):
```tsx
setStatusText('Uploading the file...');
const uploadedFile = await fs.upload([file]);
if(!uploadedFile) return setStatusText('Error: Failed to upload file');
```

### Error Boundary
React Router `ErrorBoundary` at root level (in `root.tsx`):
- Shows error message for route errors (404, etc.)
- Shows stack trace in dev mode

## TypeScript Patterns

### Global Types (Ambient)
Declared in `types/puter.d.ts` without `export`:
```ts
interface FSItem { ... }
interface PuterUser { ... }
interface AIResponse { ... }
```
These are available globally without import.

### Missing Types
- `Resume` interface is NOT formally declared anywhere — used implicitly via mock data structure in `constants/index.ts`
- `Feedback` interface is only defined inside the AI prompt string (not as a TypeScript interface)
- Components use `any` for feedback: `useState<any>(null)` in `resume.tsx`

### Type Assertions
Used occasionally:
```tsx
const resumes = (await kv.list('resume:*', true)) as KVItem[];
return puter.ai.chat(...) as Promise<AIResponse | undefined>;
```

## Route Meta
Each route exports `meta` for page title/description:
```tsx
export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumely" },
        { name: "description", content: "Smart feedback for your dream job!" },
    ];
}
```

## Naming Inconsistencies
- Component files: Mixed PascalCase/camelCase (`ScoreGauge.tsx` vs `scoreCircle.tsx` vs `navbar.tsx`)
- Component names: `resumeCard` exported as default but starts lowercase
- Route files: all lowercase (consistent)
- Meta title: `resume.tsx` says "Resumind" instead of "Resumely" (typo at line 9)
