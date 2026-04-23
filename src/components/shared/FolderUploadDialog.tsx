import { useEffect, useRef, useState } from "react";
import { FolderUp } from "lucide-react";
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
import {
  showCompressionProgressToast,
  showFolderUploadToast,
} from "@/components/shared/uploadToast";

async function runFolderUpload(fileList: FileList) {
  const toastId = `folder-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  showCompressionProgressToast({
    id: toastId,
    progressPercent: 0,
    fileIndex: 1,
    totalFiles: fileList.length,
  });

  try {
    const summary = await uploadFolder(fileList, (done, total) => {
      showCompressionProgressToast({
        id: toastId,
        progressPercent: total > 0 ? (done / total) * 100 : 0,
        fileIndex: Math.min(done + 1, total),
        totalFiles: total,
      });
    });

    if (summary.succeeded > 0) {
      showFolderUploadToast({
        id: toastId,
        fileCount: summary.succeeded,
        totalOriginalBytes: summary.totalOriginalBytes,
        totalStoredBytes: summary.totalStoredBytes,
        totalCompressionRatio:
          summary.totalOriginalBytes > 0
            ? (summary.totalOriginalBytes - summary.totalStoredBytes) / summary.totalOriginalBytes
            : 0,
        targetFolderName: undefined,
      });
    } else {
      toast.dismiss(toastId);
    }

    if (summary.failed > 0) {
      toast.error(`${summary.failed} file(s) failed to upload.`);
    }

    useUIStore.getState().bumpUploadsVersion();
    useUIStore.getState().bumpFoldersVersion();
  } catch (error) {
    toast.dismiss(toastId);
    toast.error("Folder upload failed. Please try again.");
    console.error("[FolderUploadDialog] uploadFolder error:", error);
  }
}

export default function FolderUploadDialog() {
  const open = useUIStore((s) => s.folderUploadDialogOpen);
  const closeFolderUpload = useUIStore((s) => s.closeFolderUpload);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!open) {
      setDragOver(false);
    }
  }, [open]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    // Close immediately so the user can keep working while compression runs.
    closeFolderUpload();
    void runFolderUpload(fileList);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    // Collect all files from dropped items (folders & files)
    const items = Array.from(e.dataTransfer.items);
    const dt = new DataTransfer();
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) dt.items.add(f);
      }
    }
    handleFiles(dt.files);
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
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
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
              : "border-primary/30 bg-[hsl(48_25%_98%)] hover:border-primary/50 hover:bg-primary/[0.04]"
          )}
        >
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-lg bg-white/80 text-primary",
              "ring-1 ring-border/70 shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)]"
            )}
          >
            <FolderUp className="size-5" strokeWidth={1.6} />
          </div>
          <p className="text-[13.5px] font-medium text-foreground">
            Drop a folder here or click to browse
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            All files inside the folder will be uploaded
          </p>

          {/* Hidden folder input */}
          <input
            ref={inputRef}
            type="file"
            // @ts-expect-error — webkitdirectory is a non-standard but widely supported attribute
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeFolderUpload}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
