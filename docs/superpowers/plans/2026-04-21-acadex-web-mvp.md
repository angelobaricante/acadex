# AcaDex Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend UI + structure for the AcaDex web MVP — five screens (Login, Dashboard, File Viewer, Public Share, Impact) populated with mock data, ready for a backend teammate to swap in real APIs via a single service-layer file.

**Architecture:** Vite + React SPA with React Router, Tailwind + shadcn/ui for styling, Zustand for small pockets of global state, and a thin typed service layer that reads from in-memory mock data. Each feature lives in its own folder with self-contained page components; shared UI lives in `components/`; data/services/utils live in `lib/`.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router v6, Zustand, Vitest (tests for pure logic), Inter (via @fontsource/inter), lucide-react (icons), recharts (impact chart).

**Reference spec:** `docs/superpowers/specs/2026-04-21-acadex-web-mvp-design.md`

---

## Task 1: Scaffold Vite + React + TS project

**Files:**
- Create (via scaffolder): `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Scaffold Vite app in-place**

Project root is `/Users/angelobaricante/acadex` and already contains `CLAUDE.md` and `docs/`. Scaffold into the existing directory:

```bash
cd /Users/angelobaricante/acadex
npm create vite@latest . -- --template react-ts
```

When prompted about non-empty directory, pick **"Ignore files and continue"**. This creates `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/App.tsx`, `src/main.tsx`, and default assets.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify the dev server boots**

```bash
npm run dev
```

Expected: Vite prints a URL like `http://localhost:5173/`. Open it — should see the default Vite + React starter page. Stop the dev server with Ctrl+C.

- [ ] **Step 4: Remove Vite starter clutter**

Delete these files/content:
- `src/App.css` (delete file)
- `public/vite.svg` (delete file)
- `src/assets/react.svg` (delete file — if present)

Replace `src/App.tsx` with a minimal shell:

```tsx
function App() {
  return <div>AcaDex</div>;
}

export default App;
```

Replace `src/main.tsx` (keep strict mode, drop `App.css` import):

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Replace `src/index.css` with a minimal placeholder (Tailwind goes in next task):

```css
/* Tailwind directives added in Task 2 */
```

- [ ] **Step 5: Update index.html title and favicon reference**

Edit `index.html`:
- Change `<title>...</title>` to `<title>AcaDex</title>`
- Change `<link rel="icon" ...>` `href` to `/acadex-logo.svg` (file added in Task 4)

- [ ] **Step 6: Verify dev server still boots and renders "AcaDex"**

```bash
npm run dev
```

Expected: page shows the text "AcaDex". Stop the server.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Install and configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind and peers**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 2: Configure Tailwind content paths**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(0 0% 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Add Tailwind directives and theme tokens to `src/index.css`**

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 210 11% 15%;
    --muted: 210 17% 96%;
    --muted-foreground: 215 14% 40%;
    --border: 214 15% 91%;
    --primary: 142 52% 34%;
    --primary-foreground: 0 0% 100%;
    --accent: 38 92% 50%;
    --destructive: 0 72% 51%;
    --ring: 142 52% 34%;
    --radius: 0.5rem;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-size: 14px;
    line-height: 1.5;
  }
}
```

- [ ] **Step 4: Install Inter**

```bash
npm install @fontsource/inter
```

- [ ] **Step 5: Import Inter in `src/main.tsx`**

Add at the top of `src/main.tsx`, above the `./index.css` import:

```tsx
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
```

- [ ] **Step 6: Smoke-test styling**

Temporarily change `src/App.tsx` to verify Tailwind works:

```tsx
function App() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold text-primary">AcaDex</h1>
    </div>
  );
}

export default App;
```

Run `npm run dev`. Expected: "AcaDex" centered, green (Classroom-inspired), using Inter. Stop server.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: configure Tailwind and Inter with theme tokens"
```

---

## Task 3: Configure path aliases and install shadcn/ui

**Files:**
- Modify: `tsconfig.json`, `tsconfig.node.json` (if needed), `vite.config.ts`
- Create: `components.json`, `src/lib/utils.ts`

- [ ] **Step 1: Install path alias dependency**

```bash
npm install -D @types/node
```

- [ ] **Step 2: Set `@/*` alias in `tsconfig.json`**

Add to `compilerOptions` (merge with existing options):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

If using the default Vite scaffold which splits into `tsconfig.app.json`, add `baseUrl` and `paths` to `tsconfig.app.json` instead. The key is that `tsc --noEmit` resolves `@/...` imports.

- [ ] **Step 3: Set `@/*` alias in `vite.config.ts`**

Replace `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Base color: **Neutral** (we already set our own theme tokens — this only affects the initial css; pick any)
- CSS variables: **Yes**
- Components directory: `src/components`
- Utils path: `src/lib/utils`
- Import alias: `@/components`
- Use React Server Components: **No**

This creates `components.json` and `src/lib/utils.ts`. shadcn's init may rewrite `src/index.css` — if it does, manually re-apply the theme tokens from Task 2 Step 3 (the HSL values), keeping any additional shadcn utility layers it added.

- [ ] **Step 5: Install required shadcn primitives**

```bash
npx shadcn@latest add button card dialog dropdown-menu input label badge avatar toast skeleton separator tooltip
```

Each command creates a file under `src/components/ui/`. Accept prompts to install peer deps (Radix packages, class-variance-authority, clsx, tailwind-merge, lucide-react).

- [ ] **Step 6: Install app-specific icon + chart deps**

```bash
npm install lucide-react recharts
```

(lucide-react may already be installed by shadcn — that's fine.)

- [ ] **Step 7: Smoke test**

Replace `src/App.tsx`:

```tsx
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="flex h-full items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-primary">AcaDex</h1>
      <Button>Test</Button>
    </div>
  );
}

export default App;
```

Run `npm run dev`. Expected: heading + a styled green Button. Stop server.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add path alias and install shadcn/ui primitives"
```

---

## Task 4: Add brand assets and preview mocks

**Files:**
- Create: `public/acadex-logo.svg`, `public/mock-previews/README.md`

- [ ] **Step 1: Create a minimal AcaDex logo**

Create `public/acadex-logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="hsl(142 52% 34%)"/>
  <path d="M9 22L16 8l7 14h-3l-1.4-3h-5.2L12 22H9zm5.2-6h3.6L16 12.4 14.2 16z" fill="white"/>
</svg>
```

- [ ] **Step 2: Create preview assets directory with a README placeholder**

Create `public/mock-previews/README.md`:

```markdown
# Mock preview assets

Drop real files here for the viewer demo:

- `sample.pdf` — any PDF (e.g., a lecture handout)
- `lecture.jpg` — any image
- `clip.mp4` — a short MP4 video

These are referenced by `src/lib/mockData.ts`. Fallbacks are used if a file is missing, so the app still renders without them.
```

