import { useEffect, useRef, useState } from "react";
import { FolderUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { uploadFolder } from "@/lib/api";
import { toast } from "sonner";
import { showFolderUploadToast } from "@/components/shared/uploadToast";

export default function FolderUploadDialog() {
  const open = useUIStore((s) => s.folderUploadDialogOpen);
  const closeFolderUpload = useUIStore((s) => s.closeFolderUpload);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingFolder) {
      const id = setTimeout(() => newFolderInputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [creatingFolder]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name || creatingSubmitting) return;
    setCreatingSubmitting(true);
    try {
      const folder = await createFolder(name);
      setFolders((prev) => [folder, ...prev]);
      setTargetFolderId(folder.id);
      setNewFolderName("");
      setCreatingFolder(false);
      useUIStore.getState().bumpFoldersVersion();
      toast.success(`Folder '${folder.name}' created`);
    } catch {
      toast.error("Couldn't create folder");
    } finally {
      setCreatingSubmitting(false);
    }
  }

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!open) {
      setUploading(false);
      setDragOver(false);
      setProgress(null);
    }
  }, [open]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: fileList.length });

    try {
      const summary = await uploadFolder(fileList, (done, total) => {
        setProgress({ done, total });
      });

      if (summary.succeeded > 0) {
        showFolderUploadToast({
          fileCount: summary.succeeded,
          totalOriginalBytes: summary.totalOriginalBytes,
          totalStoredBytes: summary.totalStoredBytes,
          totalCompressionRatio:
            summary.totalOriginalBytes > 0
              ? (summary.totalOriginalBytes - summary.totalStoredBytes) / summary.totalOriginalBytes
              : 0,
          targetFolderName: undefined,
        });
      }

      if (summary.failed > 0) {
        toast.error(`${summary.failed} file(s) failed to upload.`);
      }

      useUIStore.getState().bumpUploadsVersion();
      useUIStore.getState().bumpFoldersVersion();
      closeFolderUpload();
    } catch (error) {
      toast.error("Folder upload failed. Please try again.");
      console.error("[FolderUploadDialog] uploadFolder error:", error);
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
          "sm:max-w-[440px] gap-5 p-6 overflow-hidden",
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

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-disabled={uploading}
          onClick={openFolderPicker}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault();
              openFolderPicker();
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
              <BrandSpinner size={26} />
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
