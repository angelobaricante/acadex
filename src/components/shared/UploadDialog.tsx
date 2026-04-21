import { useEffect, useRef, useState } from "react";
import { Check, FileUp, Folder as FolderIcon, Loader2 } from "lucide-react";
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

export default function UploadDialog() {
  const uploadDialogOpen = useUIStore((s) => s.uploadDialogOpen);
  const closeUpload = useUIStore((s) => s.closeUpload);
  const currentFolderId = useUIStore((s) => s.currentFolderId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  // Load folders + seed initial target when dialog opens.
  useEffect(() => {
    if (!uploadDialogOpen) return;
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setFolders(result);
    });
    setTargetFolderId(currentFolderId);
    return () => {
      cancelled = true;
    };
  }, [uploadDialogOpen, currentFolderId]);

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!uploadDialogOpen) {
      setUploading(false);
      setDragOver(false);
    }
  }, [uploadDialogOpen]);

  const targetFolder = folders.find((f) => f.id === targetFolderId) ?? null;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    try {
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          if (targetFolderId) {
            try {
              await moveFileToFolder(result.id, targetFolderId);
            } catch {
              // Surface as a soft warning; upload itself succeeded.
              toast.error(`Couldn't move ${file.name} to '${targetFolder?.name ?? "folder"}'`);
            }
          }
          const sizeSummary = `Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(
            result.storedBytes
          )} (${formatPercent(result.compressionRatio)} smaller)`;
          toast.success(`Uploaded ${file.name}`, {
            description: targetFolder
              ? `${sizeSummary} → uploaded to '${targetFolder.name}'.`
              : `${sizeSummary}.`,
          });
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      useUIStore.getState().bumpUploadsVersion();
      if (targetFolderId) {
        useUIStore.getState().bumpFoldersVersion();
      }
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

        {/* Folder picker */}
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
                <span className="truncate text-foreground">
                  {targetFolder ? targetFolder.name : "All files"}
                </span>
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