Actual files (`sample.pdf`, `lecture.jpg`, `clip.mp4`) can be dropped in later by any team member — the app will still render because `FilePreview` handles missing files gracefully (see Task 13).

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "chore: add logo and mock-preview assets folder"
```

---

## Task 5: Shared TypeScript types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export type Role = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type FileKind = "pdf" | "docx" | "pptx" | "image" | "video" | "other";

export interface ArchivedFile {
  id: string;
  name: string;
  kind: FileKind;
  mimeType: string;
  ownerId: string;
  originalBytes: number;
  storedBytes: number;
  compressionRatio: number; // 0..1 (0.82 = 82% saved)
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  previewUrl: string;
  downloadUrl: string;
}

export type SharePermission = "view" | "view_and_download";

export interface ShareLink {
  id: string;
  fileId: string;
  createdBy: string;
  createdAt: string;
  permission: SharePermission;
  expiresAt?: string;
}

export interface ImpactStats {
  totalOriginalBytes: number;
  totalStoredBytes: number;
  bytesSaved: number;
  co2KgAvoided: number;
  pesosSaved: number;
  fileCount: number;
  byKind: Record<FileKind, { count: number; bytesSaved: number }>;
  trend: Array<{ date: string; bytesSaved: number }>;
}

export interface ApiError {
  code: string;
  message: string;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TS types for users, files, sharing, impact"
```

---

## Task 6: Format utilities (TDD)

**Files:**
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `package.json`, `vite.config.ts` (add vitest config)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @types/node
```

- [ ] **Step 2: Add test script to `package.json`**

In `package.json` `scripts`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add Vitest config to `vite.config.ts`**

Replace `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write failing tests for format utilities**

Create `src/lib/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatBytes, formatPercent, formatDate } from "./format";

describe("formatBytes", () => {
  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5_242_880)).toBe("5.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2_147_483_648)).toBe("2.0 GB");
  });
});

describe("formatPercent", () => {
  it("formats a ratio as an integer percent", () => {
    expect(formatPercent(0.82)).toBe("82%");
  });

  it("rounds half up", () => {
    expect(formatPercent(0.825)).toBe("83%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatDate", () => {
  it("formats an ISO string to a short date", () => {
    // 2026-04-10 in a fixed form — avoid locale flakiness by checking contains
    const out = formatDate("2026-04-10T12:00:00Z");
    expect(out).toMatch(/Apr/);
    expect(out).toMatch(/2026/);
  });
});
```

- [ ] **Step 5: Run tests — expect failure**

```bash
npm test
```

Expected: tests fail because `./format` does not exist.

- [ ] **Step 6: Implement `src/lib/format.ts`**

```ts
const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${UNITS[unitIndex]}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts vite.config.ts package.json package-lock.json
git commit -m "feat: add format utils with tests"
```

---

## Task 7: Mock data

**Files:**
- Create: `src/lib/mockData.ts`

- [ ] **Step 1: Create `src/lib/mockData.ts`**

```ts
import type {
  ArchivedFile,
  ImpactStats,
  ShareLink,
  User,
} from "./types";

export const mockUsers: Record<string, User> = {
  student_maria: {
    id: "student_maria",
    name: "Maria Santos",
    email: "maria.santos@students.bsu.edu.ph",
    role: "student",
  },
  faculty_cruz: {
    id: "faculty_cruz",
    name: "Prof. Juan Cruz",
    email: "juan.cruz@bsu.edu.ph",
    role: "faculty",
  },
  admin_reyes: {
    id: "admin_reyes",
    name: "Ana Reyes",
    email: "ana.reyes@bsu.edu.ph",
    role: "admin",
  },
};

function f(
  id: string,
  name: string,
  kind: ArchivedFile["kind"],
  mimeType: string,
  ownerId: string,
  originalBytes: number,
  storedBytes: number,
  tags: string[],
  createdAt: string,
  previewFile?: string
): ArchivedFile {
  const url = previewFile ? `/mock-previews/${previewFile}` : "";
  return {
    id,
    name,
    kind,
    mimeType,
    ownerId,
    originalBytes,
    storedBytes,
    compressionRatio: (originalBytes - storedBytes) / originalBytes,
    tags,
    createdAt,
    updatedAt: createdAt,
    previewUrl: url,
    downloadUrl: url,
  };
}

export const mockFiles: ArchivedFile[] = [
  f("file_001", "CS101 Lecture 01 - Intro.pdf", "pdf", "application/pdf", "faculty_cruz", 47_185_920, 8_912_896, ["CS101", "Lecture", "Week 1"], "2026-04-02T09:00:00Z", "sample.pdf"),
  f("file_002", "CS101 Lecture 02 - Variables.pdf", "pdf", "application/pdf", "faculty_cruz", 52_428_800, 9_437_184, ["CS101", "Lecture", "Week 2"], "2026-04-09T09:00:00Z", "sample.pdf"),
  f("file_003", "CS101 Lecture 03 - Loops.pdf", "pdf", "application/pdf", "faculty_cruz", 41_943_040, 7_340_032, ["CS101", "Lecture", "Week 3"], "2026-04-16T09:00:00Z", "sample.pdf"),
  f("file_004", "Thesis_Draft_v3.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "student_maria", 18_874_368, 3_145_728, ["Thesis", "Draft"], "2026-04-10T14:12:00Z"),
  f("file_005", "Midterm_Slides.pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "faculty_cruz", 88_080_384, 15_728_640, ["CS101", "Midterm", "Slides"], "2026-04-14T10:30:00Z"),
  f("file_006", "Campus_Photo.jpg", "image", "image/jpeg", "admin_reyes", 6_291_456, 1_048_576, ["Campus", "Photo"], "2026-03-22T08:00:00Z", "lecture.jpg"),
  f("file_007", "Lab_Session_Recording.mp4", "video", "video/mp4", "faculty_cruz", 524_288_000, 104_857_600, ["CS101", "Lab", "Recording"], "2026-04-11T15:00:00Z", "clip.mp4"),
  f("file_008", "Student_List_2026.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "admin_reyes", 2_097_152, 262_144, ["Admin", "2026"], "2026-03-15T11:00:00Z"),
  f("file_009", "Research_Paper_Figures.jpg", "image", "image/jpeg", "student_maria", 12_582_912, 2_097_152, ["Research", "Figures"], "2026-04-05T17:00:00Z", "lecture.jpg"),
  f("file_010", "Finals_Schedule.pdf", "pdf", "application/pdf", "admin_reyes", 3_145_728, 524_288, ["Admin", "Finals"], "2026-04-18T12:00:00Z", "sample.pdf"),
  f("file_011", "CS101 Lab 01 Handout.pdf", "pdf", "application/pdf", "faculty_cruz", 9_437_184, 1_572_864, ["CS101", "Lab", "Handout"], "2026-04-03T09:00:00Z", "sample.pdf"),
  f("file_012", "CS101 Lab 02 Handout.pdf", "pdf", "application/pdf", "faculty_cruz", 10_485_760, 1_835_008, ["CS101", "Lab", "Handout"], "2026-04-10T09:00:00Z", "sample.pdf"),
  f("file_013", "Thesis_References.pdf", "pdf", "application/pdf", "student_maria", 5_242_880, 943_718, ["Thesis", "References"], "2026-04-12T18:00:00Z", "sample.pdf"),
  f("file_014", "Orientation_Slides.pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "admin_reyes", 31_457_280, 5_242_880, ["Admin", "Orientation"], "2026-03-01T09:00:00Z"),
  f("file_015", "Project_Demo_Clip.mp4", "video", "video/mp4", "student_maria", 104_857_600, 20_971_520, ["Project", "Demo"], "2026-04-19T20:00:00Z", "clip.mp4"),
  f("file_016", "Textbook_Ch3.pdf", "pdf", "application/pdf", "faculty_cruz", 78_643_200, 13_631_488, ["Textbook", "Chapter"], "2026-02-15T09:00:00Z", "sample.pdf"),
  f("file_017", "Syllabus_CS101.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "faculty_cruz", 1_048_576, 131_072, ["CS101", "Syllabus"], "2026-01-20T08:00:00Z"),
  f("file_018", "Field_Trip_Photo.jpg", "image", "image/jpeg", "student_maria", 8_388_608, 1_310_720, ["Photo", "Field Trip"], "2026-03-30T14:00:00Z", "lecture.jpg"),
  f("file_019", "Exam_Review.pdf", "pdf", "application/pdf", "faculty_cruz", 22_020_096, 3_670_016, ["CS101", "Exam", "Review"], "2026-04-17T11:00:00Z", "sample.pdf"),
  f("file_020", "Announcement.pdf", "pdf", "application/pdf", "admin_reyes", 524_288, 65_536, ["Admin", "Announcement"], "2026-04-20T08:00:00Z", "sample.pdf"),
];

export const mockShareLinks: ShareLink[] = [
  {
    id: "share_abc123",
    fileId: "file_001",
    createdBy: "faculty_cruz",
    createdAt: "2026-04-02T09:05:00Z",
    permission: "view",
  },
  {
    id: "share_def456",
    fileId: "file_005",
    createdBy: "faculty_cruz",
    createdAt: "2026-04-14T10:35:00Z",
    permission: "view_and_download",
  },
];

function computeImpact(files: ArchivedFile[]): ImpactStats {
  const byKind: ImpactStats["byKind"] = {
    pdf: { count: 0, bytesSaved: 0 },
    docx: { count: 0, bytesSaved: 0 },
    pptx: { count: 0, bytesSaved: 0 },
    image: { count: 0, bytesSaved: 0 },
    video: { count: 0, bytesSaved: 0 },
    other: { count: 0, bytesSaved: 0 },
  };
  let totalOriginal = 0;
  let totalStored = 0;
  for (const file of files) {
    totalOriginal += file.originalBytes;
    totalStored += file.storedBytes;
    const slot = byKind[file.kind];
    slot.count += 1;
    slot.bytesSaved += file.originalBytes - file.storedBytes;
  }
  const bytesSaved = totalOriginal - totalStored;

  const trend: ImpactStats["trend"] = [];
  const start = new Date("2026-03-22T00:00:00Z").getTime();
  const dayMs = 86_400_000;
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start + i * dayMs).toISOString().slice(0, 10);
    trend.push({
      date,
      bytesSaved: Math.round((bytesSaved / 30) * (0.7 + Math.random() * 0.6)),
    });
  }

  return {
    totalOriginalBytes: totalOriginal,
    totalStoredBytes: totalStored,
    bytesSaved,
    co2KgAvoided: Math.round((bytesSaved / 1_073_741_824) * 0.5 * 100) / 100,
    pesosSaved: Math.round((bytesSaved / 1_073_741_824) * 23),
    fileCount: files.length,
    byKind,
    trend,
  };
}

export const mockImpact: ImpactStats = computeImpact(mockFiles);
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mockData.ts
git commit -m "feat: add mock users, files, share links, and impact stats"
```

