/**
 * uploadToast.tsx
 * Shared rich toast helpers for file & folder upload events.
 * Keeps UploadDialog and FolderUploadDialog visually consistent.
 */
import { toast } from "sonner";
import {
  FileText,
  FileImage,
  FileVideo,
  FileCode,
  File as FileIcon,
  Folder as FolderIcon,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatPercent } from "@/lib/format";

// ─── File-type icon helper ────────────────────────────────────────────────────

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({ name, className }: { name: string; className?: string }) {
  const ext = fileExtension(name);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext);
  const isVideo = ["mp4", "mov", "avi", "webm", "mkv"].includes(ext);
  const isDoc   = ["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext);
  const isCode  = ["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "html", "css", "json"].includes(ext);

  const Ic = isImage ? FileImage : isVideo ? FileVideo : isDoc ? FileText : isCode ? FileCode : FileIcon;
  return <Ic className={className} strokeWidth={1.8} />;
}

// ─── Dismiss "×" button ───────────────────────────────────────────────────────

function DismissBtn({ id }: { id: string | number }) {
  return (
    <button
      type="button"
      onClick={() => toast.dismiss(id)}
      aria-label="Dismiss"
      className="flex size-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
    >
      ✕
    </button>
  );
}

// ─── Savings badge (replaces progress bar) ────────────────────────────────────
// A solid filled chip that reads unambiguously as a completed stat,
// not an in-progress indicator.

function SavingsBadge({ ratio }: { ratio: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5",
        "bg-emerald-50 ring-1 ring-emerald-200/70"
      )}
    >
      <TrendingDown className="size-[11px] text-emerald-600" strokeWidth={2.2} />
      <span className="text-[11px] font-semibold tabular-nums text-emerald-700">
        {formatPercent(ratio)} smaller
      </span>
    </span>
  );
}

// ─── File upload toast ────────────────────────────────────────────────────────

export interface FileUploadToastOptions {
  name: string;
  originalBytes: number;
  storedBytes: number;
  compressionRatio: number;
  targetFolderName?: string | null;
  duration?: number;
}

export function showFileUploadToast(opts: FileUploadToastOptions) {
  const {
    name,
    originalBytes,
    storedBytes,
    compressionRatio,
    targetFolderName,
    duration = 5000,
  } = opts;

  toast.custom(
    (id) => (
      <div
        className={cn(
          "flex w-[340px] items-start gap-3 rounded-xl border border-border/60 bg-white px-3.5 py-3",
          "shadow-[0_4px_24px_-4px_rgba(16,24,40,0.14),0_1px_0_rgba(16,24,40,0.02)]",
          "animate-in slide-in-from-bottom-3 fade-in duration-300"
        )}
      >
        {/* File-type badge */}
        <span
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
            "bg-primary/10 text-primary ring-1 ring-primary/20"
          )}
        >
          <FileTypeIcon name={name} className="size-[18px]" />
        </span>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* File name */}
          <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
            {name}
          </p>

          {/* Size comparison row */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{formatBytes(originalBytes)}</span>
            <ArrowRight className="size-[10px] shrink-0 opacity-50" strokeWidth={2} />
            <span className="tabular-nums">{formatBytes(storedBytes)}</span>
          </div>

          {/* Savings badge */}
          <SavingsBadge ratio={compressionRatio} />

          {/* Destination folder tag */}
          {targetFolderName && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <FolderIcon className="size-[11px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">{targetFolderName}</span>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <DismissBtn id={id} />
      </div>
    ),
    { duration }
  );
}

// ─── Folder upload summary toast ──────────────────────────────────────────────

export interface FolderUploadToastOptions {
  fileCount: number;
  totalOriginalBytes: number;
  totalStoredBytes: number;
  totalCompressionRatio: number; // aggregate 0..1
  targetFolderName?: string | null;
  duration?: number;
}

export function showFolderUploadToast(opts: FolderUploadToastOptions) {
  const {
    fileCount,
    totalOriginalBytes,
    totalStoredBytes,
    totalCompressionRatio,
    targetFolderName,
    duration = 6000,
  } = opts;

  toast.custom(
    (id) => (
      <div
        className={cn(
          "flex w-[340px] items-start gap-3 rounded-xl border border-border/60 bg-white px-3.5 py-3",
          "shadow-[0_4px_24px_-4px_rgba(16,24,40,0.14),0_1px_0_rgba(16,24,40,0.02)]",
          "animate-in slide-in-from-bottom-3 fade-in duration-300"
        )}
      >
        {/* Folder badge */}
        <span
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
            "bg-primary/10 text-primary ring-1 ring-primary/20"
          )}
        >
          <FolderIcon className="size-[18px]" strokeWidth={1.8} />
        </span>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Headline */}
          <p className="text-[13.5px] font-semibold leading-tight text-foreground">
            {fileCount} {fileCount === 1 ? "file" : "files"} uploaded
          </p>

          {/* Size comparison row */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{formatBytes(totalOriginalBytes)}</span>
            <ArrowRight className="size-[10px] shrink-0 opacity-50" strokeWidth={2} />
            <span className="tabular-nums">{formatBytes(totalStoredBytes)}</span>
          </div>

          {/* Savings badge */}
          <SavingsBadge ratio={totalCompressionRatio} />

          {/* Destination folder tag */}
          {targetFolderName && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <FolderIcon className="size-[11px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">{targetFolderName}</span>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <DismissBtn id={id} />
      </div>
    ),
    { duration }
  );
}
