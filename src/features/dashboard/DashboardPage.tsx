import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowUpDown,
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
  FolderUp,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Plus,
  Tags,
  Trash2,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import { deleteFile, deleteFolder, listFiles, listFolders } from "@/lib/api";
import type { ArchivedFile, FileKind, Folder } from "@/lib/types";
import { useSessionStore, useUIStore } from "@/lib/store";
import { useShellSearch } from "@/components/layout/AppShell";
import FileCard from "@/components/shared/FileCard";
import FileRow from "@/components/shared/FileRow";
import FolderTile from "@/components/shared/FolderTile";
// FolderActionsMenu is only used in FolderListRow
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SectionHeading from "@/components/shared/SectionHeading";
import ViewToggle from "@/components/shared/ViewToggle";
import SelectMenu from "@/components/shared/SelectMenu";
import FolderListRow from "@/components/shared/FolderListRow";
import { showDeleteToast } from "@/components/shared/deleteToast";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Checkbox is only used in FolderListRow
import { Skeleton } from "@/components/ui/skeleton";
// cn is only used in shared components
import { toast } from "sonner";

import type { SelectOption } from "@/components/shared/SelectMenu";
type KindFilter = "all" | "folder" | FileKind;
type SortKey = "recent" | "largest" | "most_saved";
type ViewMode = "grid" | "list";

const KIND_OPTIONS: SelectOption<KindFilter>[] = [
  { value: "all", label: "All types", icon: FileIcon },
  { value: "folder", label: "Folders", icon: FolderOpen },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "docx", label: "Word Documents", icon: FileText },
  { value: "pptx", label: "Presentations", icon: FileText },
  { value: "image", label: "Photos & images", icon: FileImage },
  { value: "video", label: "Videos", icon: FileVideo },
  { value: "other", label: "Other", icon: FileCode },
];

