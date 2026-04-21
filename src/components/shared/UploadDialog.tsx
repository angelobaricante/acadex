import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
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
import { uploadFile } from "@/lib/api";
import { formatBytes, formatPercent } from "@/lib/format";
import { toast } from "sonner";

export default function UploadDialog() {
  const uploadDialogOpen = useUIStore((s) => s.uploadDialogOpen);
  const closeUpload = useUIStore((s) => s.closeUpload);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!uploadDialogOpen) {
      setUploading(false);
      setDragOver(false);
    }
  }, [uploadDialogOpen]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    try {
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          toast.success(`Uploaded ${file.name}`, {
            description: `Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(
              result.storedBytes
            )} (${formatPercent(result.compressionRatio)} smaller).`,
          });
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      useUIStore.getState().bumpUploadsVersion();
      closeUpload();
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <Dialog
      open={uploadDialogOpen}
      onOpenChange={(o) => {
        if (!o) closeUpload();
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
            Upload files
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/90">
            AcaDex compresses uploads on the fly to save space without losing fidelity.
          </DialogDescription>
        </DialogHeader>

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
              <FileUp className="size-5" strokeWidth={1.6} />
            )}
          </div>
          <p className="text-[13.5px] font-medium text-foreground">
            {uploading ? "Compressing…" : "Drop files here or click to browse"}
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            PDF, DOCX, PPTX, images, video
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              // Reset so selecting the same file again retriggers onChange.
              e.target.value = "";
            }}
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
