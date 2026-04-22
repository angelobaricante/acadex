import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { deleteFolder, listFiles, listFolders } from "@/lib/api";
import type { ArchivedFile, FileKind, Folder } from "@/lib/types";
import { useSessionStore, useUIStore } from "@/lib/store";
import { useShellSearch } from "@/components/layout/AppShell";
import FileCard from "@/components/shared/FileCard";
import FileRow from "@/components/shared/FileRow";
import FolderTile from "@/components/shared/FolderTile";
import EmptyState from "@/components/shared/EmptyState";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type KindFilter = "all" | FileKind;
type SortKey = "recent" | "largest" | "most_saved";
type ViewMode = "grid" | "list";

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word" },
  { value: "pptx", label: "PowerPoint" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "largest", label: "Largest original" },
  { value: "most_saved", label: "Most saved" },
];

const ROLE_HEADINGS = {
  student: {
    title: "Your files",
    sub: "Personal archive for your coursework.",
  },
  faculty: {
    title: "Your classroom files",
    sub: "Lecture materials, handouts, and recordings you own.",
  },
  admin: {
    title: "All institutional files",
    sub: "Every archive across the institution.",
  },
} as const;

const ROLE_EMPTY = {
  student: {
    title: "You haven't uploaded any files yet",
    description: "Your compressed archive starts here.",
    cta: "Upload your first file",
  },
  faculty: {
    title: "No classroom files yet",
    description: "Upload your first lecture or handout.",
    cta: "Upload your first file",
  },
  admin: {
    title: "No institutional files yet",
    description: "As faculty and students upload, files land here.",
    cta: "Upload a file",
  },
} as const;

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const openUpload = useUIStore((s) => s.openUpload);
  const openNewFolder = useUIStore((s) => s.openNewFolder);
  const uploadsVersion = useUIStore((s) => s.uploadsVersion);
  const foldersVersion = useUIStore((s) => s.foldersVersion);
  const bumpFoldersVersion = useUIStore((s) => s.bumpFoldersVersion);
  const setCurrentFolderId = useUIStore((s) => s.setCurrentFolderId);
  const { search } = useShellSearch();

  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [allFiles, setAllFiles] = useState<ArchivedFile[] | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);

  const ownerId = user?.role === "student" ? user.id : undefined;

  // Keep the UI store in sync so the upload dialog can seed its folder target.
  useEffect(() => {
    setCurrentFolderId(activeFolder?.id ?? null);
  }, [activeFolder, setCurrentFolderId]);

  // Clear the current folder reference when the dashboard unmounts.
  useEffect(() => {
    return () => {
      setCurrentFolderId(null);
    };
  }, [setCurrentFolderId]);

  // Fetch folders list on mount / when they change.
  useEffect(() => {
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setFolders(result);
      // If the active folder no longer exists, clear it.
      if (activeFolder && !result.find((f) => f.id === activeFolder.id)) {
        setActiveFolder(null);
      }
    });
    return () => {
      cancelled = true;
    };
    // activeFolder intentionally not a dep: we only want to reconcile when folders change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersVersion, uploadsVersion]);

  // Fetch the full file list (respecting ownerId) once per data-change event.
  // All filtering/sorting below is client-side so tab switches are instant —
  // the API call only happens on user change, upload, delete, or folder move.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listFiles({ ownerId }).then((result) => {
      if (cancelled) return;
      setAllFiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [user, ownerId, uploadsVersion, foldersVersion]);

  // Derive the displayed list via memo — no network calls on filter changes.
  const files = useMemo<ArchivedFile[] | null>(() => {
    if (allFiles === null) return null;
    let result = allFiles;
    if (activeFolder) {
      result = result.filter((f) => f.folderId === activeFolder.id);
    }
    if (kind !== "all") {
      result = result.filter((f) => f.kind === kind);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    const sorted = [...result];
    if (sort === "recent") {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "largest") {
      sorted.sort((a, b) => b.originalBytes - a.originalBytes);
    } else {
      sorted.sort(
        (a, b) =>
          b.originalBytes - b.storedBytes - (a.originalBytes - a.storedBytes)
      );
    }
    return sorted;
  }, [allFiles, activeFolder, kind, search, sort]);

  const heading = user ? ROLE_HEADINGS[user.role] : ROLE_HEADINGS.student;
  const emptyCopy = user ? ROLE_EMPTY[user.role] : ROLE_EMPTY.student;
  const filtersActive = Boolean(search) || kind !== "all";

  const totalSaved = useMemo(() => {
    if (!files) return 0;
    return files.reduce((acc, f) => acc + (f.originalBytes - f.storedBytes), 0);
  }, [files]);

  const fileCountsByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!allFiles) return counts;
    for (const file of allFiles) {
      if (file.folderId) {
        counts[file.folderId] = (counts[file.folderId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allFiles]);

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Most recent";
  const kindLabel =
    KIND_OPTIONS.find((o) => o.value === kind)?.label ?? "All types";

  const showFoldersStrip =
    activeFolder === null && folders !== null && folders.length > 0;

  const canDeleteActiveFolder =
    activeFolder !== null &&
    user !== null &&
    (user.role === "admin" || activeFolder.ownerId === user.id);

  function handleOpenFolder(folder: Folder) {
    setActiveFolder(folder);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleDeleteActiveFolder() {
    if (!activeFolder) return;
    const confirmed = window.confirm(
      `Delete folder '${activeFolder.name}'? Its files will move to All files.`
    );
    if (!confirmed) return;
    try {
      await deleteFolder(activeFolder.id);
      toast.success("Folder deleted");
      setActiveFolder(null);
      bumpFoldersVersion();
    } catch {
      toast.error("Couldn't delete folder");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      {/* Heading */}
      <header className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Archive
        </span>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {heading.title}
        </h1>
        <p className="text-[13.5px] leading-snug text-muted-foreground">
          {heading.sub}
        </p>
        {files && (
          <p className="mt-1 text-[12.5px] text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">{files.length}</span>{" "}
            {files.length === 1 ? "file" : "files"}
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="font-medium text-foreground">
              {formatBytes(totalSaved)}
            </span>{" "}
            saved total
          </p>
        )}
      </header>

      {/* Breadcrumb + folder actions row */}
      <div className="flex items-center justify-between gap-3">
        <nav
          aria-label="Folder breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-[13.5px]"
        >
          {activeFolder ? (
            <>
              <button
                type="button"
                onClick={() => setActiveFolder(null)}
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                All files
              </button>
              <ChevronRight
                className="size-[14px] shrink-0 text-muted-foreground/60"
                strokeWidth={1.8}
              />
              <span className="truncate font-semibold text-foreground">
                {activeFolder.name}
              </span>
            </>
          ) : (
            <span className="font-semibold text-foreground">All files</span>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {canDeleteActiveFolder && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeleteActiveFolder}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-[14px]" strokeWidth={1.8} />
              <span>Delete folder</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openNewFolder}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-[14px]" strokeWidth={1.8} />
            <span>New folder</span>
          </Button>
        </div>
      </div>

      {/* Folders strip */}
      {showFoldersStrip && (
        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Folders
          </span>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {folders!.map((folder) => (
              <FolderTile
                key={folder.id}
                folder={folder}
                fileCount={fileCountsByFolder[folder.id] ?? 0}
                onClick={() => handleOpenFolder(folder)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Kind filter — pills on md+, dropdown on smaller screens */}
        <div
          role="tablist"
          aria-label="Filter by file type"
          className="hidden items-center gap-0.5 rounded-lg border border-border/70 bg-white p-0.5 shadow-[0_1px_0_rgba(16,24,40,0.02)] md:flex"
        >
          {KIND_OPTIONS.map((opt) => {
            const active = kind === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setKind(opt.value)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[12.5px] font-medium transition-colors duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-[12.5px]"
              >
                <span>{kindLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 p-1">
              {KIND_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setKind(opt.value)}
                  className={cn(
                    "px-2 py-1.5 text-[13px]",
                    kind === opt.value && "font-medium text-primary"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-[12.5px]"
            >
              <ArrowUpDown className="size-[13px]" />
              <span>{sortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 p-1">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => setSort(opt.value)}
                className={cn(
                  "px-2 py-1.5 text-[13px]",
                  sort === opt.value && "font-medium text-primary"
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div
          role="group"
          aria-label="View mode"
          className="ml-auto flex items-center gap-0.5 rounded-lg border border-border/70 bg-[hsl(48_25%_98%)] p-0.5"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors duration-150",
              view === "grid"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-[14px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors duration-150",
              view === "list"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-[14px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Results */}
      {files === null ? (
        view === "grid" ? (
          <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[206px] rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[48px] rounded-lg" />
            ))}
          </div>
        )
      ) : files.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title={
            activeFolder
              ? `Nothing in '${activeFolder.name}' yet`
              : filtersActive
                ? "No files match your filters"
                : emptyCopy.title
          }
          description={
            activeFolder
              ? "Upload a file or move existing files into this folder."
              : filtersActive
                ? "Try clearing the search or switching file type."
                : emptyCopy.description
          }
          action={
            <Button
              type="button"
              size="sm"
              onClick={openUpload}
              className="h-8 gap-1.5 rounded-lg px-3 text-[13px]"
            >
              <Upload className="size-[14px]" />
              <span>
                {activeFolder
                  ? "Upload a file"
                  : filtersActive
                    ? "Upload a file"
                    : emptyCopy.cta}
              </span>
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