---

## Task 8: Service layer (`api.ts`)

**Files:**
- Create: `src/lib/api.ts`, `src/lib/api.test.ts`

- [ ] **Step 1: Write failing tests for `listFiles` filtering/sorting**

Create `src/lib/api.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { listFiles, getFile, mockSignIn, __resetApiStateForTests } from "./api";

beforeEach(() => {
  __resetApiStateForTests();
});

describe("listFiles", () => {
  it("returns all files with no params", async () => {
    const files = await listFiles();
    expect(files.length).toBeGreaterThan(0);
  });

  it("filters by kind", async () => {
    const files = await listFiles({ kind: "pdf" });
    expect(files.every((f) => f.kind === "pdf")).toBe(true);
  });

  it("filters by tag (case-insensitive)", async () => {
    const files = await listFiles({ tag: "cs101" });
    expect(files.every((f) => f.tags.some((t) => t.toLowerCase() === "cs101"))).toBe(true);
  });

  it("filters by query on name (case-insensitive)", async () => {
    const files = await listFiles({ query: "thesis" });
    expect(files.every((f) => f.name.toLowerCase().includes("thesis"))).toBe(true);
  });

  it("sorts by largest original bytes", async () => {
    const files = await listFiles({ sort: "largest" });
    for (let i = 1; i < files.length; i += 1) {
      expect(files[i - 1].originalBytes).toBeGreaterThanOrEqual(files[i].originalBytes);
    }
  });

  it("sorts by most saved (absolute bytes saved)", async () => {
    const files = await listFiles({ sort: "most_saved" });
    const saved = (f: { originalBytes: number; storedBytes: number }) =>
      f.originalBytes - f.storedBytes;
    for (let i = 1; i < files.length; i += 1) {
      expect(saved(files[i - 1])).toBeGreaterThanOrEqual(saved(files[i]));
    }
  });
});

describe("getFile", () => {
  it("returns a file by id", async () => {
    const file = await getFile("file_001");
    expect(file.id).toBe("file_001");
  });

  it("throws when id is unknown", async () => {
    await expect(getFile("nope")).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("mockSignIn", () => {
  it("returns the student user for 'student' role", async () => {
    const user = await mockSignIn("student");
    expect(user.role).toBe("student");
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: fails because `./api` does not exist.

- [ ] **Step 3: Implement `src/lib/api.ts`**

```ts
import type {
  ArchivedFile,
  FileKind,
  ImpactStats,
  Role,
  ShareLink,
  SharePermission,
  User,
} from "./types";
import {
  mockFiles,
  mockImpact,
  mockShareLinks,
  mockUsers,
} from "./mockData";

const LATENCY_MIN = 200;
const LATENCY_MAX = 400;

function sleep(): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((r) => setTimeout(r, ms));
}

function apiError(code: string, message: string): { code: string; message: string } {
  return { code, message };
}

// --- In-memory state (resettable for tests) ---
let files: ArchivedFile[] = [...mockFiles];
let shareLinks: ShareLink[] = [...mockShareLinks];
let currentUser: User | null = null;

