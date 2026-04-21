# AcaDex Web MVP — UI & Structure Design

**Date:** 2026-04-21
**Author:** Angelo Baricante
**Scope:** Initial web frontend (UI + structure) for the AcaDex hackathon MVP.
**Owner lane:** Frontend UI foundation. Backend and UI/UX polish are handled by other teammates.

---

## 1. Problem & product context

BSU's institutional Google Drive is full. The pitch reframes this from "buy more storage" to "cut digital waste": compress every uploaded file, let users view files in-browser without downloading, and share files as links (not attachments). AcaDex is the web + desktop product delivering that.

This spec covers **only the web version**, and only the **UI + structure** slice. A backend teammate will implement real compression, dedup, AI tagging, storage, auth, and sharing. A UI/UX teammate will polish visuals after the foundation exists. The desktop app is a separate future effort (Tauri wrap of the same web codebase).

## 2. Goals

- A working, navigable web app covering the five core MVP screens.
- All screens populated with believable mock data so the product looks real during the hackathon demo.
- A clean service layer that lets the backend teammate swap in real APIs later by editing a single file.
- Visual direction: **Google Classroom familiarity + Notion polish**, light mode only.
- Ship in a timeframe compatible with a hackathon.

## 3. Non-goals (explicitly out of scope)

- Real Google OAuth.
- Real Google Classroom API integration (demo shows the link being pasted manually).
- Real file upload to a server — mock fabricates metadata locally.
- Desktop app packaging.
- Dark mode.
- Settings, admin panel, onboarding flow, notifications.
- Internationalization.
- Production-grade accessibility pass (shadcn defaults only; full audit comes from the UI/UX teammate).

## 4. Stack

- **Build:** Vite
- **Language:** TypeScript
- **UI framework:** React 18
- **Styling:** Tailwind CSS
- **Component primitives:** shadcn/ui (Radix under the hood, copy-pasted into `src/components/ui/`)
- **Routing:** React Router v6
- **State:** Zustand (small, flat stores only)
- **Font:** Inter via `@fontsource/inter`

Rationale: Vite + React keeps the codebase wrappable with Tauri for the future desktop version. shadcn/ui closes the "Notion polish" gap without hand-rolling primitives. Zustand avoids Context boilerplate for the tiny bits of global state we actually need.

## 5. Folder structure

```
src/
  main.tsx                    # app entry
  App.tsx                     # <RouterProvider />
  routes.tsx                  # route definitions
  index.css                   # tailwind + theme tokens (CSS vars)
  components/
    ui/                       # shadcn primitives (Button, Dialog, etc.)
    layout/                   # AppShell, Sidebar, Topbar, RoleSwitcher
  features/
    auth/                     # login screen, mock sign-in
    dashboard/                # archive + upload entry page
    viewer/                   # in-browser file viewer
    share/                    # public share-link page
    impact/                   # sustainability dashboard
  lib/
    api.ts                    # typed service layer (reads from mockData today)
    mockData.ts               # fake files, users, share links
    store.ts                  # zustand stores (session, UI)
    types.ts                  # shared TS types
    format.ts                 # bytes, dates, percentages
  assets/                     # logo, icons
public/
  mock-previews/              # real PDFs, images, short mp4 for viewer demo
```

**Principle:** each feature folder is self-contained (page component + sub-components + hooks), importing shared utilities from `components/` and `lib/`. The backend teammate will only ever touch `src/lib/api.ts` — the rest of the app has no awareness of whether data is mocked or real.

## 6. Routes & pages

| Route | Screen | Who sees it | Purpose |
|---|---|---|---|
| `/login` | Login | unauthed | "Sign in with Google" button (mocked). Below it, a role switcher dropdown (Student / Faculty / Admin) that picks which fake user to sign in as. |
| `/` | Dashboard | authed | Home. Sidebar nav, topbar with search + role badge + upload button. Main area = archive file grid/list with filters (type, tag, owner). Drag-and-drop zone overlays when dragging files. |
| `/file/:id` | File Viewer | authed | Left: file metadata sidebar (name, size, savings, tags, owner, sharing). Center: preview (PDF embed / image / video / text fallback). Top-right: Share, Download, Copy link. |
| `/s/:shareId` | Public Share Page | anyone with link | Stripped-down viewer. No app shell. AcaDex header + file preview + permissions respected (view-only vs allow-download). This is what faculty paste into Classroom. |
| `/impact` | Impact Dashboard | authed | Stat cards (storage saved, CO₂ avoided, pesos saved), trend chart, top compressed files, breakdown by file type. |
| `*` | 404 | any | Simple not-found page. |

**Layout strategy:**
- `/`, `/file/:id`, `/impact` → wrapped in `<AppShell>` (sidebar + topbar).
- `/login`, `/s/:shareId`, `/404` → bare layout, no app chrome.

**Auth gating:** authed routes wrap in an `<AuthGuard>` that redirects to `/login` when no user is in the session store.

## 7. Data model (shared types)

`src/lib/types.ts`:

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
  createdAt: string;        // ISO
  updatedAt: string;        // ISO
  previewUrl: string;
  downloadUrl: string;
}

export type SharePermission = "view" | "view_and_download";

export interface ShareLink {
  id: string;               // used in /s/:shareId
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
  trend: Array<{ date: string; bytesSaved: number }>; // last 30 days
}
```

CO₂ and pesos conversion factors come from the backend — the UI only renders them.

## 8. Service layer contract

`src/lib/api.ts` — typed functions, all returning Promises (even when mocked).

```ts
// Auth (mocked)
mockSignIn(role: Role): Promise<User>
signOut(): Promise<void>
getCurrentUser(): Promise<User | null>