const SORT_OPTIONS: SelectOption<SortKey>[] = [
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
  const location = useLocation();
  const user = useSessionStore((s) => s.user);
  const openUpload = useUIStore((s) => s.openUpload);
  const openNewFolder = useUIStore((s) => s.openNewFolder);
  const openFolderUpload = useUIStore((s) => s.openFolderUpload);
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
  const [allFolders, setAllFolders] = useState<Folder[] | null>(null);
  const [allFiles, setAllFiles] = useState<ArchivedFile[] | null>(null);
  const [folderTrail, setFolderTrail] = useState<Folder[]>([]);
  const [displayLimit, setDisplayLimit] = useState(16);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [fileSelectionAnchorId, setFileSelectionAnchorId] = useState<string | null>(null);
  const [folderSelectionAnchorId, setFolderSelectionAnchorId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [confirmDeleteFolderOpen, setConfirmDeleteFolderOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [folderGridColumns, setFolderGridColumns] = useState(5);

  const totalSelected = selectedFileIds.size + selectedFolderIds.size;
  const liveFolderById = useMemo(() => {
    if (!allFolders) return null;
    return new Map(allFolders.map((folder) => [folder.id, folder]));
  }, [allFolders]);

  const normalizedFolderTrail = useMemo(() => {
    if (!liveFolderById) return folderTrail;

    const nextTrail: Folder[] = [];
    for (const folder of folderTrail) {
      const liveFolder = liveFolderById.get(folder.id);
      if (!liveFolder) break;
      nextTrail.push(liveFolder);
    }

    return nextTrail;
  }, [folderTrail, liveFolderById]);

  const activeFolder = normalizedFolderTrail.length > 0 ? normalizedFolderTrail[normalizedFolderTrail.length - 1] : null;

  useEffect(() => {
    const state = location.state as { folderTrail?: Folder[] } | null;
    if (state?.folderTrail && Array.isArray(state.folderTrail)) {
      setFolderTrail(state.folderTrail);
    }
  }, [location.key, location.state]);

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

  // Match folder grid breakpoints so "View more" always maps to 2 visible rows.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateFolderGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setFolderGridColumns(5);
      } else if (width >= 1024) {
        setFolderGridColumns(4);
      } else if (width >= 640) {
        setFolderGridColumns(3);
      } else {
        setFolderGridColumns(2);
      }
    };

    updateFolderGridColumns();
    window.addEventListener("resize", updateFolderGridColumns);
    return () => {
      window.removeEventListener("resize", updateFolderGridColumns);
    };
  }, []);

  // Fetch folders list on mount / when they change.
  // When inside a folder, fetch subfolders; when at root, fetch root-level folders.
  useEffect(() => {
    let cancelled = false;
    const targetFolderId = activeFolder?.id ?? null;
    listFolders(targetFolderId).then((result) => {
      if (cancelled) return;
      setFolders(result);
    });
    return () => {
      cancelled = true;
    };
  }, [foldersVersion, uploadsVersion, activeFolder]);

  // Keep a flat snapshot of all folders so folder tiles can show deep counts.
  useEffect(() => {
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setAllFolders(result);
    });
    return () => {
      cancelled = true;
    };
  }, [foldersVersion]);

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

  // Keep selection sets in sync with live data so deleted items don't leave stale FAB counts.
  useEffect(() => {
    if (!allFolders) return;
    const validFolderIds = new Set(allFolders.map((folder) => folder.id));
    setSelectedFolderIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (validFolderIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allFolders]);

  useEffect(() => {
    if (!liveFolderById) return;

    setFolderTrail((prev) => {
      const nextTrail: Folder[] = [];
      for (const folder of prev) {
        const liveFolder = liveFolderById.get(folder.id);
        if (!liveFolder) break;
        nextTrail.push(liveFolder);
      }

      if (
        nextTrail.length === prev.length &&
        nextTrail.every((folder, index) => folder.id === prev[index].id)
      ) {
        return prev;
      }

      return nextTrail;
    });
  }, [liveFolderById]);

  useEffect(() => {
    if (!allFiles) return;
    const validFileIds = new Set(allFiles.map((file) => file.id));
    setSelectedFileIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (validFileIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allFiles]);

  // Derive the displayed list via memo — no network calls on filter changes.
  const files = useMemo<ArchivedFile[] | null>(() => {
    if (allFiles === null) return null;
    let result = allFiles;
    if (activeFolder) {
      result = result.filter((f) => f.folderId === activeFolder.id);
    }
    if (kind !== "all" && kind !== "folder") {
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

  const stats = useMemo(() => {
    if (!files) return { saved: 0, original: 0, percent: 0 };
    let saved = 0;
    let original = 0;
    for (const f of files) {
      saved += (f.originalBytes - f.storedBytes);
      original += f.originalBytes;
    }
    const percent = original > 0 ? Math.round((saved / original) * 100) : 0;
    return { saved, original, percent };
  }, [files]);

  function buildRangeSelection(ids: string[], anchorId: string, targetId: string) {
    const anchorIndex = ids.indexOf(anchorId);
    const targetIndex = ids.indexOf(targetId);
    if (anchorIndex === -1 || targetIndex === -1) return null;

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    return new Set(ids.slice(start, end + 1));
  }

  const folderMetricsByFolder = useMemo(() => {
    const metrics: Record<string, { count: number; originalBytes: number; savedBytes: number }> = {};
    if (!allFiles || !allFolders) return metrics;

    const childFoldersByParent = new Map<string, string[]>();
    for (const folder of allFolders) {
      const parentFolderId = folder.parentFolderId ?? null;
      if (parentFolderId === null) continue;
      const siblings = childFoldersByParent.get(parentFolderId) ?? [];
      siblings.push(folder.id);
      childFoldersByParent.set(parentFolderId, siblings);
    }

    const directFileMetrics = new Map<string, { count: number; originalBytes: number; savedBytes: number }>();
    for (const file of allFiles) {
      if (!file.folderId) continue;
      const current = directFileMetrics.get(file.folderId) ?? {
        count: 0,
        originalBytes: 0,
        savedBytes: 0,
      };
      current.count += 1;
      current.originalBytes += file.originalBytes;
      current.savedBytes += (file.originalBytes - file.storedBytes);
      directFileMetrics.set(file.folderId, current);
    }

    const folderMetricsCache = new Map<string, { count: number; originalBytes: number; savedBytes: number }>();
    const collectFolderMetrics = (folderId: string): { count: number; originalBytes: number; savedBytes: number } => {
      const cached = folderMetricsCache.get(folderId);
      if (cached !== undefined) return cached;

      const direct = directFileMetrics.get(folderId) ?? {
        count: 0,
        originalBytes: 0,
        savedBytes: 0,
      };
      let total = {
        count: direct.count,
        originalBytes: direct.originalBytes,
        savedBytes: direct.savedBytes,
      };

      for (const childFolderId of childFoldersByParent.get(folderId) ?? []) {
        const child = collectFolderMetrics(childFolderId);
        total = {
          count: total.count + child.count,
          originalBytes: total.originalBytes + child.originalBytes,
          savedBytes: total.savedBytes + child.savedBytes,
        };
      }

      folderMetricsCache.set(folderId, total);
      return total;
    };

    for (const folder of allFolders) {
      metrics[folder.id] = collectFolderMetrics(folder.id);
    }

    return metrics;
  }, [allFiles, allFolders]);

  const fileCountsByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [folderId, metric] of Object.entries(folderMetricsByFolder)) {
      counts[folderId] = metric.count;
    }
    return counts;
  }, [folderMetricsByFolder]);

  const displayedFolders = useMemo(() => {
    if (!folders) return null;

    let result = folders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((folder) => folder.name.toLowerCase().includes(q));
    }

    const sorted = [...result];
    if (sort === "recent") {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "largest") {
      sorted.sort(
        (a, b) =>
          (folderMetricsByFolder[b.id]?.originalBytes ?? 0) -
          (folderMetricsByFolder[a.id]?.originalBytes ?? 0)
      );
    } else {
      sorted.sort(
        (a, b) =>
          (folderMetricsByFolder[b.id]?.savedBytes ?? 0) -
          (folderMetricsByFolder[a.id]?.savedBytes ?? 0)
      );
    }

    return sorted;
  }, [folders, search, sort, folderMetricsByFolder]);

  const showFoldersStrip = displayedFolders !== null && displayedFolders.length > 0;
  const showFoldersSection = kind === "all" || kind === "folder";
  const showFilesSection = kind !== "folder";
  const isFoldersLoading = showFoldersSection && displayedFolders === null;
  const isFilesLoading = showFilesSection && files === null;
  const hasFolders = displayedFolders !== null && displayedFolders.length > 0;
  const hasFiles = files !== null && files.length > 0;
  const showMergedEmptyState =
    showFoldersSection &&
    showFilesSection &&
    !isFoldersLoading &&
    !isFilesLoading &&
    !hasFolders &&
    !hasFiles;
  const showFolderEmptyState =
    showFoldersSection &&
    !showFoldersStrip &&
    !showMergedEmptyState &&
    !(showFilesSection && hasFiles);
  const showFilesContentSection =
    showFilesSection &&
    !showMergedEmptyState &&
    !(showFoldersSection && hasFolders && !hasFiles);

  const canDeleteActiveFolder =
    activeFolder !== null &&
    user !== null &&
    (user.role === "admin" || activeFolder.ownerId === user.id);

  function handleOpenFolder(folder: Folder) {
    clearSelection();
    setFolderTrail((prev) => [...prev, folder]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleNavigateToTrailIndex(index: number) {
    clearSelection();
    setFolderTrail((prev) => prev.slice(0, index + 1));
  }

  function handleNavigateToRoot() {
    clearSelection();
    setFolderTrail([]);
  }

  async function handleDeleteActiveFolder() {
    if (!activeFolder) return;
    try {
      await deleteFolder(activeFolder.id);
      showDeleteToast({ kind: "folder", name: activeFolder.name });
      setFolderTrail((prev) => prev.slice(0, -1));
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

  function toggleSelection(id: string, checked: boolean, shiftKey = false) {
    setSelectedFolderIds(new Set());
    setFolderSelectionAnchorId(null);

    const fileIds = files?.map((file) => file.id) ?? [];
    const nextRange = shiftKey && fileSelectionAnchorId
      ? buildRangeSelection(fileIds, fileSelectionAnchorId, id)
      : null;

    setSelectedFileIds(() => {
      if (nextRange) return nextRange;
      return checked ? new Set([id]) : new Set();
    });

    if (!shiftKey || !nextRange) {
      setFileSelectionAnchorId(checked ? id : null);
    }
  }

  function toggleFolderSelection(id: string, checked: boolean, shiftKey = false) {
    setSelectedFileIds(new Set());
    setFileSelectionAnchorId(null);

    const folderIds = displayedFolders?.map((folder) => folder.id) ?? [];
    const nextRange = shiftKey && folderSelectionAnchorId
      ? buildRangeSelection(folderIds, folderSelectionAnchorId, id)
      : null;

    setSelectedFolderIds(() => {
      if (nextRange) return nextRange;
      return checked ? new Set([id]) : new Set();
    });

    if (!shiftKey || !nextRange) {
      setFolderSelectionAnchorId(checked ? id : null);
    }
  }

  function clearSelection() {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    setFileSelectionAnchorId(null);
    setFolderSelectionAnchorId(null);
  }

  async function handleBulkDelete() {
    if (totalSelected === 0) return;
    try {
      await Promise.all([
        ...Array.from(selectedFileIds).map((id) => deleteFile(id)),
        ...Array.from(selectedFolderIds).map((id) => deleteFolder(id)),
      ]);
      showDeleteToast({ kind: "bulk", count: totalSelected });
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
        {showFilesSection && files && (
          <div className="mt-2.5 flex items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11.5px] font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
              <span className="flex items-center gap-1.5">
                <FileIcon className="size-[13px] opacity-80" strokeWidth={2.5} />
                <span className="tabular-nums">{files.length}</span>
                <span className="font-normal opacity-90">{files.length === 1 ? "file" : "files"}</span>
              </span>
              <span className="opacity-30">|</span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="size-[14px] -rotate-90" fill="none" strokeWidth="3.5">
                  <circle cx="12" cy="12" r="9" className="stroke-primary/20" />
                  <circle 
                    cx="12" cy="12" r="9" 
                    className="stroke-primary transition-all duration-500 ease-out" 
                    strokeDasharray="56.5" 
                    strokeDashoffset={56.5 - (56.5 * stats.percent) / 100} 
                    strokeLinecap="round"
                  />
                </svg>
                <span className="tabular-nums">{formatBytes(stats.saved)}</span>
                <span className="font-normal opacity-90">saved vs original</span>
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
                onClick={handleNavigateToRoot}
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                All files
              </button>
              {normalizedFolderTrail.map((folder, index) => {
                const isLast = index === normalizedFolderTrail.length - 1;
                return (
                  <div key={folder.id} className="flex min-w-0 items-center gap-1.5">
                    <ChevronRight
                      className="size-[14px] shrink-0 text-muted-foreground/60"
                      strokeWidth={1.8}
                    />
                    {isLast ? (
                      <span className="truncate font-semibold text-foreground">
                        {folder.name}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigateToTrailIndex(index)}
                        className="truncate text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {folder.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <span className="font-semibold text-foreground">All files</span>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {activeFolder ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-[14px]" strokeWidth={1.8} />
                  <span>Actions</span>
                  <ChevronDown className="size-[13px] text-muted-foreground/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuItem
                  onSelect={() => toast.info("Rename coming soon")}
                  className="gap-2 px-2 py-1.5 text-[13px]"
                >
                  <Edit2 className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => toast.info("Download coming soon")}
                  className="gap-2 px-2 py-1.5 text-[13px]"
                >
                  <Download className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                  <span>Download</span>
                </DropdownMenuItem>
                {canDeleteActiveFolder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setConfirmDeleteFolderOpen(true)}
                      className="gap-2 px-2 py-1.5 text-[13px]"
                    >
                      <Trash2 className="size-[14px]" strokeWidth={1.8} />
                      <span>Delete folder</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 rounded-lg border-transparent bg-[#2d8a56] px-3 text-[13px] font-medium text-white hover:bg-[#247045]"
              >
                <Plus className="size-[14px]" strokeWidth={2.5} />
                <span>New Upload</span>
                <ChevronDown className="size-[13px] opacity-80" strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1">
              <DropdownMenuItem
                onSelect={openNewFolder}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px]"
              >
                <FolderOpen className="size-[15px] text-muted-foreground" strokeWidth={1.8} />
                <span>New Folder</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={openUpload}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px]"
              >
                <Upload className="size-[15px] text-muted-foreground" strokeWidth={1.8} />
                <span>File Upload</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={openFolderUpload}
                className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px]"
              >
                <FolderUp className="size-[15px] text-muted-foreground" strokeWidth={1.8} />
                <span>Folder Upload</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Filters row */}
      <div className="flex w-full flex-wrap items-center gap-2">
        <SelectMenu
          selected={kind}
          defaultLabel="Type"
          options={KIND_OPTIONS}
          onSelect={setKind}
          leadingIcon={File}
        />
        <SelectMenu
          selected={sort}
          defaultLabel="Sort"
          options={SORT_OPTIONS}
          onSelect={setSort}
          leadingIcon={ArrowUpDown}
        />
      </div>

      {/* Folders grid */}
      {showFoldersSection && showFoldersStrip && (() => {
        const MAX_VISIBLE_ROWS = 2;
        const MAX_VISIBLE = view === "grid" ? folderGridColumns * MAX_VISIBLE_ROWS : 8;
        const hasMore = displayedFolders!.length > MAX_VISIBLE;
        const visibleFolders = hasMore && !foldersExpanded
          ? displayedFolders!.slice(0, MAX_VISIBLE)
          : displayedFolders!;

        return (
          <section className="flex flex-col gap-2">
            <SectionHeading label="Folders" />

            {view === "grid" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleFolders.map((folder) => (
                  <FolderTile
                    key={folder.id}
                    folder={folder}
                    fileCount={fileCountsByFolder[folder.id] ?? 0}
                    selected={selectedFolderIds.has(folder.id)}
                    onSelectChange={(c, shiftKey) => toggleFolderSelection(folder.id, c, shiftKey)}
                    onClick={() => handleOpenFolder(folder)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {visibleFolders.map((folder) => {
                  const selected = selectedFolderIds.has(folder.id);
                  const count = fileCountsByFolder[folder.id] ?? 0;
                  return (
                    <FolderListRow
                      key={folder.id}
                      folder={folder}
                      selected={selected}
                      count={count}
                      onSelect={(checked, shiftKey) => toggleFolderSelection(folder.id, checked, shiftKey)}
                      onOpen={() => handleOpenFolder(folder)}
                    />
                  );
                })}
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFoldersExpanded((v) => !v);
                }}
                className="self-start text-[12px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                {foldersExpanded ? "View less" : "View more"}
              </button>
            )}
          </section>
        );
      })()}

      {showFolderEmptyState && (
        <EmptyState
          icon={<FolderOpen />}
          title={search ? "No folders match your search" : "No folders yet"}
          description={
            search
              ? "Try clearing the search or selecting another type."
              : "Create a folder to organize your archive."
          }
        />
      )}

      {showMergedEmptyState && (
        <EmptyState
          icon={<FolderOpen />}
          title={
            activeFolder ? (
              <>
                This folder is empty: <strong>{activeFolder.name}</strong>
              </>
            ) : (
              "Your archive is empty"
            )
          }
          description={
            activeFolder
              ? "Upload a file or create a subfolder to get started here."
              : "Create your first folder or upload your first file to get started."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={openUpload}
                className="h-8 gap-1.5 rounded-lg border-transparent bg-[#2d8a56] px-3 text-[13px] font-medium text-white hover:bg-[#247045]"
              >
                <Upload className="size-[14px]" />
                <span>Upload a file</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openNewFolder}
                className="h-8 gap-1.5 rounded-lg px-3 text-[13px] font-medium"
              >
                <FolderOpen className="size-[14px]" />
                <span>New folder</span>
              </Button>
            </div>
          }
        />
      )}

      {showFilesContentSection && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center">
            <SectionHeading label="Files" />
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
                  ? <>
                      This folder is empty: <strong>{activeFolder.name}</strong>
                    </>
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
            />
          ) : view === "grid" ? (
            <>
              <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {displayedFiles!.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    folderTrail={folderTrail}
                    selected={selectedFileIds.has(file.id)}
                    onSelectChange={(c, shiftKey) => toggleSelection(file.id, c, shiftKey)}
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
                    folderTrail={folderTrail}
                    selected={selectedFileIds.has(file.id)}
                    onSelectChange={(c, shiftKey) => toggleSelection(file.id, c, shiftKey)}
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
        </section>
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
              onClick={() => setConfirmBulkDeleteOpen(true)}
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

      {/* Confirmation modals */}
      <ConfirmDialog
        open={confirmDeleteFolderOpen}
        onOpenChange={setConfirmDeleteFolderOpen}
        title="Delete folder?"
        description={`"${activeFolder?.name}" will be permanently deleted. Files inside will be moved to All files.`}
        confirmLabel="Delete folder"
        onConfirm={() => void handleDeleteActiveFolder()}
      />
      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={`Delete ${totalSelected} ${totalSelected === 1 ? "item" : "items"}?`}
        description="Selected files and folders will be permanently deleted and cannot be recovered."
        confirmLabel="Delete all"
        onConfirm={() => void handleBulkDelete()}
      />
    </div>
  );
}
