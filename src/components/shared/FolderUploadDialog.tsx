import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FolderUp, Folder as FolderIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { listFolders, moveFileToFolder, uploadFile } from "@/lib/api";
import type { Folder } from "@/lib/types";
import { formatBytes, formatPercent } from "@/lib/format";
import { toast } from "sonner";

export default function FolderUploadDialog() {
  const open = useUIStore((s) => s.folderUploadDialogOpen);
  const closeFolderUpload = useUIStore((s) => s.closeFolderUpload);
  const currentFolderId = useUIStore((s) => s.currentFolderId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Load folders + seed initial target when dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setFolders(result);
    });
    setTargetFolderId(currentFolderId);
    return () => {
      cancelled = true;
    };
  }, [open, currentFolderId]);

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!open) {
      setUploading(false);
      setDragOver(false);
      setProgress(null);
    }
  }, [open]);

  const targetFolder = folders.find((f) => f.id === targetFolderId) ?? null;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadFile(file);
          if (targetFolderId) {
            try {
              await moveFileToFolder(result.id, targetFolderId);
            } catch {
              toast.error(`Couldn't move ${file.name} to '${targetFolder?.name ?? "folder"}'`);
            }
          }
          const sizeSummary = `Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(
            result.storedBytes
          )} (${formatPercent(result.compressionRatio)} smaller)`;
          toast.success(`Uploaded ${file.name}`, {
            description: targetFolder
              ? `${sizeSummary} → saved to '${targetFolder.name}'.`
              : `${sizeSummary}.`,
          });
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
        setProgress({ done: i + 1, total: files.length });
      }
      useUIStore.getState().bumpUploadsVersion();
      if (targetFolderId) {
        useUIStore.getState().bumpFoldersVersion();
      }
      closeFolderUpload();
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    // Collect all files from dropped items (folders & files)
    const items = Array.from(e.dataTransfer.items);
    const dt = new DataTransfer();
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) dt.items.add(f);
      }
    }
    void handleFiles(dt.files);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeFolderUpload();
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[440px] gap-5 p-6",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_20px_40px_-12px_rgba(16,24,40,0.18)]"
        )}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            Upload folder
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/90">
            Select a local folder to upload all its files at once. AcaDex compresses each file on the fly.
          </DialogDescription>
        </DialogHeader>

        {/* Destination folder picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Upload to
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-[12.5px] font-normal"
              >
                <FolderIcon
                  className="size-[14px] text-muted-foreground"
                  strokeWidth={1.8}
                />
                <span className="flex-1 truncate text-left text-foreground">
                  {targetFolder ? targetFolder.name : "All files"}
                </span>
                <ChevronDown className="size-[14px] text-muted-foreground/70" strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[calc(var(--radix-dropdown-menu-trigger-width))] p-1"
            >
              <DropdownMenuItem
                onSelect={() => setTargetFolderId(null)}
                className="gap-2 px-2 py-1.5 text-[13px]"
              >
                <FolderIcon
                  className="size-[14px] text-muted-foreground"
                  strokeWidth={1.8}
                />
                <span>All files</span>
                {targetFolderId === null && (
                  <Check
                    className="ml-auto size-[13px] text-primary"
                    strokeWidth={2}
                  />
                )}
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onSelect={() => setTargetFolderId(folder.id)}
                  className="gap-2 px-2 py-1.5 text-[13px]"
                >
                  <FolderIcon
                    className="size-[14px] text-muted-foreground"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">{folder.name}</span>
                  {targetFolderId === folder.id && (
                    <Check
                      className="ml-auto size-[13px] text-primary"
                      strokeWidth={2}
                    />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-disabled={uploading}
          onClick={() => {
            if (!uploading) inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2.5 rounded-xl px-6 py-10 text-center",
            "border-2 border-dashed transition-[background-color,border-color] duration-150 ease-out",
            "cursor-pointer select-none outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/50",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-primary/30 bg-[hsl(48_25%_98%)] hover:border-primary/50 hover:bg-primary/[0.04]",
            uploading && "cursor-not-allowed opacity-80"
          )}
        >
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-lg bg-white/80 text-primary",
              "ring-1 ring-border/70 shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)]"
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" strokeWidth={1.8} />
            ) : (
              <FolderUp className="size-5" strokeWidth={1.6} />
            )}
          </div>
          <p className="text-[13.5px] font-medium text-foreground">
            {uploading
              ? progress
                ? `Uploading ${progress.done} of ${progress.total} files…`
                : "Compressing…"
              : "Drop a folder here or click to browse"}
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            All files inside the folder will be uploaded
          </p>

          {/* Progress bar */}
          {uploading && progress && (
            <div className="w-full max-w-[180px] overflow-hidden rounded-full bg-primary/15 h-1.5">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}

          {/* Hidden folder input */}
          <input
            ref={inputRef}
            type="file"
            // @ts-expect-error — webkitdirectory is a non-standard but widely supported attribute
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeFolderUpload} disabled={uploading}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