// Files
listFiles(params?: {
  query?: string;
  kind?: FileKind;
  tag?: string;
  ownerId?: string;
  sort?: "recent" | "largest" | "most_saved";
}): Promise<ArchivedFile[]>

getFile(id: string): Promise<ArchivedFile>
uploadFile(file: File): Promise<ArchivedFile>   // mock fabricates metadata; previewUrl/downloadUrl use URL.createObjectURL so the uploaded file is viewable in the same session
deleteFile(id: string): Promise<void>

// Sharing
createShareLink(fileId: string, permission: SharePermission): Promise<ShareLink>
getShareLink(shareId: string): Promise<{ link: ShareLink; file: ArchivedFile }>
revokeShareLink(shareId: string): Promise<void>

// Impact
getImpactStats(): Promise<ImpactStats>
```

**Errors:** functions throw `ApiError { code, message }`. UI catches and renders shadcn toasts.

**Loading states:** local `useState` + a small `useAsync` hook. No TanStack Query for MVP.

**Artificial latency:** every mock function waits 200–400ms before resolving so loading states are visible during the demo and missing skeletons are caught early.

## 9. State

`src/lib/store.ts`:

```ts
useSessionStore: {
  user: User | null;
  setUser(u: User | null): void;
}

useUIStore: {
  uploadDialogOpen: boolean;
  shareDialogOpen: { open: boolean; fileId?: string };
  openUpload(): void; closeUpload(): void;
  openShare(fileId: string): void; closeShare(): void;
}
```

File data is **not** stored globally. Components fetch on demand via `api.ts` and hold results in local state — matches how it'll work once the backend is live.

## 10. Mock data

`src/lib/mockData.ts`:

- **3 fake users** — one per role: `student_maria`, `faculty_cruz`, `admin_reyes`.
- **~20 archived files** — mix of kinds: lecture PDFs, a DOCX thesis, a PPTX deck, images, one video. Believable `originalBytes` / `storedBytes` / `compressionRatio` / tags (e.g., `["Lecture", "Week 3", "CS101"]`).
- **Pre-created share links** so `/s/:shareId` has content on first load.
- **`ImpactStats` object** with fabricated numbers that support the "99.9% reduction" story from the pitch.
- **Preview assets** in `public/mock-previews/` — real PDFs, images, short mp4 — so the viewer is convincing during the demo.
- **Uploaded files** are added to the in-memory list for the current session with `URL.createObjectURL(file)` as `previewUrl` and `downloadUrl`. They vanish on reload (acceptable for MVP demo).

## 11. Role switcher mechanics

1. On login, user picks a role → `mockSignIn(role)` resolves the matching fake user → stored in `useSessionStore`.
2. Topbar shows a role badge; clicking opens a menu to switch instantly (also calls `mockSignIn`).
3. UI reads `useSessionStore().user.role` to conditionally render: admins see all files, students see only public + own, faculty see own + shared.
4. Switching role triggers re-fetch of file lists (via `useEffect` keyed on `user.id`).

## 12. Design system

### Theme tokens (`src/index.css`)

Light mode only. HSL values drive shadcn theming.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 210 11% 15%;
  --muted: 210 17% 96%;
  --muted-foreground: 215 14% 40%;
  --border: 214 15% 91%;
  --primary: 142 52% 34%;             /* Google Classroom-inspired green */
  --primary-foreground: 0 0% 100%;
  --accent: 38 92% 50%;                /* warm amber for share-link highlights */
  --destructive: 0 72% 51%;
  --ring: 142 52% 34%;
  --radius: 0.5rem;
}
```

### Typography

- **Font:** Inter (UI).
- **Base size:** 14px, line-height 1.5.
- **Weights:** 400 body, 500 UI labels, 600 section headers.

### Shared components to build

- `<AppShell>` — sidebar + topbar wrapper.
- `<Sidebar>` — nav links (Dashboard, Impact), collapses on mobile.
- `<Topbar>` — search, role badge menu, upload button, avatar menu.
- `<FileCard>` — grid tile (thumbnail, name, savings badge, tags).
- `<FileRow>` — list-view row.
- `<UploadDialog>` — shadcn Dialog + dropzone + progress + result toast.
- `<ShareDialog>` — permission radio + generated link field with copy button.
- `<EmptyState>` — reusable empty-state component.
- `<SavingsBadge>` — pill showing compression % (e.g., "82% smaller").

## 13. Scope boundaries — who does what

**This spec (UI foundation):**
- All 5 routes, shells, navigation.
- All feature-folder pages and sub-components.
- Mock data, service layer, Zustand stores.
- Theme tokens and shared components.
- Responsive layouts (mobile-reasonable).
- Empty, loading, and error states.

**Backend teammate:**
- Replaces `api.ts` internals with real `fetch()` calls. No component changes required.
- Owns compression, dedup, AI tagging, OAuth, storage, real share-link generation, CO₂/pesos math.

**UI/UX teammate:**
- Visual polish: refined illustrations, micro-interactions, motion, empty-state art, better file-type icons, final typography tuning.
- Accessibility audit beyond shadcn defaults.
- Free to restyle any shared component — everything lives in `components/` for single-point edits.

## 14. Success criteria

- Running `npm run dev` serves a working app at `localhost:5173`.
- All 5 routes render with mock data and respond to role switching.
- A user can: sign in (mock) → see dashboard → upload a file (mock) → open it in the viewer → create a share link → open the share link in an incognito window → see the public share page.
- Impact dashboard renders stats from mock data with at least one chart.
- Backend teammate can implement real APIs against the contract in Section 8 without modifying any component file.
- UI/UX teammate can restyle any shared component from `src/components/` without touching feature pages.