export function __resetApiStateForTests(): void {
  files = [...mockFiles];
  shareLinks = [...mockShareLinks];
  currentUser = null;
}

// --- Auth ---
export async function mockSignIn(role: Role): Promise<User> {
  await sleep();
  const user =
    role === "student"
      ? mockUsers.student_maria
      : role === "faculty"
        ? mockUsers.faculty_cruz
        : mockUsers.admin_reyes;
  currentUser = user;
  return user;
}

export async function signOut(): Promise<void> {
  await sleep();
  currentUser = null;
}

export async function getCurrentUser(): Promise<User | null> {
  await sleep();
  return currentUser;
}

// --- Files ---
export interface ListFilesParams {
  query?: string;
  kind?: FileKind;
  tag?: string;
  ownerId?: string;
  sort?: "recent" | "largest" | "most_saved";
}

export async function listFiles(params: ListFilesParams = {}): Promise<ArchivedFile[]> {
  await sleep();
  let result = [...files];
  if (params.kind) result = result.filter((f) => f.kind === params.kind);
  if (params.ownerId) result = result.filter((f) => f.ownerId === params.ownerId);
  if (params.tag) {
    const t = params.tag.toLowerCase();
    result = result.filter((f) => f.tags.some((tag) => tag.toLowerCase() === t));
  }
  if (params.query) {
    const q = params.query.toLowerCase();
    result = result.filter(
      (f) => f.name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  const sort = params.sort ?? "recent";
  if (sort === "recent") {
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "largest") {
    result.sort((a, b) => b.originalBytes - a.originalBytes);
  } else if (sort === "most_saved") {
    result.sort(
      (a, b) => b.originalBytes - b.storedBytes - (a.originalBytes - a.storedBytes)
    );
  }
  return result;
}

export async function getFile(id: string): Promise<ArchivedFile> {
  await sleep();
  const file = files.find((f) => f.id === id);
  if (!file) throw apiError("not_found", `File ${id} not found`);
  return file;
}

function detectKind(file: File): { kind: FileKind; mime: string } {
  const mime = file.type || "application/octet-stream";
  if (mime === "application/pdf") return { kind: "pdf", mime };
  if (mime.startsWith("image/")) return { kind: "image", mime };
  if (mime.startsWith("video/")) return { kind: "video", mime };
  if (file.name.endsWith(".docx")) return { kind: "docx", mime };
  if (file.name.endsWith(".pptx")) return { kind: "pptx", mime };
  return { kind: "other", mime };
}

export async function uploadFile(file: File): Promise<ArchivedFile> {
  await sleep();
  const { kind, mime } = detectKind(file);
  const originalBytes = file.size;
  const storedBytes = Math.round(originalBytes * (0.15 + Math.random() * 0.15));
  const url = URL.createObjectURL(file);
  const now = new Date().toISOString();
  const uploader = currentUser?.id ?? "admin_reyes";
  const archived: ArchivedFile = {
    id: `upload_${Date.now()}`,
    name: file.name,
    kind,
    mimeType: mime,
    ownerId: uploader,
    originalBytes,
    storedBytes,
    compressionRatio: (originalBytes - storedBytes) / originalBytes,
    tags: ["Uploaded"],
    createdAt: now,
    updatedAt: now,
    previewUrl: url,
    downloadUrl: url,
  };
  files = [archived, ...files];
  return archived;
}

export async function deleteFile(id: string): Promise<void> {
  await sleep();
  const before = files.length;
  files = files.filter((f) => f.id !== id);
  if (files.length === before) throw apiError("not_found", `File ${id} not found`);
}

// --- Sharing ---
export async function createShareLink(
  fileId: string,
  permission: SharePermission
): Promise<ShareLink> {
  await sleep();
  const file = files.find((f) => f.id === fileId);
  if (!file) throw apiError("not_found", `File ${fileId} not found`);
  const link: ShareLink = {
    id: `share_${Math.random().toString(36).slice(2, 10)}`,
    fileId,
    createdBy: currentUser?.id ?? file.ownerId,
    createdAt: new Date().toISOString(),
    permission,
  };
  shareLinks = [link, ...shareLinks];
  return link;
}

export async function getShareLink(
  shareId: string
): Promise<{ link: ShareLink; file: ArchivedFile }> {
  await sleep();
  const link = shareLinks.find((l) => l.id === shareId);
  if (!link) throw apiError("not_found", `Share ${shareId} not found`);
  const file = files.find((f) => f.id === link.fileId);
  if (!file) throw apiError("not_found", `File ${link.fileId} missing`);
  return { link, file };
}

export async function revokeShareLink(shareId: string): Promise<void> {
  await sleep();
  const before = shareLinks.length;
  shareLinks = shareLinks.filter((l) => l.id !== shareId);
  if (shareLinks.length === before) throw apiError("not_found", `Share ${shareId} not found`);
}

// --- Impact ---
export async function getImpactStats(): Promise<ImpactStats> {
  await sleep();
  return mockImpact;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/api.test.ts
git commit -m "feat: add service layer backed by mock data"
```

---

## Task 9: Zustand stores

**Files:**
- Create: `src/lib/store.ts`

- [ ] **Step 1: Install Zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Create `src/lib/store.ts`**

```ts
import { create } from "zustand";
import type { User } from "./types";

interface SessionState {
  user: User | null;
  setUser: (u: User | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

interface UIState {
  uploadDialogOpen: boolean;
  shareDialog: { open: boolean; fileId?: string };
  openUpload: () => void;
  closeUpload: () => void;
  openShare: (fileId: string) => void;
  closeShare: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  uploadDialogOpen: false,
  shareDialog: { open: false },
  openUpload: () => set({ uploadDialogOpen: true }),
  closeUpload: () => set({ uploadDialogOpen: false }),
  openShare: (fileId) => set({ shareDialog: { open: true, fileId } }),
  closeShare: () => set({ shareDialog: { open: false } }),
}));
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/store.ts package.json package-lock.json
git commit -m "feat: add zustand session and UI stores"
```

---

## Task 10: Router skeleton with placeholder pages

**Files:**
- Create: `src/routes.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/dashboard/DashboardPage.tsx`, `src/features/viewer/ViewerPage.tsx`, `src/features/share/SharePage.tsx`, `src/features/impact/ImpactPage.tsx`, `src/features/misc/NotFoundPage.tsx`, `src/components/layout/AuthGuard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install React Router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Create placeholder feature pages**

Each file should contain a minimal component named after the file. Example for `src/features/auth/LoginPage.tsx`:

```tsx
export default function LoginPage() {
  return <div className="p-6">Login</div>;
}
```

Create the same shape — one-liner body with matching label — for:
- `src/features/dashboard/DashboardPage.tsx` → `<div className="p-6">Dashboard</div>`
- `src/features/viewer/ViewerPage.tsx` → `<div className="p-6">Viewer</div>`
- `src/features/share/SharePage.tsx` → `<div className="p-6">Share</div>`
- `src/features/impact/ImpactPage.tsx` → `<div className="p-6">Impact</div>`
- `src/features/misc/NotFoundPage.tsx` → `<div className="p-6">Not found</div>`

- [ ] **Step 3: Create `src/components/layout/AuthGuard.tsx`**

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSessionStore } from "@/lib/store";

export default function AuthGuard() {
  const user = useSessionStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

- [ ] **Step 4: Create `src/routes.tsx`**

```tsx
import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "@/components/layout/AuthGuard";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ViewerPage from "@/features/viewer/ViewerPage";
import SharePage from "@/features/share/SharePage";
import ImpactPage from "@/features/impact/ImpactPage";
import NotFoundPage from "@/features/misc/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/s/:shareId", element: <SharePage /> },
  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/file/:id", element: <ViewerPage /> },
      { path: "/impact", element: <ImpactPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
```

- [ ] **Step 5: Wire router into `src/App.tsx`**

Replace `src/App.tsx`:

```tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
```

(If `@/components/ui/toaster` export path differs in your shadcn version, import the actual exported component from `src/components/ui/toaster.tsx`.)

- [ ] **Step 6: Verify routing**

```bash
npm run dev
```

Expected:
- `http://localhost:5173/` → redirects to `/login` (no user) and shows "Login"
- `http://localhost:5173/login` → shows "Login"
- `http://localhost:5173/s/abc` → shows "Share"
- `http://localhost:5173/does-not-exist` → shows "Not found"

Stop server.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add router skeleton with placeholder pages and AuthGuard"
```

---

## Task 11: Login page with role switcher

**Files:**
- Modify: `src/features/auth/LoginPage.tsx`

- [ ] **Step 1: Implement login page**

Replace `src/features/auth/LoginPage.tsx`:

```tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, GraduationCap } from "lucide-react";
import { mockSignIn } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useSessionStore((s) => s.setUser);
  const [role, setRole] = useState<Role>("faculty");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      const user = await mockSignIn(role);
      setUser(user);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">AcaDex</span>
        </div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your BSU account to continue.
        </p>
        <div className="mt-6 space-y-3">
          <Button onClick={handleSignIn} className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Demo role: {ROLE_LABEL[role]}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuItem onClick={() => setRole("student")}>
                Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("faculty")}>
                Faculty
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("admin")}>
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Demo mode: the role switcher picks which fake user you sign in as.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Run `npm run dev`. Click "Sign in with Google" → should navigate to `/` (which still shows "Dashboard" placeholder). Change role via the dropdown before signing in → still signs in successfully. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/LoginPage.tsx
git commit -m "feat: implement login page with demo role switcher"
```

---

## Task 12: AppShell, Sidebar, Topbar

**Files:**
- Create: `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- Modify: `src/routes.tsx` (wrap authed routes in AppShell)

