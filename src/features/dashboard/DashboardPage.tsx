import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  File,
  FileCode,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  HardDrive,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Tags,
  Trash2,
  TrendingDown,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { deleteFile, deleteFolder, listFiles, listFolders } from "@/lib/api";
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

const KIND_OPTIONS: Array<{ value: KindFilter; label: string; icon: LucideIcon }> = [
  { value: "all", label: "All types", icon: FileIcon },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "docx", label: "Word Documents", icon: FileText },
  { value: "pptx", label: "Presentations", icon: FileText },
  { value: "image", label: "Photos & images", icon: FileImage },
  { value: "video", label: "Videos", icon: FileVideo },
  { value: "other", label: "Other", icon: FileCode },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string; icon: LucideIcon }> = [
  { value: "recent", label: "Most recent", icon: Clock },
  { value: "largest", label: "Largest original", icon: HardDrive },
  { value: "most_saved", label: "Most saved", icon: TrendingDown },
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
  const bumpUploadsVersion = useUIStore((s) => s.bumpUploadsVersion);
  const setCurrentFolderId = useUIStore((s) => s.setCurrentFolderId);
  const { search } = useShellSearch();

  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [allFiles, setAllFiles] = useState<ArchivedFile[] | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [displayLimit, setDisplayLimit] = useState(16);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);

  const totalSelected = selectedFileIds.size + selectedFolderIds.size;

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
    let cancelled = false;
    listFiles({ ownerId }).then((result) => {
      if (cancelled) return;
      setAllFiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId, uploadsVersion, foldersVersion]);

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
    clearSelection();
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

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayLimit(16);
  }, [kind, search, activeFolder?.id, sort]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      if (node) {
        observer.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && files && displayLimit < files.length) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setDisplayLimit((prev) => prev + 16);
              setIsLoadingMore(false);
            }, 600);
          }
        });
        observer.current.observe(node);
      }
    },
    [isLoadingMore, displayLimit, files]
  );

  function toggleSelection(id: string, checked: boolean) {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleFolderSelection(id: string, checked: boolean) {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
  }

  async function handleBulkDelete() {
    if (totalSelected === 0) return;
    const confirmed = window.confirm(`Delete ${totalSelected} selected items?`);
    if (!confirmed) return;
    try {
      await Promise.all([
        ...Array.from(selectedFileIds).map((id) => deleteFile(id)),
        ...Array.from(selectedFolderIds).map((id) => deleteFolder(id)),
      ]);
      toast.success(`${totalSelected} items deleted`);
      clearSelection();
      bumpUploadsVersion();
      bumpFoldersVersion();
    } catch {
      toast.error("Error deleting some files");
    }
  }

  function handleBulkMove() {
    toast.info("Move functionality coming soon!");
  }

  function handleBulkTag() {
    toast.info("Tag functionality coming soon!");
  }

  const displayedFiles = files?.slice(0, displayLimit) ?? null;

  return (
    <div 
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10"
      onClick={clearSelection}
    >
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
          <div className="mt-2.5 flex items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11.5px] font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <span className="flex items-center gap-1.5">
                <FileIcon className="size-[13px] opacity-80" strokeWidth={2.5} />
                <span className="tabular-nums">{files.length}</span>
                <span className="font-normal opacity-90">{files.length === 1 ? "file" : "files"}</span>
              </span>
              <span className="opacity-30">|</span>
              <span className="flex items-center gap-1.5">
                <TrendingDown className="size-[13px] opacity-80" strokeWidth={2.5} />
                <span className="tabular-nums">{formatBytes(totalSaved)}</span>
                <span className="font-normal opacity-90">saved</span>
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb + folder actions row */}
      <div className="flex w-full items-center justify-between gap-3">
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
          {activeFolder && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Rename coming soon")}
                className="h-8 gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="size-[14px]" strokeWidth={1.8} />
                <span>Rename</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Download coming soon")}
                className="h-8 gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:text-foreground"
              >
                <Download className="size-[14px]" strokeWidth={1.8} />
                <span>Download</span>
              </Button>
            </>
          )}
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
                selected={selectedFolderIds.has(folder.id)}
                onSelectChange={(c) => toggleFolderSelection(folder.id, c)}
                onClick={() => handleOpenFolder(folder)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters row */}
      <div className="flex w-full flex-wrap items-center gap-2">
        {/* Type filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 rounded-lg text-[13px] font-medium transition-colors",
                kind === "all"
                  ? "bg-muted/50 hover:bg-muted"
                  : "border-transparent bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <File className="size-[14px]" strokeWidth={2} />
              <span>{kind === "all" ? "Type" : kindLabel}</span>
              <ChevronDown className={cn("size-[14px]", kind === "all" ? "text-muted-foreground/70" : "text-primary/70")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-1">
            {KIND_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => setKind(opt.value)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 text-[13px] cursor-pointer",
                  kind === opt.value && "font-medium text-primary bg-primary/5"
                )}
              >
                <opt.icon className={cn("size-[16px]", kind === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">{opt.label}</span>
                {kind === opt.value && <Check className="size-[14px] text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 rounded-lg text-[13px] font-medium transition-colors",
                sort === "recent"
                  ? "bg-muted/50 hover:bg-muted"
                  : "border-transparent bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <ArrowUpDown className="size-[14px]" strokeWidth={2} />
              <span>{sort === "recent" ? "Sort" : sortLabel}</span>
              <ChevronDown className={cn("size-[14px]", sort === "recent" ? "text-muted-foreground/70" : "text-primary/70")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-1">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => setSort(opt.value)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 text-[13px] cursor-pointer",
                  sort === opt.value && "font-medium text-primary bg-primary/5"
                )}
              >
                <opt.icon className={cn("size-[16px]", sort === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">{opt.label}</span>
                {sort === opt.value && <Check className="size-[14px] text-primary" />}
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
        <>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {displayedFiles!.map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                selected={selectedFileIds.has(file.id)}
                onSelectChange={(c) => toggleSelection(file.id, c)}
              />
            ))}
          </div>
          {files && displayLimit < files.length && (
            <div ref={lastElementRef} className="mt-8 flex items-center justify-center pb-8">
              <Loader2 className="size-6 animate-spin text-primary/70" />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            {displayedFiles!.map((file) => (
              <FileRow 
                key={file.id} 
                file={file} 
                selected={selectedFileIds.has(file.id)}
                onSelectChange={(c) => toggleSelection(file.id, c)}
              />
            ))}
          </div>
          {files && displayLimit < files.length && (
            <div ref={lastElementRef} className="mt-8 flex items-center justify-center pb-8">
              <Loader2 className="size-6 animate-spin text-primary/70" />
            </div>
          )}
        </>
      )}

      {/* Bulk Actions Bar */}
      {totalSelected > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-50 flex pointer-events-none justify-center md:left-56">
          <div 
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/80 bg-white p-1.5 pl-4 text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-md animate-in slide-in-from-bottom-6 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-r border-border/70 pr-4 text-[13px] font-medium text-muted-foreground">
              <div className="flex size-[22px] items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white shadow-sm">
                {totalSelected}
              </div>
              selected
          </div>
          <div className="flex items-center gap-1 pl-1 pr-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBulkMove}
              className="h-8 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <FolderOpen className="size-[14px]" />
              Move
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBulkTag}
              className="h-8 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Tags className="size-[14px]" />
              Tag
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="h-8 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-[14px]" />
              Delete
            </Button>
          </div>
          <div className="ml-1 border-l border-border/70 pl-2 pr-1">
            <button
              onClick={clearSelection}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-[15px]" />
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
