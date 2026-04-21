import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  FolderOpen,
  LayoutGrid,
  List,
  Upload,
} from "lucide-react";
import { listFiles, type ListFilesParams } from "@/lib/api";
import type { ArchivedFile, FileKind } from "@/lib/types";
import { useSessionStore, useUIStore } from "@/lib/store";
import { useShellSearch } from "@/components/layout/AppShell";
import FileCard from "@/components/shared/FileCard";
import FileRow from "@/components/shared/FileRow";
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
  const uploadsVersion = useUIStore((s) => s.uploadsVersion);
  const { search } = useShellSearch();

  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [files, setFiles] = useState<ArchivedFile[] | null>(null);

  const ownerId =
    user?.role === "student" ? user.id : undefined;

  useEffect(() => {
    let cancelled = false;
    setFiles(null);
    const params: ListFilesParams = {
      query: search || undefined,
      sort,
      kind: kind === "all" ? undefined : kind,
      ownerId,
    };
    listFiles(params).then((result) => {
      if (cancelled) return;
      setFiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [search, kind, sort, ownerId, uploadsVersion]);

  const heading = user ? ROLE_HEADINGS[user.role] : ROLE_HEADINGS.student;
  const emptyCopy = user ? ROLE_EMPTY[user.role] : ROLE_EMPTY.student;
  const filtersActive = Boolean(search) || kind !== "all";

  const totalSaved = useMemo(() => {
    if (!files) return 0;
    return files.reduce((acc, f) => acc + (f.originalBytes - f.storedBytes), 0);
  }, [files]);

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Most recent";
  const kindLabel =
    KIND_OPTIONS.find((o) => o.value === kind)?.label ?? "All types";

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            filtersActive
              ? "No files match your filters"
              : emptyCopy.title
          }
          description={
            filtersActive
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
              <span>{filtersActive ? "Upload a file" : emptyCopy.cta}</span>
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