- [ ] **Step 1: Create `src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { LayoutGrid, Leaf, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Archive", icon: LayoutGrid, end: true },
  { to: "/impact", label: "Impact", icon: Leaf, end: false },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">AcaDex</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/80 hover:bg-muted"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create `src/components/layout/Topbar.tsx`**

```tsx
import { useNavigate } from "react-router-dom";
import { Upload, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSessionStore, useUIStore } from "@/lib/store";
import { mockSignIn, signOut } from "@/lib/api";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

interface TopbarProps {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}

export default function Topbar({ searchValue = "", onSearchChange }: TopbarProps) {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const openUpload = useUIStore((s) => s.openUpload);

  async function switchRole(role: Role) {
    const u = await mockSignIn(role);
    setUser(u);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    navigate("/login", { replace: true });
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
    : "??";

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search files and tags…"
          className="pl-9"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button onClick={openUpload} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <Badge variant="outline" className="uppercase">
                  {ROLE_LABEL[user.role]}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch demo role
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => switchRole("student")}>
                Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("faculty")}>
                Faculty
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("admin")}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/AppShell.tsx`**

```tsx
import { createContext, useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface ShellSearchContextValue {
  search: string;
  setSearch: (v: string) => void;
}

const ShellSearchContext = createContext<ShellSearchContextValue>({
  search: "",
  setSearch: () => {},
});

export function useShellSearch(): ShellSearchContextValue {
  return useContext(ShellSearchContext);
}

export default function AppShell() {
  const [search, setSearch] = useState("");
  return (
    <ShellSearchContext.Provider value={{ search, setSearch }}>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar searchValue={search} onSearchChange={setSearch} />
          <main className="min-h-0 flex-1 overflow-y-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellSearchContext.Provider>
  );
}
```

- [ ] **Step 4: Nest AuthGuard → AppShell → authed routes in `src/routes.tsx`**

Replace `src/routes.tsx`:

```tsx
import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ViewerPage from "@/features/viewer/ViewerPage";
import SharePage from "@/features/share/SharePage";
import ImpactPage from "@/features/impact/ImpactPage";
import NotFoundPage from "@/features/misc/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/s/:shareId", element: <SharePage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/file/:id", element: <ViewerPage /> },
          { path: "/impact", element: <ImpactPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
```

- [ ] **Step 5: Manual test**

Run `npm run dev`. Sign in → see shell with sidebar, topbar, dashboard placeholder. Switch roles via avatar dropdown — works. Sign out → back to `/login`. Stop server.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add AppShell with sidebar, topbar, search, and role switcher"
```

---

## Task 13: Shared components — SavingsBadge, EmptyState, FileCard, FileRow

**Files:**
- Create: `src/components/shared/SavingsBadge.tsx`, `EmptyState.tsx`, `FileCard.tsx`, `FileRow.tsx`

- [ ] **Step 1: Create `src/components/shared/SavingsBadge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  ratio: number; // 0..1
  className?: string;
}

export default function SavingsBadge({ ratio, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-primary/30 bg-primary/10 text-primary",
        className
      )}
    >
      <Leaf className="h-3 w-3" />
      {formatPercent(ratio)} smaller
    </Badge>
  );
}
```

- [ ] **Step 2: Create `src/components/shared/EmptyState.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="text-base font-medium">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/shared/FileCard.tsx`**

```tsx
import { Link } from "react-router-dom";
import { FileText, FileImage, FileVideo, FileIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SavingsBadge from "./SavingsBadge";
import { formatBytes, formatDate } from "@/lib/format";
import type { ArchivedFile, FileKind } from "@/lib/types";

const ICON: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  docx: FileText,
  pptx: FileText,
  image: FileImage,
  video: FileVideo,
  other: FileIcon,
};

interface Props {
  file: ArchivedFile;
}

export default function FileCard({ file }: Props) {
  const Icon = ICON[file.kind];
  return (
    <Link to={`/file/${file.id}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="flex h-28 items-center justify-center bg-muted/40">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div
            className="line-clamp-2 text-sm font-medium leading-snug"
            title={file.name}
          >
            {file.name}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatBytes(file.storedBytes)}</span>
            <span>{formatDate(file.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <SavingsBadge ratio={file.compressionRatio} />
            {file.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Create `src/components/shared/FileRow.tsx`**

```tsx
import { Link } from "react-router-dom";
import { FileText, FileImage, FileVideo, FileIcon } from "lucide-react";
import SavingsBadge from "./SavingsBadge";
import { formatBytes, formatDate } from "@/lib/format";
import type { ArchivedFile, FileKind } from "@/lib/types";

const ICON: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  docx: FileText,
  pptx: FileText,
  image: FileImage,
  video: FileVideo,
  other: FileIcon,
};

interface Props {
  file: ArchivedFile;
}

export default function FileRow({ file }: Props) {
  const Icon = ICON[file.kind];
  return (
    <Link
      to={`/file/${file.id}`}
      className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-md border bg-background px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate font-medium">{file.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {file.tags.join(" · ")}
        </div>
      </div>
      <SavingsBadge ratio={file.compressionRatio} />
      <span className="w-20 text-right text-muted-foreground">
        {formatBytes(file.storedBytes)}
      </span>
      <span className="w-24 text-right text-muted-foreground">
        {formatDate(file.createdAt)}
      </span>
    </Link>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add SavingsBadge, EmptyState, FileCard, FileRow"
```

---

## Task 14: Dashboard page

**Files:**
- Modify: `src/features/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Implement the dashboard**

Replace `src/features/dashboard/DashboardPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, FolderOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import FileCard from "@/components/shared/FileCard";
import FileRow from "@/components/shared/FileRow";
import EmptyState from "@/components/shared/EmptyState";
import { useShellSearch } from "@/components/layout/AppShell";
import { listFiles, type ListFilesParams } from "@/lib/api";
import { useSessionStore, useUIStore } from "@/lib/store";
import type { ArchivedFile, FileKind } from "@/lib/types";

const KIND_LABEL: Record<FileKind | "all", string> = {
  all: "All types",
  pdf: "PDF",
  docx: "Word",
  pptx: "PowerPoint",
  image: "Images",
  video: "Videos",
  other: "Other",
};

const SORT_LABEL: Record<NonNullable<ListFilesParams["sort"]>, string> = {
  recent: "Most recent",
  largest: "Largest original",
  most_saved: "Most saved",
};

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const openUpload = useUIStore((s) => s.openUpload);
  const { search } = useShellSearch();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kind, setKind] = useState<FileKind | "all">("all");
  const [sort, setSort] = useState<NonNullable<ListFilesParams["sort"]>>("recent");
  const [files, setFiles] = useState<ArchivedFile[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFiles(null);
    const params: ListFilesParams = { query: search, sort };
    if (kind !== "all") params.kind = kind;
    if (user.role === "student") params.ownerId = user.id;
    listFiles(params).then((result) => {
      if (!cancelled) setFiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [search, kind, sort, user]);

  const header = useMemo(() => {
    if (user?.role === "student") return "Your files";
    if (user?.role === "faculty") return "Your classroom files";
    return "All institutional files";
  }, [user]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{header}</h1>
          <p className="text-sm text-muted-foreground">
            Browse, preview, and share your archive.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {KIND_LABEL[kind]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(Object.keys(KIND_LABEL) as Array<FileKind | "all">).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort: {SORT_LABEL[sort]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(Object.keys(SORT_LABEL) as Array<keyof typeof SORT_LABEL>).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setSort(k)}>
                {SORT_LABEL[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center rounded-md border p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {files === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="No files match your filters"
          description="Try clearing the search or switching file type."
          action={
            <Button onClick={openUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload a file
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((f) => (
            <FileRow key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Run `npm run dev`. Sign in as Faculty → dashboard shows file grid. Switch to list view. Change kind filter to PDF. Change sort to "Most saved". Type in topbar search — results filter. Switch role to Student — list updates (only Maria's files). Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/DashboardPage.tsx
git commit -m "feat: implement dashboard with filters, sort, grid/list views"
```

---

## Task 15: Upload dialog

**Files:**
- Create: `src/components/shared/UploadDialog.tsx`
- Modify: `src/App.tsx` (mount the dialog globally)

- [ ] **Step 1: Create `src/components/shared/UploadDialog.tsx`**

```tsx
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUIStore } from "@/lib/store";
import { uploadFile } from "@/lib/api";
import { formatBytes, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function UploadDialog() {
  const open = useUIStore((s) => s.uploadDialogOpen);
  const closeUpload = useUIStore((s) => s.closeUpload);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        const result = await uploadFile(file);
        const savedRatio = result.compressionRatio;
        toast({
          title: `Uploaded ${result.name}`,
          description: `Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(
            result.storedBytes
          )} (${formatPercent(savedRatio)} smaller).`,
        });
      }
      closeUpload();
      // Force dashboards listening on user identity to re-fetch by a no-op nudge;
      // simplest: reload the dashboard via location. Keep the UX simple — tell user.
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : closeUpload())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
          <DialogDescription>
            AcaDex compresses and archives your file automatically.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"
          )}
        >
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-sm font-medium">
            {uploading ? "Compressing…" : "Drop files here or click to browse"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, PPTX, images, video
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeUpload} disabled={uploading}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Mount dialog globally in `src/App.tsx`**

Replace `src/App.tsx`:

```tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";
import UploadDialog from "@/components/shared/UploadDialog";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <Toaster />
    </>
  );
}

export default App;
```

- [ ] **Step 3: Wire dashboard re-fetch on upload**

Note: after upload, the dashboard's `useEffect` won't automatically re-run. Simplest fix — add a tiny `uploadsVersion` counter to `useUIStore` and bump it on successful upload; the dashboard includes it in its `useEffect` deps.

Modify `src/lib/store.ts` — add to `UIState`:

```ts
interface UIState {
  uploadDialogOpen: boolean;
  shareDialog: { open: boolean; fileId?: string };
  uploadsVersion: number;
  openUpload: () => void;
  closeUpload: () => void;
  openShare: (fileId: string) => void;
  closeShare: () => void;
  bumpUploadsVersion: () => void;
}
```

And in the store body:

```ts
  uploadsVersion: 0,
  bumpUploadsVersion: () => set((s) => ({ uploadsVersion: s.uploadsVersion + 1 })),
```

In `UploadDialog.tsx`, after successful upload (inside `handleFiles`, after the for-loop completes), call:

```ts
useUIStore.getState().bumpUploadsVersion();
```

In `src/features/dashboard/DashboardPage.tsx`, read the counter and include it as an effect dep:

```ts
const uploadsVersion = useUIStore((s) => s.uploadsVersion);

useEffect(() => {
  // ...existing fetch logic...
}, [search, kind, sort, user, uploadsVersion]);
```

- [ ] **Step 4: Manual test**

Run `npm run dev`. Sign in → click Upload → drag or pick a real file → see toast with compression numbers → dialog closes → dashboard shows the new file at the top (it has `createdAt: now`). Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: upload dialog with dropzone, toasts, and live dashboard refresh"
```

---

## Task 16: File Viewer page + FilePreview

**Files:**
- Create: `src/features/viewer/FilePreview.tsx`
- Modify: `src/features/viewer/ViewerPage.tsx`

- [ ] **Step 1: Create `src/features/viewer/FilePreview.tsx`**

```tsx
import { useState } from "react";
import { FileText } from "lucide-react";
import type { ArchivedFile } from "@/lib/types";

interface Props {
  file: ArchivedFile;
}

export default function FilePreview({ file }: Props) {
  const [failed, setFailed] = useState(false);

  if (!file.previewUrl || failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground">
        <FileText className="h-10 w-10" />
        <div className="text-sm">Preview not available</div>
      </div>
    );
  }

  if (file.kind === "image") {
    return (
      <img
        src={file.previewUrl}
        alt={file.name}
        onError={() => setFailed(true)}
        className="max-h-full max-w-full object-contain"
      />
    );
  }

  if (file.kind === "video") {
    return (
      <video
        src={file.previewUrl}
        controls
        onError={() => setFailed(true)}
        className="max-h-full max-w-full"
      />
    );
  }

  if (file.kind === "pdf") {
    return (
      <iframe
        src={file.previewUrl}
        title={file.name}
        onError={() => setFailed(true)}
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  // docx / pptx / other — no in-browser native preview for MVP.
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground">
      <FileText className="h-10 w-10" />
      <div className="text-sm">Preview requires download for this file type.</div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/features/viewer/ViewerPage.tsx`**

Replace `src/features/viewer/ViewerPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import FilePreview from "./FilePreview";
import SavingsBadge from "@/components/shared/SavingsBadge";
import { useToast } from "@/components/ui/use-toast";
import { deleteFile, getFile } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import { useSessionStore, useUIStore } from "@/lib/store";
import type { ArchivedFile } from "@/lib/types";

export default function ViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<ArchivedFile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const openShare = useUIStore((s) => s.openShare);
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setFile(null);
    setNotFound(false);
    getFile(id)
      .then((f) => {
        if (!cancelled) setFile(f);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!file) return;
    await deleteFile(file.id);
    toast({ title: `Deleted ${file.name}` });
    navigate("/", { replace: true });
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-xl font-semibold">File not found</h1>
        <Button asChild variant="link">
          <Link to="/">Back to archive</Link>
        </Button>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="grid h-full grid-cols-[1fr_320px]">
        <Skeleton className="m-4" />
        <div className="space-y-3 border-l p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === file.ownerId || user?.role === "admin";

  return (
    <div className="grid h-full grid-rows-[auto_1fr] lg:grid-cols-[1fr_320px] lg:grid-rows-1">
      <section className="flex min-h-0 items-center justify-center overflow-hidden bg-muted/20 p-4">
        <FilePreview file={file} />
      </section>
      <aside className="flex flex-col gap-4 overflow-y-auto border-t p-4 lg:border-l lg:border-t-0">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 gap-1">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-lg font-semibold leading-tight">{file.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatDate(file.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={() => openShare(file.id)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <a href={file.downloadUrl || "#"} download={file.name}>
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
          {isOwner && (
            <Button variant="outline" className="gap-2" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        <Separator />

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Original</dt>
            <dd>{formatBytes(file.originalBytes)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Stored</dt>
            <dd>{formatBytes(file.storedBytes)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Savings</dt>
            <dd>
              <SavingsBadge ratio={file.compressionRatio} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="uppercase">{file.kind}</dd>
          </div>
        </dl>

        <Separator />

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Tags
          </div>
          <div className="flex flex-wrap gap-1">
            {file.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Manual test**

Run `npm run dev`. Click a PDF card on the dashboard → viewer renders PDF iframe (or "Preview not available" if you haven't dropped a real PDF into `public/mock-previews/`). Metadata sidebar shows name, dates, sizes, savings, tags. Click Back → return to dashboard. Navigate to `/file/unknown` → "File not found". Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/features/viewer/
git commit -m "feat: implement file viewer with metadata sidebar and preview"
```

---

## Task 17: Share dialog

**Files:**
- Create: `src/components/shared/ShareDialog.tsx`
- Modify: `src/App.tsx` (mount globally)

- [ ] **Step 1: Create `src/components/shared/ShareDialog.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUIStore } from "@/lib/store";
import { createShareLink } from "@/lib/api";
import type { SharePermission } from "@/lib/types";

function buildShareUrl(shareId: string): string {
  return `${window.location.origin}/s/${shareId}`;
}

export default function ShareDialog() {
  const { open, fileId } = useUIStore((s) => s.shareDialog);
  const closeShare = useUIStore((s) => s.closeShare);
  const { toast } = useToast();
  const [permission, setPermission] = useState<SharePermission>("view");
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && fileId) {
      setShareUrl("");
      setCopied(false);
      setPermission("view");
    }
  }, [open, fileId]);

  async function generate() {
    if (!fileId) return;
    setGenerating(true);
    try {
      const link = await createShareLink(fileId, permission);
      setShareUrl(buildShareUrl(link.id));
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied", description: "Paste it into Google Classroom." });
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : closeShare())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share file</DialogTitle>
          <DialogDescription>
            Generate a link anyone can open in their browser — no download required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Permission
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={permission === "view" ? "secondary" : "outline"}
                onClick={() => setPermission("view")}
              >
                View only
              </Button>
              <Button
                type="button"
                variant={permission === "view_and_download" ? "secondary" : "outline"}
                onClick={() => setPermission("view_and_download")}
              >
                Allow download
              </Button>
            </div>
          </div>

          {!shareUrl ? (
            <Button className="w-full" onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "Generate link"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={copy} variant="outline" className="gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeShare}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Mount globally in `src/App.tsx`**

Replace `src/App.tsx`:

```tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/toaster";
import UploadDialog from "@/components/shared/UploadDialog";
import ShareDialog from "@/components/shared/ShareDialog";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <ShareDialog />
      <Toaster />
    </>
  );
}

export default App;
```

- [ ] **Step 3: Manual test**

Run `npm run dev`. Open a file → click Share → dialog opens → pick permission → "Generate link" → URL appears → Copy → see "Link copied" toast. Open a new browser tab to `http://localhost:5173/s/<pasted-id>` — share page still shows placeholder (implemented in next task). Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: share dialog with permission toggle and clipboard copy"
```

---

## Task 18: Public share page

**Files:**
- Modify: `src/features/share/SharePage.tsx`

- [ ] **Step 1: Implement `src/features/share/SharePage.tsx`**

Replace `src/features/share/SharePage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FilePreview from "@/features/viewer/FilePreview";
import SavingsBadge from "@/components/shared/SavingsBadge";
import { getShareLink } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { ArchivedFile, ShareLink } from "@/lib/types";

export default function SharePage() {
  const { shareId } = useParams();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ok"; file: ArchivedFile; link: ShareLink }
    | { status: "not_found" }
  >({ status: "loading" });

  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;
    setState({ status: "loading" });
    getShareLink(shareId)
      .then((res) => {
        if (!cancelled) setState({ status: "ok", file: res.file, link: res.link });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not_found" });
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">AcaDex</span>
        <span className="ml-2 text-xs text-muted-foreground">Shared file</span>
      </header>

      {state.status === "loading" && (
        <div className="grid flex-1 place-items-center p-6">
          <Skeleton className="h-72 w-full max-w-2xl" />
        </div>
      )}

      {state.status === "not_found" && (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold">Link not found</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This share link may have been revoked.
            </p>
          </div>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{state.file.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatBytes(state.file.storedBytes)}</span>
                <SavingsBadge ratio={state.file.compressionRatio} />
              </div>
            </div>
            {state.link.permission === "view_and_download" && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={state.file.downloadUrl || "#"} download={state.file.name}>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
          </div>
          <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/20 p-4">
            <FilePreview file={state.file} />
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Run `npm run dev`. Visit `http://localhost:5173/s/share_abc123` (pre-seeded in mock data) → shows the Lecture 01 PDF with no app chrome, no download button (view-only). Visit `/s/share_def456` → shows Midterm slides with a Download button (view_and_download). Visit `/s/bogus` → "Link not found". Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/features/share/SharePage.tsx
git commit -m "feat: public share page with permission-aware download"
```

---

## Task 19: Impact dashboard

**Files:**
- Modify: `src/features/impact/ImpactPage.tsx`

- [ ] **Step 1: Implement `src/features/impact/ImpactPage.tsx`**

Replace `src/features/impact/ImpactPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database, Leaf, PhilippinePeso, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getImpactStats } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { ImpactStats } from "@/lib/types";

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function ImpactPage() {
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    getImpactStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const trendData = stats.trend.map((t) => ({
    date: t.date.slice(5),
    bytesSaved: t.bytesSaved,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Sustainability impact</h1>
        <p className="text-sm text-muted-foreground">
          Every file compressed is storage, bandwidth, and energy saved.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          icon={<Database className="h-4 w-4" />}
          label="Storage saved"
          value={formatBytes(stats.bytesSaved)}
          sub={`of ${formatBytes(stats.totalOriginalBytes)} original`}
        />
        <Stat
          icon={<Leaf className="h-4 w-4" />}
          label="CO₂ avoided"
          value={`${stats.co2KgAvoided} kg`}
        />
        <Stat
          icon={<PhilippinePeso className="h-4 w-4" />}
          label="Pesos saved"
          value={`₱${stats.pesosSaved.toLocaleString()}`}
        />
        <Stat
          icon={<FileText className="h-4 w-4" />}
          label="Files archived"
          value={stats.fileCount.toString()}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Savings trend — last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="savings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => formatBytes(Number(v))}
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip formatter={(v: number) => formatBytes(v)} />
              <Area
                type="monotone"
                dataKey="bytesSaved"
                stroke="hsl(var(--primary))"
                fill="url(#savings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By file type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.entries(stats.byKind).map(([kind, v]) => (
              <div
                key={kind}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="capitalize">{kind}</div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {v.count} file{v.count === 1 ? "" : "s"}
                  </div>
                  <div className="font-medium">{formatBytes(v.bytesSaved)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Run `npm run dev`. Sign in → click **Impact** in the sidebar → 4 stat cards render, trend chart renders, file-type breakdown lists each kind with counts. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/features/impact/ImpactPage.tsx
git commit -m "feat: impact dashboard with stat cards, trend chart, and by-kind breakdown"
```

---

## Task 20: 404 page

**Files:**
- Modify: `src/features/misc/NotFoundPage.tsx`

- [ ] **Step 1: Implement**

Replace `src/features/misc/NotFoundPage.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-5xl font-semibold text-muted-foreground">404</div>
      <div className="text-lg">Page not found</div>
      <Button asChild variant="outline">
        <Link to="/">Back to archive</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Run `npm run dev`. Visit any unknown route → 404 shows with "Back to archive" button. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/features/misc/NotFoundPage.tsx
git commit -m "feat: 404 page"
```

---

## Task 21: Final walkthrough

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole project**

```bash
npx tsc --noEmit
```

Expected: no errors. If any surface, fix them in the relevant file.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build succeeds (Vite prints chunk sizes). Fix any errors that surface.

- [ ] **Step 4: End-to-end demo walkthrough**

Run `npm run dev` and walk through the full demo story:

1. Visit `/` → redirected to `/login`.
2. Select role **Faculty** → Sign in → land on dashboard with Prof. Cruz's files.
3. Type "lecture" in the search bar → list narrows to lecture files.
4. Click a PDF card → viewer opens with preview (if real PDF is dropped in `public/mock-previews/`) and metadata sidebar.
5. Click **Share** → dialog → pick "View only" → **Generate link** → **Copy**.
6. Open the copied URL in an incognito window → public share page shows the file with no app chrome and no Download button.
7. Back in the app, click **Upload**, drop any file → toast shows compression numbers → file appears at the top of the dashboard.
8. Click avatar → switch to **Student** → dashboard now shows only Maria's files.
9. Click **Impact** in the sidebar → 4 stat cards + trend chart + by-kind breakdown.
10. Visit `/garbage` → 404 page.
11. Click avatar → **Sign out** → back at login.

If anything breaks, fix it, re-run the walkthrough, commit the fix.

- [ ] **Step 5: Final commit (if any fixes)**

```bash
git add .
git commit -m "chore: post-walkthrough fixes" # only if fixes were made
```

If the walkthrough passed cleanly with no fixes, no commit is needed.

---

## Self-review notes

- **Spec coverage:** every spec section maps to a task — stack (1–3), assets (4), types (5), format utils (6), mock data (7), service layer (8), stores (9), routing (10), feature pages (11, 14, 16, 18, 19, 20), layout/shell (12), shared components (13), dialogs (15, 17), verification (21).
- **Out-of-scope items from the spec stay out:** no dark mode, no real OAuth, no real upload to server, no desktop wrap, no settings/admin/onboarding, no i18n.
- **Type consistency:** `ArchivedFile`, `ShareLink`, `ImpactStats`, `User`, `Role`, `SharePermission`, and `FileKind` are defined in Task 5 and used with identical names everywhere. Service function names in Task 8 (`listFiles`, `getFile`, `uploadFile`, `deleteFile`, `createShareLink`, `getShareLink`, `revokeShareLink`, `getImpactStats`, `mockSignIn`, `signOut`, `getCurrentUser`) match the spec's Section 8 contract.
- **Store names:** `useSessionStore` and `useUIStore` consistent across Tasks 9, 11, 12, 14, 15, 16, 17.
- **Re-fetch mechanism after upload:** added explicitly in Task 15 Step 3 via `uploadsVersion` counter so there's no hand-wave.
